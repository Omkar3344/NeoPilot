from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
import cv2
import asyncio
import json
import logging
import base64
import numpy as np
from io import BytesIO
import time
from typing import Dict, List
import yaml

from gesture_system.gesture_pipeline import GesturePipeline
from drone_simulator import DroneSimulator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
gesture_pipeline = None
drone_simulator = DroneSimulator()
camera = None
connected_clients: List[WebSocket] = []
config = None
camera_source = "laptop"  # "laptop" or "phone"
phone_camera_url = None

# Load configuration
def load_config():
    global config
    try:
        with open('config.yaml', 'r') as f:
            config = yaml.safe_load(f)
        logger.info("Configuration loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load config.yaml: {e}. Using defaults.")
        config = {
            'hand_detection': {
                'min_detection_confidence': 0.8,
                'min_tracking_confidence': 0.7
            },
            'gesture_classification': {
                'min_confidence': 0.7
            },
            'temporal_smoothing': {
                'consistency_frames': 5,
                'cooldown_time': 0.5
            },
            'visualization': {
                'enable': True
            }
        }
    return config

# Initialize camera based on source
def initialize_camera(source="laptop", ip_address=None):
    global camera, camera_source, phone_camera_url
    
    # Release existing camera if any
    if camera is not None:
        camera.release()
        camera = None
        # Small delay to ensure proper release
        time.sleep(0.1)
    
    try:
        if source == "laptop":
            # Use laptop camera with optimized settings
            device_id = config.get('camera', {}).get('laptop', {}).get('device_id', 0)
            camera = cv2.VideoCapture(device_id, cv2.CAP_DSHOW)  # DirectShow for Windows - faster
            
            # Set properties BEFORE opening to avoid lag
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            camera.set(cv2.CAP_PROP_FPS, 30)
            camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimal buffer
            camera.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))  # MJPEG codec - faster
            
            camera_source = "laptop"
            logger.info("Laptop camera initialized with optimized settings")
        elif source == "phone" and ip_address:
            # Use phone camera via IP Webcam with optimized settings
            stream_path = config.get('camera', {}).get('phone', {}).get('stream_path', '/video')
            phone_camera_url = f"http://{ip_address}{stream_path}"
            
            # Use FFMPEG backend for better network streaming
            camera = cv2.VideoCapture(phone_camera_url, cv2.CAP_FFMPEG)
            
            # Optimize for network streaming
            camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimal buffer - critical for reducing lag
            camera.set(cv2.CAP_PROP_FPS, 30)
            
            camera_source = "phone"
            logger.info(f"Phone camera initialized with FFMPEG: {phone_camera_url}")
        else:
            raise ValueError(f"Invalid camera source: {source}")
        
        # Verify camera opened
        if not camera.isOpened():
            raise Exception(f"Failed to open {source} camera")
        
        # Warm up camera - grab and discard first few frames (often corrupted)
        for _ in range(5):
            camera.grab()
        
        logger.info(f"Camera warmed up and ready: {source}")
        return True
    except Exception as e:
        logger.error(f"Error initializing {source} camera: {e}")
        camera = None
        return False

# Initialize camera and gesture pipeline
def initialize_systems():
    global gesture_pipeline, camera, config, camera_source
    
    try:
        # Load configuration
        config = load_config()
        
        # Initialize gesture pipeline with improved detection system
        gesture_pipeline = GesturePipeline(
            min_detection_confidence=config['hand_detection']['min_detection_confidence'],
            min_tracking_confidence=config['hand_detection']['min_tracking_confidence'],
            min_gesture_confidence=config['gesture_classification']['min_confidence'],
            consistency_frames=config['temporal_smoothing']['consistency_frames'],
            cooldown_time=config['temporal_smoothing']['cooldown_time'],
            enable_visualization=config['visualization']['enable']
        )
        logger.info("Improved gesture pipeline initialized successfully")
        
        # Initialize camera based on config
        default_source = config.get('camera', {}).get('default_source', 'laptop')
        camera_source = default_source
        initialize_camera(default_source)
        
    except Exception as e:
        logger.error(f"Error initializing systems: {e}")
        raise e

