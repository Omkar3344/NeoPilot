import asyncio
import json
import logging
from typing import Dict, List
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
        
        # Drone velocity
        self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
        
        # Drone state
        self.is_flying = False
        self.battery_level = 100.0
        self.speed = 0.0
        self.altitude = 0.0
        
        # Movement parameters
        self.max_speed = 5.0
        self.movement_increment = 0.5
        self.rotation_increment = 15.0
        
        # Telemetry
        self.total_distance = 0.0
        self.flight_time = 0.0
        self.start_time = None
        self.last_position = {"x": 0.0, "y": 0.0, "z": 0.0}
        
        # Movement history for smooth animations
        self.movement_history: List[Dict] = []
        
        logging.info("Drone simulator initialized")
    
    def calculate_distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calculate 3D distance between two positions"""
        return math.sqrt(
            (pos1["x"] - pos2["x"]) ** 2 +
            (pos1["y"] - pos2["y"]) ** 2 +
            (pos1["z"] - pos2["z"]) ** 2
        )
    
    def update_telemetry(self):
        """Update flight telemetry data"""
        if self.is_flying:
            # Calculate distance traveled
            distance_increment = self.calculate_distance(self.position, self.last_position)
            self.total_distance += distance_increment
            self.last_position = self.position.copy()
            
            # Update speed
            self.speed = math.sqrt(
                self.velocity["x"] ** 2 + 
                self.velocity["y"] ** 2 + 
                self.velocity["z"] ** 2
            )
            
            # Update altitude
            self.altitude = max(0, self.position["z"])
            
            # Update flight time
            if self.start_time:
                self.flight_time = time.time() - self.start_time
            
            # Battery simulation (decreases with flight time)
            if self.flight_time > 0:
                self.battery_level = max(0, 100 - (self.flight_time / 600) * 100)  # 10 min flight time
    
    def execute_gesture_command(self, gesture: str, confidence: float) -> Dict:
        """
        Execute drone command based on recognized gesture
        """
        if confidence < 0.7:  # Confidence threshold
            return self.get_status()
        
        command_executed = True
        message = f"Executing {gesture}"
        
        if gesture == "takeoff":
            if not self.is_flying:
                self.is_flying = True
                self.position["z"] = 2.0  # Default takeoff altitude
                self.start_time = time.time()
                message = "Drone taking off"
            else:
                message = "Drone already flying"
                command_executed = False
                
        elif gesture == "land":
            if self.is_flying:
                self.is_flying = False
                self.position["z"] = 0.0
                self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
                message = "Drone landing"
            else:
                message = "Drone already on ground"
                command_executed = False
                
        elif gesture == "move_forward" and self.is_flying:
            self.position["y"] += self.movement_increment
            self.velocity["y"] = self.movement_increment
            
        elif gesture == "move_backward" and self.is_flying:
            self.position["y"] -= self.movement_increment
            self.velocity["y"] = -self.movement_increment
            
        elif gesture == "move_left" and self.is_flying:
            self.position["x"] -= self.movement_increment
            self.velocity["x"] = -self.movement_increment
            
        elif gesture == "move_right" and self.is_flying:
            self.position["x"] += self.movement_increment
            self.velocity["x"] = self.movement_increment
            
        elif gesture == "rotate_left" and self.is_flying:
            self.rotation["yaw"] -= self.rotation_increment
            if self.rotation["yaw"] < 0:
                self.rotation["yaw"] += 360
                
        elif gesture == "rotate_right" and self.is_flying:
            self.rotation["yaw"] += self.rotation_increment
            if self.rotation["yaw"] >= 360:
                self.rotation["yaw"] -= 360
                
        elif gesture == "hover" and self.is_flying:
            self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
            message = "Drone hovering"
            
        elif gesture == "emergency_stop":
            self.is_flying = False
            self.position["z"] = 0.0
            self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
            message = "Emergency stop executed"
            
        else:
            command_executed = False
            message = f"Command '{gesture}' not recognized or drone not flying"
        
        # Update telemetry
        self.update_telemetry()
        
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
    
    def get_status(self) -> Dict:
        """Get current drone status and telemetry"""
        return {
            "position": self.position,
            "rotation": self.rotation,
            "velocity": self.velocity,
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
