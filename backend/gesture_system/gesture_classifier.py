"""
Rule-Based Gesture Classifier
Uses hand geometry and features to accurately classify gestures
"""
import numpy as np
from typing import Optional, Tuple, Dict
import logging

class GestureClassifier:
    """
    Classify gestures using geometric rules and hand features
    More reliable than ML models for well-defined gestures
    """
    
    # Gesture definitions
    TAKEOFF = 'takeoff'
    LAND = 'land'
    MOVE_FORWARD = 'move_forward'
    MOVE_BACKWARD = 'move_backward'
    MOVE_LEFT = 'move_left'
    MOVE_RIGHT = 'move_right'
    ROTATE_LEFT = 'rotate_left'
    ROTATE_RIGHT = 'rotate_right'
    HOVER = 'hover'
    EMERGENCY_STOP = 'emergency_stop'
    
    def __init__(self):
        """Initialize gesture classifier"""
        self.gesture_labels = {
            0: self.TAKEOFF,
            1: self.LAND,
            2: self.MOVE_FORWARD,
            3: self.MOVE_BACKWARD,
            4: self.MOVE_LEFT,
            5: self.MOVE_RIGHT,
            6: self.ROTATE_LEFT,
            7: self.ROTATE_RIGHT,
            8: self.HOVER,
            9: self.EMERGENCY_STOP
        }
        
        # Reverse mapping
        self.gesture_ids = {v: k for k, v in self.gesture_labels.items()}
        
        # Classification statistics
        self.classification_counts = {gesture: 0 for gesture in self.gesture_labels.values()}
        
        logging.info("GestureClassifier initialized with rule-based classification")
    
    def classify(self, features: Dict) -> Tuple[Optional[str], float]:
        """
        Classify gesture based on extracted features
        
        Args:
            features: Dictionary of extracted hand features
            
        Returns:
            Tuple of (gesture_name, confidence)
        """
        fingers_extended = features['fingers_extended']
        extended_count = features['extended_count']
        finger_angles = features['finger_angles']
        palm_orientation = features['palm_orientation']
        finger_spread = features['finger_spread']
        hand_direction = features['hand_direction']
        thumb_position = features['thumb_position']
        finger_distances = features['finger_distances']
        
        # Extract individual finger states
        thumb_ext, index_ext, middle_ext, ring_ext, pinky_ext = fingers_extended
        
        # Rule-based classification with confidence scores
        
        # 1. OPEN PALM (All 5 fingers extended) -> TAKEOFF
        if extended_count == 5 and finger_spread > 0.12:
            self._update_count(self.TAKEOFF)
            return self.TAKEOFF, 0.95
        
        # 1b. OPEN PALM (4+ fingers) -> TAKEOFF (alternative for when thumb is tricky)
        if extended_count >= 4 and finger_spread > 0.13:
            # Check that it's not the thumb missing (all other fingers extended)
            if index_ext and middle_ext and ring_ext and pinky_ext:
                self._update_count(self.TAKEOFF)
                return self.TAKEOFF, 0.90
        
        # 2. FIST (No fingers extended) -> LAND
        if extended_count == 0:
            self._update_count(self.LAND)
            return self.LAND, 0.95
        
        # 3. PEACE SIGN (Index + Middle extended) -> MOVE FORWARD
        if (extended_count == 2 and 
            index_ext and middle_ext and 
            not thumb_ext and not ring_ext and not pinky_ext):
            # Check if hand is pointing forward (y is negative)
            if hand_direction['y'] < -0.3:
                self._update_count(self.MOVE_FORWARD)
                return self.MOVE_FORWARD, 0.90
        
        # 4. THUMBS UP -> MOVE UP / TAKEOFF (alternative)
        if (thumb_ext and not index_ext and not middle_ext and 
            not ring_ext and not pinky_ext):
            # Thumb pointing up
            if hand_direction['y'] < -0.5:
                self._update_count(self.TAKEOFF)
                return self.TAKEOFF, 0.85
        
        # 5. THUMBS DOWN -> LAND (alternative)
        if (thumb_ext and not index_ext and not middle_ext and 
            not ring_ext and not pinky_ext):
            # Thumb pointing down
            if hand_direction['y'] > 0.5:
                self._update_count(self.LAND)
                return self.LAND, 0.85
        
        # 6. POINTING (Only index extended) -> DIRECTIONAL MOVEMENT
        if (extended_count == 1 and index_ext):
            # Determine direction based on hand orientation
            yaw = palm_orientation['yaw']
            pitch = palm_orientation['pitch']
            
            # Left/Right based on yaw
            if abs(yaw) > 30:
                if yaw > 0:
                    self._update_count(self.MOVE_RIGHT)
                    return self.MOVE_RIGHT, 0.85
                else:
                    self._update_count(self.MOVE_LEFT)
                    return self.MOVE_LEFT, 0.85
            
            # Forward/Backward based on pitch
            if abs(pitch) > 20:
                if pitch < 0:
                    self._update_count(self.MOVE_FORWARD)
                    return self.MOVE_FORWARD, 0.85
                else:
                    self._update_count(self.MOVE_BACKWARD)
                    return self.MOVE_BACKWARD, 0.85
        
        # 7. THREE FINGERS (Index + Middle + Ring) -> HOVER
        if (extended_count == 3 and 
            index_ext and middle_ext and ring_ext and 
            not thumb_ext and not pinky_ext):
            self._update_count(self.HOVER)
            return self.HOVER, 0.90
        
        # 8. L-SHAPE (Thumb + Index) -> ROTATE LEFT
        if (extended_count == 2 and thumb_ext and index_ext and 
            not middle_ext and not ring_ext and not pinky_ext):
            # Check thumb-index angle for L-shape
            thumb_index_dist = finger_distances.get('thumb_index_distance', 0)
            if thumb_index_dist > 0.15:  # Wide L-shape
                # Determine rotation based on hand position
                if hand_direction['x'] < 0:
                    self._update_count(self.ROTATE_LEFT)
                    return self.ROTATE_LEFT, 0.85
                else:
                    self._update_count(self.ROTATE_RIGHT)
                    return self.ROTATE_RIGHT, 0.85
        
        # 9. FOUR FINGERS (All except thumb) -> MOVE BACKWARD
        if (extended_count == 4 and 
            index_ext and middle_ext and ring_ext and pinky_ext and 
            not thumb_ext):
            self._update_count(self.MOVE_BACKWARD)
            return self.MOVE_BACKWARD, 0.85
        
        # 10. PINKY EXTENDED ALONE -> EMERGENCY STOP
        if (extended_count == 1 and pinky_ext):
            self._update_count(self.EMERGENCY_STOP)
            return self.EMERGENCY_STOP, 0.90
        
        # 11. HAND TILTED LEFT -> MOVE LEFT
        if extended_count >= 3:
            yaw = palm_orientation['yaw']
            if yaw < -40:
                self._update_count(self.MOVE_LEFT)
                return self.MOVE_LEFT, 0.75
        
        # 12. HAND TILTED RIGHT -> MOVE RIGHT
        if extended_count >= 3:
            yaw = palm_orientation['yaw']
            if yaw > 40:
                self._update_count(self.MOVE_RIGHT)
                return self.MOVE_RIGHT, 0.75
        
        # 13. TWO FINGERS WITH WIDE SPREAD -> ROTATE
        if extended_count == 2 and finger_spread > 0.18:
            # Rotation direction based on which fingers
            if index_ext and pinky_ext:
                # Wide V-shape
                if hand_direction['x'] < 0:
                    self._update_count(self.ROTATE_LEFT)
                    return self.ROTATE_LEFT, 0.80
                else:
                    self._update_count(self.ROTATE_RIGHT)
                    return self.ROTATE_RIGHT, 0.80
        
        # Default: HOVER if 2-4 fingers extended
        if 2 <= extended_count <= 4:
            self._update_count(self.HOVER)
            return self.HOVER, 0.60
        
        # No clear gesture detected
        return None, 0.0
    
    def _update_count(self, gesture: str):
        """Update classification statistics"""
        if gesture in self.classification_counts:
            self.classification_counts[gesture] += 1
    
    def get_gesture_description(self, gesture: str) -> str:
        """Get human-readable description of gesture"""
        descriptions = {
            self.TAKEOFF: "Open palm with all 5 fingers extended",
            self.LAND: "Closed fist",
            self.MOVE_FORWARD: "Peace sign (index + middle fingers) pointing forward",
            self.MOVE_BACKWARD: "Four fingers extended (no thumb)",
            self.MOVE_LEFT: "Hand tilted left or pointing left",
            self.MOVE_RIGHT: "Hand tilted right or pointing right",
            self.ROTATE_LEFT: "L-shape with thumb and index pointing left",
            self.ROTATE_RIGHT: "L-shape with thumb and index pointing right",
            self.HOVER: "Three fingers extended (index + middle + ring)",
            self.EMERGENCY_STOP: "Only pinky finger extended"
        }
        return descriptions.get(gesture, "Unknown gesture")
    
    def get_stats(self) -> Dict:
        """Get classification statistics"""
        total = sum(self.classification_counts.values())
        stats = {
            'total_classifications': total,
            'gesture_counts': self.classification_counts.copy()
        }
        
        if total > 0:
            stats['gesture_percentages'] = {
                gesture: (count / total * 100)
                for gesture, count in self.classification_counts.items()
            }
        
        return stats
    
    def reset_stats(self):
        """Reset classification statistics"""
        self.classification_counts = {gesture: 0 for gesture in self.gesture_labels.values()}
