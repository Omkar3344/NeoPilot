"""
Rule-Based Gesture Classifier
Uses hand geometry and features to accurately classify gestures
Based on specific hand pose patterns from reference images
"""
import numpy as np
from typing import Optional, Tuple, Dict
import logging

class GestureClassifier:
    """
    Classify gestures using precise geometric rules
    Optimized for accuracy with simple, distinct gestures
    """
    
    # Gesture definitions - matching the reference image
    UP = 'up'                    # Pointing up (index finger)
    DOWN = 'down'                # Pointing down (hand tilted down)
    BACK = 'back'                # Fist (closed hand)
    GO_FORWARD = 'go_forward'    # Peace sign / V-sign
    LAND = 'land'                # OK sign (thumb + index circle)
    STOP = 'stop'                # Open palm (all fingers extended)
    LEFT = 'left'                # Flat hand tilted left
    RIGHT = 'right'              # Flat hand tilted right
    
    def __init__(self):
        """Initialize gesture classifier"""
        self.gesture_labels = {
            0: self.UP,
            1: self.DOWN,
            2: self.BACK,
            3: self.GO_FORWARD,
            4: self.LAND,
            5: self.STOP,
            6: self.LEFT,
            7: self.RIGHT
        }
        
        # Reverse mapping
        self.gesture_ids = {v: k for k, v in self.gesture_labels.items()}
        
        # Classification statistics
        self.classification_counts = {gesture: 0 for gesture in self.gesture_labels.values()}
        
        logging.info("GestureClassifier initialized with 8 precise gestures")
    
    def classify(self, features: Dict) -> Tuple[Optional[str], float]:
        """
        Classify gesture based on extracted features using precise rules
        
        Args:
            features: Dictionary of extracted hand features
            
        Returns:
            Tuple of (gesture_name, confidence)
        """
        fingers_extended = features['fingers_extended']
        extended_count = features['extended_count']
        palm_orientation = features['palm_orientation']
        palm_normal = features.get('palm_normal', {})
        finger_spread = features['finger_spread']
        hand_direction = features['hand_direction']
        thumb_direction = features.get('thumb_direction', {'x': 0, 'y': 0, 'z': 0})
        finger_distances = features['finger_distances']
        wrist_position = features.get('wrist_position', {})
        
        # Extract individual finger states
        thumb_ext, index_ext, middle_ext, ring_ext, pinky_ext = fingers_extended
        
        # Get orientation values
        yaw = palm_orientation['yaw']      # Left/Right tilt
        pitch = palm_orientation['pitch']  # Up/Down tilt
        roll = palm_orientation['roll']    # Rotation
        
        # Palm facing direction (more reliable than pitch/yaw alone)
        palm_facing_camera = palm_normal.get('facing_camera', False)
        palm_facing_away = palm_normal.get('facing_away', False)
        
        # Priority-based gesture detection (most specific to least specific)
        
        # 1. LAND (👌 OK Sign - Thumb and Index forming circle, other fingers extended)
        # Most specific - check first
        thumb_index_dist = finger_distances.get('thumb_index_distance', 1.0)
        if thumb_ext and index_ext and thumb_index_dist < 0.07:  # Tips close together
            # Check if other 3 fingers are extended
            if middle_ext and ring_ext and pinky_ext:
                self._update_count(self.LAND)
                return self.LAND, 0.95
        
        # 2. BACK (👊 Closed Fist - Back of hand facing camera)
        # All fingers curled, no fingers extended
        # Enhanced: Also check palm is facing away from camera
        if extended_count == 0:
            # More confident if palm is clearly facing away
            confidence = 0.98 if palm_facing_away else 0.95
            self._update_count(self.BACK)
            return self.BACK, confidence
        
        # 3. LEFT (✊ Fist with thumb pointing left)
        # Closed fist with thumb extended, pointing left
        if extended_count == 1 and thumb_ext:
            if not index_ext and not middle_ext and not ring_ext and not pinky_ext:
                # Thumb pointing left (negative X direction)
                if thumb_direction['x'] < -0.4 or yaw < -35:
                    self._update_count(self.LEFT)
                    return self.LEFT, 0.93
        
        # 4. RIGHT (✊ Fist with thumb pointing right)
        # Closed fist with thumb extended, pointing right
        if extended_count == 1 and thumb_ext:
            if not index_ext and not middle_ext and not ring_ext and not pinky_ext:
                # Thumb pointing right (positive X direction)
                if thumb_direction['x'] > 0.4 or yaw > 35:
                    self._update_count(self.RIGHT)
                    return self.RIGHT, 0.93
        
        # 5. UP (👆 Index finger pointing up)
        # Index finger extended upward, palm facing forward/upward
        if extended_count == 1 and index_ext:
            # Hand should be pointing upward
            if hand_direction['y'] < -0.4 or pitch < -30:
                self._update_count(self.UP)
                return self.UP, 0.94
        
        # Alternative UP - index and maybe thumb
        if extended_count <= 2 and index_ext and not middle_ext:
            if hand_direction['y'] < -0.4 or pitch < -30:
                self._update_count(self.UP)
                return self.UP, 0.90
        
        # 6. DOWN (👇 Hand pointing down)
        # Palm facing downward, fingers pointing down
        if extended_count >= 1:
            if pitch > 40 or hand_direction['y'] > 0.4:  # Tilted down significantly
                self._update_count(self.DOWN)
                return self.DOWN, 0.91
        
        # 7. STOP (✋ Open Palm with fingers spread - MUST be different from GO_FORWARD)
        # All fingers extended AND clearly spread apart
        if extended_count >= 4 and index_ext and middle_ext and ring_ext and pinky_ext:
            # STOP requires wider finger spread than GO_FORWARD
            if finger_spread > 0.15:  # Much wider spread required
                self._update_count(self.STOP)
                return self.STOP, 0.96
        
        # 8. GO_FORWARD (✋ Open Palm - fingers together or slightly apart)
        # Palm facing camera, all fingers extended, NOT widely spread
        if extended_count >= 4:
            # Check palm is facing camera (not tilted sideways)
            if abs(yaw) < 35 and abs(pitch) < 35:
                # All main fingers extended
                if index_ext and middle_ext and ring_ext and pinky_ext:
                    # GO_FORWARD has smaller spread than STOP
                    if finger_spread < 0.15:  # Fingers closer together
                        # More confident if palm is clearly facing camera
                        confidence = 0.94 if palm_facing_camera else 0.90
                        self._update_count(self.GO_FORWARD)
                        return self.GO_FORWARD, confidence
        
        # No clear gesture detected
        return None, 0.0
    
    def _update_count(self, gesture: str):
        """Update classification statistics"""
        if gesture in self.classification_counts:
            self.classification_counts[gesture] += 1
    
    def get_gesture_description(self, gesture: str) -> str:
        """Get human-readable description of gesture"""
        descriptions = {
            self.UP: "👆 Up - Index finger pointing upward (Increase altitude)",
            self.DOWN: "👇 Down - Palm facing downward (Decrease altitude)",
            self.BACK: "👊 Back - Closed fist, back of hand facing camera (Move backward)",
            self.GO_FORWARD: "✋ Go Forward - Palm facing camera, fingers together (Move forward)",
            self.LAND: "👌 Land - Thumb & index forming circle (Land)",
            self.STOP: "🖐 Stop - Open palm with fingers SPREAD WIDE (Hover/Stop)",
            self.LEFT: "✊ Left - Closed fist with thumb pointing left (Move left)",
            self.RIGHT: "✊ Right - Closed fist with thumb pointing right (Move right)"
        }
        return descriptions.get(gesture, "Unknown gesture")
    
    def get_all_gestures(self) -> Dict:
        """Get all available gestures with descriptions"""
        return {
            gesture: self.get_gesture_description(gesture)
            for gesture in self.gesture_labels.values()
        }
    
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
