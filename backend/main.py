from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
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

# Initialize camera and gesture pipeline
def initialize_systems():
    global gesture_pipeline, camera, config
    
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
        
        # Initialize camera
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        camera.set(cv2.CAP_PROP_FPS, 30)
        logger.info("Camera initialized successfully")
        
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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time gesture detection and drone control
    """
    await websocket.accept()
    connected_clients.append(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        while True:
            # Capture frame from camera
            if camera is None or not camera.isOpened():
                await websocket.send_json({
                    "error": "Camera not available",
                    "drone_status": drone_simulator.get_status()
                })
                await asyncio.sleep(0.1)
                continue
            
            ret, frame = camera.read()
            if not ret:
                await websocket.send_json({
                    "error": "Failed to capture frame",
                    "drone_status": drone_simulator.get_status()
                })
                await asyncio.sleep(0.1)
                continue
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame through improved gesture pipeline
            gesture_name, confidence, is_new_gesture, annotated_frame = None, 0.0, False, frame
            if gesture_pipeline is not None:
                try:
                    gesture_name, confidence, is_new_gesture, annotated_frame = gesture_pipeline.process_frame(frame)
                except Exception as e:
                    logger.error(f"Error in gesture detection: {e}")
                    gesture_name, confidence, is_new_gesture, annotated_frame = None, 0.0, False, frame
            
            # Execute drone command ONLY on new stable gestures
            drone_response = drone_simulator.get_status()
            if gesture_name and is_new_gesture:
                logger.info(f"Executing command for new gesture: {gesture_name} (confidence: {confidence:.2f})")
                drone_response = drone_simulator.execute_gesture_command(gesture_name, confidence)
            
            # Use the annotated frame (already has landmarks and info drawn)
            frame = annotated_frame
            
            # Convert frame to base64 for transmission
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
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
            
            # Control frame rate (~30 FPS)
            await asyncio.sleep(0.033)
            
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
        port=8000,
        reload=True,
        log_level="info"
    )
