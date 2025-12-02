import asyncio
import json
import logging
from typing import Dict, List, Optional
import time
import math

class DroneSimulator:
    def __init__(self):
        """
        Initialize the virtual drone with starting parameters
        """
        # Drone position (x, y, z)
        self.position = {"x": 0.0, "y": 0.0, "z": 0.0}
        
        # Drone rotation (pitch, yaw, roll)
        self.rotation = {"pitch": 0.0, "yaw": 0.0, "roll": 0.0}
        
        # Drone state
        self.is_flying = False
        self.battery_level = 100.0
        self.speed = 0.0
        self.altitude = 0.0
        
        # Movement parameters
        self.movement_increment = 0.5
        self.rotation_increment = 15.0
        
        # Continuous movement tracking
        self.active_movements = set()  # Track active movement directions
        
        # Telemetry
        self.total_distance = 0.0
        self.flight_time = 0.0
        self.start_time = None
        self.last_position = {"x": 0.0, "y": 0.0, "z": 0.0}
        self.last_update_time = time.time()
        
        # Movement history for smooth animations
        self.movement_history: List[Dict] = []
        
        # Drone orientation for forward/backward movement
        self.yaw_angle = 0.0  # Drone facing direction in degrees
        
        logging.info("Drone simulator initialized")
    
    def calculate_distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calculate 3D distance between two positions"""
        return math.sqrt(
            (pos1["x"] - pos2["x"]) ** 2 +
            (pos1["y"] - pos2["y"]) ** 2 +
            (pos1["z"] - pos2["z"]) ** 2
        )
    
    def update_physics(self):
        """
        Update position based on active movements and update telemetry
        """
        current_time = time.time()
        dt = current_time - self.last_update_time
        self.last_update_time = current_time
        
        # Apply continuous movement based on active directions
        # Using fixed increment per update for consistent speed (assuming ~30 FPS)
        if self.is_flying and self.active_movements:
            # Scale movement by time delta to maintain consistent speed regardless of frame rate
            increment = self.movement_increment * (dt * 30)  # 30 updates per second equivalent
            
            if "go_forward" in self.active_movements:
                self.position["z"] += increment
            if "back" in self.active_movements:
                self.position["z"] -= increment
            if "left" in self.active_movements:
                self.position["x"] -= increment
            if "right" in self.active_movements:
                self.position["x"] += increment
            if "up" in self.active_movements:
                self.position["y"] += increment
            if "down" in self.active_movements:
                if self.position["y"] > 0.1:
                    self.position["y"] -= increment
                else:
                    self.active_movements.discard("down")
        
        # Update telemetry
        self.update_telemetry()
    
    def update_telemetry(self):
        """Update flight telemetry data"""
        if self.is_flying:
            # Calculate distance traveled
            distance_increment = self.calculate_distance(self.position, self.last_position)
            self.total_distance += distance_increment
            self.last_position = self.position.copy()
            
            # Update speed (set to 0 since no velocity tracking)
            self.speed = 0.0
            
            # Update altitude (using y-axis as altitude)
            self.altitude = max(0, self.position["y"])
            
            # Update flight time
            if self.start_time:
                self.flight_time = time.time() - self.start_time
            
            # Battery simulation (decreases with flight time)
            if self.flight_time > 0:
                self.battery_level = max(0, 100 - (self.flight_time / 600) * 100)  # 10 min flight time
    
    def execute_gesture_command(self, gesture: str, confidence: float) -> Dict:
        """
        Execute drone command based on recognized gesture
        Sets continuous movement direction
        """
        if confidence < 0.7:  # Confidence threshold
            return self.get_status()
        
        command_executed = True
        message = f"Executing {gesture}"
        
        # STOP/HOVER - Takeoff or hover
        if gesture == "stop":
            if not self.is_flying:
                # Takeoff if not flying
                self.is_flying = True
                self.position["y"] = 2.0
                self.start_time = time.time()
                self.active_movements.clear()
                message = "Drone taking off"
            else:
                # Stop all movement
                self.active_movements.clear()
                message = "Drone hovering (stopped)"
                
        # LAND - Land the drone
        elif gesture == "land":
            if self.is_flying:
                self.is_flying = False
                self.position["y"] = 0.0
                self.active_movements.clear()
                message = "Drone landing"
            else:
                message = "Drone already on ground"
                command_executed = False
                
        # Movement gestures - set continuous movement direction
        elif gesture == "go_forward" and self.is_flying:
            self.active_movements.add("go_forward")
            message = "Moving forward continuously"
            
        elif gesture == "back" and self.is_flying:
            self.active_movements.add("back")
            message = "Moving backward continuously"
            
        elif gesture == "left" and self.is_flying:
            self.active_movements.add("left")
            message = "Moving left continuously"
            
        elif gesture == "right" and self.is_flying:
            self.active_movements.add("right")
            message = "Moving right continuously"
            
        elif gesture == "up" and self.is_flying:
            self.active_movements.add("up")
            message = "Moving up continuously"
            
        elif gesture == "down" and self.is_flying:
            if self.position["y"] > 0.1:
                self.active_movements.add("down")
                message = "Moving down continuously"
            else:
                message = "Cannot move below ground level"
                command_executed = False
        
        # RESET - Reset drone to initial position
        elif gesture == "reset":
            self.__init__()
            message = "Drone reset to initial position"
            
        else:
            command_executed = False
            if not self.is_flying and gesture not in ["stop", "land"]:
                message = f"Drone not flying. Use 'stop' gesture to take off"
            else:
                message = f"Command '{gesture}' not recognized"
        
        # Add to movement history
        if command_executed:
            self.movement_history.append({
                "timestamp": time.time(),
                "gesture": gesture,
                "position": self.position.copy(),
                "rotation": self.rotation.copy()
            })
            
            # Keep only last 50 movements
            if len(self.movement_history) > 50:
                self.movement_history.pop(0)
        
        return {
            **self.get_status(),
            "command_executed": command_executed,
            "message": message
        }
    
    def stop_movement(self, direction: str):
        """Stop movement in a specific direction"""
        self.active_movements.discard(direction)
    
    def get_status(self) -> Dict:
        """Get current drone status and telemetry"""
        return {
            "position": self.position,
            "rotation": self.rotation,
            "is_flying": self.is_flying,
            "battery_level": round(self.battery_level, 1),
            "speed": round(self.speed, 2),
            "altitude": round(self.altitude, 2),
            "total_distance": round(self.total_distance, 2),
            "flight_time": round(self.flight_time, 2) if self.flight_time else 0,
            "movement_history": self.movement_history[-10:]  # Last 10 movements
        }
    
    def reset(self):
        """Reset drone to initial state"""
        self.__init__()
        return {"message": "Drone reset to initial state", **self.get_status()}