def cleanup_systems():
    """Cleanup systems on shutdown"""
    global camera, gesture_pipeline
    if camera:
        camera.release()
    if gesture_pipeline:
        gesture_pipeline.close()
    cv2.destroyAllWindows()
    logger.info("Systems cleaned up successfully")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialize_systems()
    yield
    # Shutdown
    cleanup_systems()

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="NeoPilot",
    description="Real-time ML-based hand gesture recognition for drone control",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "NeoPilot API",
        "status": "active",
        "endpoints": {
            "websocket": "/ws",
            "drone_status": "/drone/status",
            "drone_reset": "/drone/reset"
        }
    }

@app.get("/drone/status")
async def get_drone_status():
    """Get current drone status"""
    return drone_simulator.get_status()

@app.post("/drone/reset")
async def reset_drone():
    """Reset drone to initial state"""
    return drone_simulator.reset()

@app.get("/gestures")
async def get_available_gestures():
    """Get list of all available gestures with descriptions"""
    if gesture_pipeline is None:
        raise HTTPException(status_code=503, detail="Gesture system not initialized")
    return gesture_pipeline.get_all_gestures()

@app.get("/stats")
async def get_statistics():
    """Get performance and detection statistics"""
    if gesture_pipeline is None:
        raise HTTPException(status_code=503, detail="Gesture system not initialized")
    return gesture_pipeline.get_statistics()

@app.post("/sensitivity/{level}")
async def set_sensitivity(level: str):
    """
    Set gesture detection sensitivity
    Levels: low (stable), medium (balanced), high (responsive)
    """
    if gesture_pipeline is None:
        raise HTTPException(status_code=503, detail="Gesture system not initialized")
    
    if level not in ['low', 'medium', 'high']:
        raise HTTPException(status_code=400, detail="Invalid sensitivity level")
    
    gesture_pipeline.adjust_sensitivity(level)
    return {"message": f"Sensitivity set to {level}", "level": level}

class DroneCommand(BaseModel):
    command: str

@app.post("/drone/command")
async def execute_drone_command(cmd: DroneCommand):
    """
    Execute a drone command via keyboard input
    Accepts commands: "go_forward", "back", "left", "right", "up", "down", "stop", "land", "reset"
    """
    valid_commands = ["go_forward", "back", "left", "right", "up", "down", "stop", "land", "reset"]
    command = cmd.command
    
    if command not in valid_commands:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid command. Valid commands are: {', '.join(valid_commands)}"
        )
    
    # Handle reset command specially
    if command == "reset":
        result = drone_simulator.reset()
        logger.info(f"Drone reset via command")
        return result
    
    # Execute command with confidence 1.0 (keyboard input is reliable)
    result = drone_simulator.execute_gesture_command(command, confidence=1.0)
    logger.info(f"Keyboard command executed: {command}")
    
    return result

@app.post("/drone/stop/{direction}")
async def stop_drone_movement(direction: str):
    """
    Stop movement in a specific direction
    Accepts: "go_forward", "back", "left", "right", "up", "down"
    """
    valid_directions = ["go_forward", "back", "left", "right", "up", "down"]
    if direction not in valid_directions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid direction. Valid directions are: {', '.join(valid_directions)}"
        )
    
    drone_simulator.stop_movement(direction)
    return {"message": f"Stopped movement: {direction}", **drone_simulator.get_status()}

@app.get("/camera/status")
async def get_camera_status():
    """Get current camera source and status"""
    global camera_source, phone_camera_url
    return {
        "source": camera_source,
        "is_connected": camera is not None and camera.isOpened(),
        "phone_url": phone_camera_url if camera_source == "phone" else None
    }

