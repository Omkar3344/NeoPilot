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

from gesture_detector import GestureDetector
from drone_simulator import DroneSimulator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
gesture_detector = None
drone_simulator = DroneSimulator()
camera = None
connected_clients: List[WebSocket] = []

# Initialize camera and gesture detector
def initialize_systems():
    global gesture_detector, camera
    
    try:
        # Initialize gesture detector with your model
        model_path = "../best_gesture_model.h5"  # Path to your model
        gesture_detector = GestureDetector(model_path)
        logger.info("Gesture detector initialized successfully")
        
        # Initialize camera
        camera = cv2.VideoCapture(0)
        camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        logger.info("Camera initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing systems: {e}")
        raise e

def cleanup_systems():
    """Cleanup systems on shutdown"""
    global camera
    if camera:
        camera.release()
    cv2.destroyAllWindows()

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
            
            # Detect gesture
            gesture_name, confidence, landmarks = None, 0.0, None
            if gesture_detector is not None:
                try:
                    gesture_name, confidence, landmarks = gesture_detector.predict_gesture(frame)
                except Exception as e:
                    logger.error(f"Error in gesture detection: {e}")
                    gesture_name, confidence, landmarks = None, 0.0, None
            
            # Execute drone command if gesture detected
            drone_response = drone_simulator.get_status()
            if gesture_name and confidence > 0.7:
                drone_response = drone_simulator.execute_gesture_command(gesture_name, confidence)
            
            # Draw landmarks on frame
            if landmarks and gesture_detector is not None:
                try:
                    frame = gesture_detector.draw_landmarks(frame, landmarks)
                except Exception as e:
                    logger.error(f"Error drawing landmarks: {e}")
            
            # Add gesture info to frame
            if gesture_name:
                cv2.putText(frame, f"Gesture: {gesture_name}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(frame, f"Confidence: {confidence:.2f}", (10, 60), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
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
