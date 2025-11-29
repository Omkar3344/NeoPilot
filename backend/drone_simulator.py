import asyncio
import json
import logging
from typing import Dict, List, Optional
import time
import math

class DroneSimulator:
    def __init__(self):
        """
        Initialize the virtual drone with starting parameters and physics
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
        
        # Physics parameters
        self.gravity = -0.05  # Gravity force when no gesture
        self.drag = 0.95  # Air resistance (0.95 = 5% velocity loss per frame)
        self.max_velocity = 0.6  # Maximum velocity per axis (increased from 0.3)
        self.acceleration = 0.04  # Acceleration rate for continuous movement (increased from 0.02)
        self.speed_multiplier = 1.0  # Adjustable speed multiplier (1.0 = default)
        self.ground_level = 0.0  # Ground position
        
        # Current gesture command (for continuous movement)
        self.current_gesture: Optional[str] = None
        self.last_gesture_time = 0
        self.gesture_timeout = 1.5  # Seconds before stopping continuous movement
        
        # Movement parameters
        self.max_speed = 5.0
        self.movement_increment = 0.5
        self.rotation_increment = 15.0
        
        # Telemetry
        self.total_distance = 0.0
        self.flight_time = 0.0
        self.start_time = None
        self.last_position = {"x": 0.0, "y": 0.0, "z": 0.0}
        self.last_update_time = time.time()
        
        # Movement history for smooth animations
        self.movement_history: List[Dict] = []
        
        # Boundaries (to prevent drone from going too far)
        self.boundary = {"x": 15, "y": 10, "z": 15}
        
        # Drone orientation for forward/backward movement
        self.yaw_angle = 0.0  # Drone facing direction in degrees
        
        logging.info("Drone simulator initialized with physics")
    
    def calculate_distance(self, pos1: Dict, pos2: Dict) -> float:
        """Calculate 3D distance between two positions"""
        return math.sqrt(
            (pos1["x"] - pos2["x"]) ** 2 +
            (pos1["y"] - pos2["y"]) ** 2 +
            (pos1["z"] - pos2["z"]) ** 2
        )
    
    def update_physics(self):
        """
        Update drone position based on physics (continuous movement)
        Called regularly to simulate physics even when no gesture is detected
        """
        current_time = time.time()
        dt = current_time - self.last_update_time
        self.last_update_time = current_time
        
        # Check if current gesture has timed out
        if self.current_gesture and (current_time - self.last_gesture_time > self.gesture_timeout):
            self.current_gesture = None
            logging.info("Gesture timed out, stopping continuous movement")
        
        # Apply continuous movement based on current gesture
        if self.current_gesture and self.is_flying:
            self._apply_gesture_acceleration(self.current_gesture)
        
        # Apply drag to slow down drone
        self.velocity["x"] *= self.drag
        self.velocity["y"] *= self.drag
        self.velocity["z"] *= self.drag
        
        # Gravity disabled for easier testing
        # if self.is_flying and self.current_gesture not in ["up", "stop"]:
        #     self.velocity["y"] += self.gravity * dt * 10  # Gravity pulls down
        
        # Clamp velocities to max (with speed multiplier)
        max_vel = self.max_velocity * self.speed_multiplier
        for axis in ["x", "y", "z"]:
            if abs(self.velocity[axis]) > max_vel:
                self.velocity[axis] = math.copysign(max_vel, self.velocity[axis])
        
        # Update position based on velocity
        self.position["x"] += self.velocity["x"]
        self.position["y"] += self.velocity["y"]
        self.position["z"] += self.velocity["z"]
        
        # Ground collision - prevent going below ground
        if self.position["y"] <= self.ground_level:
            self.position["y"] = self.ground_level
            self.velocity["y"] = 0
            # Auto-landing disabled for easier testing
            # if self.is_flying and abs(self.velocity["x"]) < 0.05 and abs(self.velocity["z"]) < 0.05:
            #     self.is_flying = False
            #     self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
            #     logging.info("Drone landed due to gravity")
        
        # Boundary constraints (keep drone in visible range)
        for axis in ["x", "z"]:
            if abs(self.position[axis]) > self.boundary[axis]:
                self.position[axis] = math.copysign(self.boundary[axis], self.position[axis])
                self.velocity[axis] = 0
        
        if self.position["y"] > self.boundary["y"]:
            self.position["y"] = self.boundary["y"]
            self.velocity["y"] = 0
        
        # Update telemetry
        self.update_telemetry()
    
    def _apply_gesture_acceleration(self, gesture: str):
        """Apply acceleration based on current gesture with correct axes"""
        accel = self.acceleration * self.speed_multiplier
        
        # Forward/Backward based on drone facing direction
        if gesture == "go_forward":
            # Move in the direction drone is facing (Z-axis positive)
            self.velocity["z"] += accel
        elif gesture == "back":
            # Move opposite to drone facing direction (Z-axis negative)
            self.velocity["z"] -= accel
        
        # Left/Right movement (X-axis)
        elif gesture == "left":
            self.velocity["x"] -= accel  # Move left (negative X)
        elif gesture == "right":
            self.velocity["x"] += accel  # Move right (positive X)
        
        # Up/Down movement (Y-axis = altitude)
        elif gesture == "up":
            self.velocity["y"] += accel * 1.5  # Move up (increase altitude)
        elif gesture == "down":
            self.velocity["y"] -= accel  # Move down (decrease altitude)
        
        # Hover in place
        elif gesture == "stop":
            # Stop gesture slows down drone to hover
            self.velocity["x"] *= 0.85
            self.velocity["z"] *= 0.85
            # Maintain hover altitude around 2.0
            if self.position["y"] < 2.0:
                self.velocity["y"] += accel * 1.5
            elif self.position["y"] > 2.5:
                self.velocity["y"] -= accel
    
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
        Now supports continuous movement - gestures set the movement direction
        until a new gesture is recognized or timeout occurs
        """
        if confidence < 0.7:  # Confidence threshold
            return self.get_status()
        
        command_executed = True
        message = f"Executing {gesture}"
        current_time = time.time()
        
        # STOP/HOVER - Open palm (hover in place, counter gravity)
        if gesture == "stop":
            if self.is_flying:
                self.current_gesture = "stop"
                self.last_gesture_time = current_time
                message = "Drone hovering (stopped)"
            else:
                # Takeoff if not flying
                self.is_flying = True
                self.position["y"] = 2.0
                self.current_gesture = "stop"
                self.last_gesture_time = current_time
                self.start_time = time.time()
                message = "Drone taking off"
                
        # LAND - OK sign (land the drone, cancel continuous movement)
        elif gesture == "land":
            if self.is_flying:
                self.current_gesture = None
                self.is_flying = False
                self.position["y"] = 0.0
                self.velocity = {"x": 0.0, "y": 0.0, "z": 0.0}
                message = "Drone landing"
            else:
                message = "Drone already on ground"
                command_executed = False
                
        # Movement gestures - set continuous movement direction
        elif gesture == "go_forward" and self.is_flying:
            self.current_gesture = "go_forward"
            self.last_gesture_time = current_time
            message = "Continuously moving forward"
            
        elif gesture == "back" and self.is_flying:
            self.current_gesture = "back"
            self.last_gesture_time = current_time
            message = "Continuously moving backward"
            
        elif gesture == "left" and self.is_flying:
            self.current_gesture = "left"
            self.last_gesture_time = current_time
            message = "Continuously moving left"
            
        elif gesture == "right" and self.is_flying:
            self.current_gesture = "right"
            self.last_gesture_time = current_time
            message = "Continuously moving right"
            
        elif gesture == "up" and self.is_flying:
            self.current_gesture = "up"
            self.last_gesture_time = current_time
            message = "Continuously moving up"
            
        elif gesture == "down" and self.is_flying:
            self.current_gesture = "down"
            self.last_gesture_time = current_time
            message = "Continuously moving down"
            
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
            "movement_history": self.movement_history[-10:],  # Last 10 movements
            "current_gesture": self.current_gesture,  # Add current continuous gesture
            "speed_multiplier": self.speed_multiplier  # Current speed setting
        }
    
    def set_speed_multiplier(self, multiplier: float):
        """Set speed multiplier (0.5 to 2.0)"""
        self.speed_multiplier = max(0.5, min(2.0, multiplier))
        logging.info(f"Speed multiplier set to {self.speed_multiplier}x")
    
    def reset(self):
        """Reset drone to initial state"""
        self.__init__()
        return {"message": "Drone reset to initial state", **self.get_status()}
