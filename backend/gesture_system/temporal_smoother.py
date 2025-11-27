"""
Temporal Smoothing for Gesture Recognition
Prevents jitter and false positives by tracking gesture history
"""
import numpy as np
from typing import Optional, Dict, List, Tuple
from collections import deque
import time
import logging

class TemporalSmoother:
    """
    Smooth gesture predictions over time to prevent erratic behavior
    """
    
    def __init__(
        self,
        min_confidence: float = 0.7,
        consistency_frames: int = 5,
        max_history: int = 30,
        cooldown_time: float = 0.5
    ):
        """
        Initialize temporal smoother
        
        Args:
            min_confidence: Minimum confidence threshold to consider a gesture
            consistency_frames: Number of consistent frames needed to confirm gesture
            max_history: Maximum number of frames to keep in history
            cooldown_time: Minimum time between gesture changes (seconds)
        """
        self.min_confidence = min_confidence
        self.consistency_frames = consistency_frames
        self.max_history = max_history
        self.cooldown_time = cooldown_time
        
        # Gesture history
        self.gesture_history = deque(maxlen=max_history)
        self.confidence_history = deque(maxlen=max_history)
        
        # Current state
        self.current_gesture = None
        self.current_confidence = 0.0
        self.last_gesture_time = 0.0
        self.gesture_start_time = 0.0
        
        # Statistics
        self.gesture_changes = 0
        self.rejected_gestures = 0
        
        logging.info(
            f"TemporalSmoother initialized: "
            f"min_confidence={min_confidence}, "
            f"consistency_frames={consistency_frames}"
        )
    
    def update(
        self, 
        gesture: Optional[str], 
        confidence: float
    ) -> Tuple[Optional[str], float, bool]:
        """
        Update with new gesture prediction and return smoothed result
        
        Args:
            gesture: Predicted gesture name (None if no detection)
            confidence: Confidence score (0-1)
            
        Returns:
            Tuple of (smoothed_gesture, smoothed_confidence, is_new_gesture)
        """
        current_time = time.time()
        
        # If no gesture detected
        if gesture is None or confidence < self.min_confidence:
            self.gesture_history.append(None)
            self.confidence_history.append(0.0)
            
            # Check if we should clear current gesture
            none_count = sum(1 for g in list(self.gesture_history)[-10:] if g is None)
            if none_count >= 7:  # If mostly no detection in recent frames
                if self.current_gesture is not None:
                    logging.debug(f"Clearing gesture due to no detection")
                self.current_gesture = None
                self.current_confidence = 0.0
            
            return self.current_gesture, self.current_confidence, False
        
        # Add to history
        self.gesture_history.append(gesture)
        self.confidence_history.append(confidence)
        
        # Get recent history
        recent_gestures = list(self.gesture_history)[-self.consistency_frames:]
        recent_confidences = list(self.confidence_history)[-self.consistency_frames:]
        
        # Check for gesture consistency
        if len(recent_gestures) < self.consistency_frames:
            # Not enough history yet
            return self.current_gesture, self.current_confidence, False
        
        # Count occurrences of each gesture in recent history
        gesture_counts = {}
        for g, c in zip(recent_gestures, recent_confidences):
            if g is not None and c >= self.min_confidence:
                gesture_counts[g] = gesture_counts.get(g, 0) + 1
        
        # Find most common gesture
        if not gesture_counts:
            return self.current_gesture, self.current_confidence, False
        
        most_common_gesture = max(gesture_counts.items(), key=lambda x: x[1])
        candidate_gesture, count = most_common_gesture
        
        # Check if gesture is consistent enough
        consistency_ratio = count / self.consistency_frames
        
        if consistency_ratio < 0.6:  # At least 60% consistency required
            self.rejected_gestures += 1
            return self.current_gesture, self.current_confidence, False
        
        # Calculate average confidence for the candidate gesture
        avg_confidence = np.mean([
            c for g, c in zip(recent_gestures, recent_confidences) 
            if g == candidate_gesture
        ])
        
        # Check if this is a new gesture
        is_new_gesture = False
        
        if candidate_gesture != self.current_gesture:
            # Check cooldown period
            time_since_last_change = current_time - self.last_gesture_time
            
            if time_since_last_change < self.cooldown_time:
                # Too soon to change gesture
                self.rejected_gestures += 1
                return self.current_gesture, self.current_confidence, False
            
            # New gesture confirmed
            logging.info(
                f"Gesture changed: {self.current_gesture} -> {candidate_gesture} "
                f"(confidence: {avg_confidence:.2f}, consistency: {consistency_ratio:.2f})"
            )
            
            self.current_gesture = candidate_gesture
            self.current_confidence = avg_confidence
            self.last_gesture_time = current_time
            self.gesture_start_time = current_time
            self.gesture_changes += 1
            is_new_gesture = True
        else:
            # Same gesture, update confidence
            # Use weighted average: 70% history, 30% new
            self.current_confidence = (
                0.7 * self.current_confidence + 
                0.3 * avg_confidence
            )
        
        return self.current_gesture, self.current_confidence, is_new_gesture
    
    def get_gesture_duration(self) -> float:
        """Get how long the current gesture has been active"""
        if self.current_gesture is None:
            return 0.0
        return time.time() - self.gesture_start_time
    
    def reset(self):
        """Reset the smoother state"""
        self.gesture_history.clear()
        self.confidence_history.clear()
        self.current_gesture = None
        self.current_confidence = 0.0
        self.last_gesture_time = 0.0
        self.gesture_start_time = 0.0
        logging.info("TemporalSmoother reset")
    
    def get_stats(self) -> Dict:
        """Get smoothing statistics"""
        return {
            'gesture_changes': self.gesture_changes,
            'rejected_gestures': self.rejected_gestures,
            'current_gesture': self.current_gesture,
            'current_confidence': self.current_confidence,
            'gesture_duration': self.get_gesture_duration(),
            'history_size': len(self.gesture_history)
        }
    
    def adjust_sensitivity(self, sensitivity: str):
        """
        Adjust sensitivity level
        
        Args:
            sensitivity: 'low', 'medium', or 'high'
        """
        if sensitivity == 'low':
            self.min_confidence = 0.8
            self.consistency_frames = 8
            self.cooldown_time = 1.0
        elif sensitivity == 'medium':
            self.min_confidence = 0.7
            self.consistency_frames = 5
            self.cooldown_time = 0.5
        elif sensitivity == 'high':
            self.min_confidence = 0.6
            self.consistency_frames = 3
            self.cooldown_time = 0.3
        
        logging.info(f"Sensitivity adjusted to: {sensitivity}")