@app.post("/camera/switch")
async def switch_camera(source: str, ip_address: str = None):
    """
    Switch camera source between laptop and phone
    
    Args:
        source: "laptop" or "phone"
        ip_address: Required for phone camera (e.g., "192.168.1.100:8080")
    """
    if source not in ['laptop', 'phone']:
        raise HTTPException(status_code=400, detail="Invalid camera source. Use 'laptop' or 'phone'")
    
    if source == "phone" and not ip_address:
        raise HTTPException(status_code=400, detail="IP address required for phone camera")
    
    success = initialize_camera(source, ip_address)
    
    if success:
        return {
            "message": f"Switched to {source} camera",
            "source": camera_source,
            "is_connected": camera is not None and camera.isOpened()
        }
    else:
        raise HTTPException(status_code=500, detail=f"Failed to initialize {source} camera")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time gesture detection and drone control
    """
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")
    
    frame_count = 0
    last_time = time.time()
    
    try:
        while True:
            frame_start = time.time()
            
            # Capture frame from camera
            if camera is None or not camera.isOpened():
                # Update physics even when camera is not available
                # This ensures keyboard/button controls still work
                drone_simulator.update_physics()
                
                await websocket.send_json({
                    "error": "Camera not available",
                    "drone_status": drone_simulator.get_status(),
                    "gesture": {
                        "name": None,
                        "confidence": 0.0
                    },
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.04)  # Match the same frame rate as normal operation
                continue
            
            ret, frame = camera.read()
            if not ret:
                # Update physics even when frame capture fails
                # This ensures keyboard/button controls still work
                drone_simulator.update_physics()
                
                await websocket.send_json({
                    "error": "Failed to capture frame",
                    "drone_status": drone_simulator.get_status(),
                    "gesture": {
                        "name": None,
                        "confidence": 0.0
                    },
                    "timestamp": time.time()
                })
                await asyncio.sleep(0.04)  # Match the same frame rate as normal operation
                continue
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process gesture detection on every frame for continuous tracking
            frame_count += 1
            gesture_name, confidence, is_new_gesture = None, 0.0, False
            
            if gesture_pipeline is not None:
                try:
                    # Process every frame for continuous hand tracking visualization
                    gesture_name, confidence, is_new_gesture, annotated_frame = gesture_pipeline.process_frame(frame)
                    # Always use annotated frame to show continuous hand landmarks
                    frame = annotated_frame
                except Exception as e:
                    logger.error(f"Error in gesture detection: {e}")
            
            # Execute drone command ONLY on new stable gestures
            drone_response = drone_simulator.get_status()
            if gesture_name and is_new_gesture:
                logger.info(f"Executing command for new gesture: {gesture_name} (confidence: {confidence:.2f})")
                drone_response = drone_simulator.execute_gesture_command(gesture_name, confidence)
            
            # Update telemetry
            drone_simulator.update_physics()
            
            # Resize frame for faster transmission (optional - maintains aspect ratio)
            height, width = frame.shape[:2]
            if width > 640:
                scale = 640 / width
                new_width = 640
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_LINEAR)
            
            # Convert frame to base64 with higher quality
            encode_params = [
                cv2.IMWRITE_JPEG_QUALITY, 95,  # Higher quality (was 80)
                cv2.IMWRITE_JPEG_OPTIMIZE, 1    # Optimize encoding
            ]
            _, buffer = cv2.imencode('.jpg', frame, encode_params)
            frame_base64 = base64.b64encode(buffer.tobytes()).decode('utf-8')
            
            # Send data to frontend
            response_data = {
                "frame": frame_base64,
                "gesture": {
                    "name": gesture_name,
                    "confidence": confidence
                },
                "drone_status": drone_response,
                "timestamp": time.time()
            }
            
            await websocket.send_json(response_data)
            
            # Dynamic frame rate control - maintain ~25 FPS for smooth continuous tracking
            elapsed = time.time() - frame_start
            target_frame_time = 0.04  # 25 FPS - balance between smoothness and performance
            sleep_time = max(0.001, target_frame_time - elapsed)
            await asyncio.sleep(sleep_time)
            
            # Log FPS occasionally
            if frame_count % 100 == 0:
                current_time = time.time()
                fps = 100 / (current_time - last_time)
                logger.info(f"Streaming FPS: {fps:.1f}")
                last_time = current_time
            
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        logger.info(f"Client removed. Total clients: {len(connected_clients)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        reload_includes=["*.py", "*.yaml"],
        reload_excludes=["__pycache__", "*.pyc", "venv"],
        log_level="info",
        use_colors=True,
        access_log=False  # Disable access logs for better performance
    )
