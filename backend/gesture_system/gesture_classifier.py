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
    
    Gesture Definitions:
    - GO_FORWARD: Thumbs up 👍 (thumb up, other fingers closed)
    - BACK: Thumbs down 👎 (thumb down, other fingers closed)
    - LEFT: Thumb pointing left 👈 (closed fist, thumb extended left)
    - RIGHT: Thumb pointing right 👉 (closed fist, thumb extended right)
    - UP: Index finger up ☝️ (index up, all other fingers including thumb closed)
    - DOWN: Index finger down 👇 (index down, all other fingers including thumb closed)
    - RESET: Peace sign ✌️ (index + middle up, other fingers closed)
    - LAND: OK sign 👌 (thumb + index circle, other fingers extended)
    - STOP: Open palm 🖐 (all fingers extended and spread)
    """
    
    UP = 'up'                    # Index finger up (other fingers closed)
    DOWN = 'down'                # Index finger down (other fingers closed)
    BACK = 'back'                # Thumbs down
    GO_FORWARD = 'go_forward'    # Thumbs up
    LAND = 'land'                # OK sign (thumb + index circle)
    STOP = 'stop'                # Open palm (all fingers extended)
    LEFT = 'left'                # Thumb pointing left
    RIGHT = 'right'              # Thumb pointing right
    RESET = 'reset'              # Peace sign (index + middle up)
    
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
            7: self.RIGHT,
            8: self.RESET
        }
        
        # Reverse mapping
        self.gesture_ids = {v: k for k, v in self.gesture_labels.items()}
        
        # Classification statistics
        self.classification_counts = {gesture: 0 for gesture in self.gesture_labels.values()}
        
        logging.info("GestureClassifier initialized with 9 precise gestures")
    
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
        
        # Palm facing direction
        palm_facing_camera = palm_normal.get('facing_camera', False)
        palm_facing_away = palm_normal.get('facing_away', False)
        
        # Priority-based gesture detection (most specific to least specific)
        
        # 1. LAND (👌 OK Sign - Thumb and Index forming circle, other fingers extended)
        thumb_index_dist = finger_distances.get('thumb_index_distance', 1.0)
        if thumb_ext and index_ext and thumb_index_dist < 0.07:
            if middle_ext and ring_ext and pinky_ext:
                self._update_count(self.LAND)
                return self.LAND, 0.95
        
        # 2. RESET (✌️ Peace Sign - Index + Middle finger up, others closed)
        # Must detect BEFORE other single-finger gestures
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            # Check fingers are pointing upward
            if hand_direction['y'] < -0.25 or pitch < -15:
                # Thumb should be closed/not prominently extended
                if not thumb_ext or (thumb_ext and abs(thumb_direction['y']) < 0.3):
                    self._update_count(self.RESET)
                    return self.RESET, 0.94
        
        # 3-6. THUMB GESTURES: GO_FORWARD, BACK, LEFT, RIGHT
        # All require: thumb extended, other fingers closed
        # Differentiation is based on DOMINANT AXIS of thumb direction
        if thumb_ext and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            
            # Get absolute values to determine dominant direction
            thumb_x = thumb_direction['x']  # Positive = right, Negative = left
            thumb_y = thumb_direction['y']  # Positive = down, Negative = up
            abs_x = abs(thumb_x)
            abs_y = abs(thumb_y)
            
            # Determine dominant axis - X (left/right) vs Y (up/down)
            # Use a ratio to ensure clear differentiation
            x_dominant = abs_x > abs_y * 1.2  # X must be 20% stronger to be dominant
            y_dominant = abs_y > abs_x * 1.2  # Y must be 20% stronger to be dominant
            
            # LEFT (👈 Thumb pointing left)
            # Requires: X is dominant AND negative (pointing left)
            if x_dominant and thumb_x < -0.3:
                self._update_count(self.LEFT)
                return self.LEFT, 0.94
            
            # RIGHT (👉 Thumb pointing right)
            # Requires: X is dominant AND positive (pointing right)
            if x_dominant and thumb_x > 0.3:
                self._update_count(self.RIGHT)
                return self.RIGHT, 0.94
            
            # GO_FORWARD (👍 Thumbs Up)
            # Requires: Y is dominant AND negative (pointing up)
            if y_dominant and thumb_y < -0.3:
                self._update_count(self.GO_FORWARD)
                return self.GO_FORWARD, 0.95
            
            # BACK (👎 Thumbs Down)
            # Requires: Y is dominant AND positive (pointing down)
            if y_dominant and thumb_y > 0.3:
                self._update_count(self.BACK)
                return self.BACK, 0.95
            
            # Fallback for edge cases where direction isn't clearly dominant
            # Use stricter thresholds
            if thumb_x < -0.45:  # Strong left
                self._update_count(self.LEFT)
                return self.LEFT, 0.88
            if thumb_x > 0.45:  # Strong right
                self._update_count(self.RIGHT)
                return self.RIGHT, 0.88
            if thumb_y < -0.45:  # Strong up
                self._update_count(self.GO_FORWARD)
                return self.GO_FORWARD, 0.88
            if thumb_y > 0.45:  # Strong down
                self._update_count(self.BACK)
                return self.BACK, 0.88
        
        # 7. UP (☝️ Index finger pointing up - only index extended, thumb closed)
        if index_ext and not thumb_ext and not middle_ext and not ring_ext and not pinky_ext:
            # Hand should be pointing upward
            if hand_direction['y'] < -0.35 or pitch < -25:
                self._update_count(self.UP)
                return self.UP, 0.94
        
        # Alternative UP - index extended, thumb slightly out but index clearly pointing up
        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            if hand_direction['y'] < -0.45 or pitch < -35:
                self._update_count(self.UP)
                return self.UP, 0.88
        
        # 8. DOWN (👇 Index finger pointing down - only index extended downward, thumb closed)
        if index_ext and not thumb_ext and not middle_ext and not ring_ext and not pinky_ext:
            # Hand should be pointing downward
            if hand_direction['y'] > 0.35 or pitch > 25:
                self._update_count(self.DOWN)
                return self.DOWN, 0.94
        
        # Alternative DOWN - index extended pointing down
        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            if hand_direction['y'] > 0.45 or pitch > 35:
                self._update_count(self.DOWN)
                return self.DOWN, 0.88
        
        # 9. STOP (🖐 Open Palm with fingers spread)
        if extended_count >= 4 and index_ext and middle_ext and ring_ext and pinky_ext:
            if finger_spread > 0.15:
                self._update_count(self.STOP)
                return self.STOP, 0.96
        
        # No clear gesture detected
        return None, 0.0
    
    def _update_count(self, gesture: str):
        """Update classification statistics"""
        if gesture in self.classification_counts:
            self.classification_counts[gesture] += 1
    
    def get_gesture_description(self, gesture: str) -> str:
        """Get human-readable description of gesture"""
        descriptions = {
            self.UP: "☝️ Up - Index finger pointing up (thumb closed) - Increase altitude",
            self.DOWN: "👇 Down - Index finger pointing down (thumb closed) - Decrease altitude",
            self.BACK: "👎 Back - Thumbs down - Move backward",
            self.GO_FORWARD: "👍 Go Forward - Thumbs up - Move forward",
            self.LAND: "👌 Land - Thumb & index forming circle - Land drone",
            self.STOP: "🖐 Stop - Open palm with fingers spread wide - Hover/Stop",
            self.LEFT: "👈 Left - Thumb pointing left (fist closed) - Move left",
            self.RIGHT: "👉 Right - Thumb pointing right (fist closed) - Move right",
            self.RESET: "✌️ Reset - Peace sign (index + middle up) - Reset drone position"
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
