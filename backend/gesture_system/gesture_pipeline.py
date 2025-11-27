"""
Integrated Gesture Detection Pipeline
Combines all components for accurate and stable gesture recognition
"""
import cv2
import numpy as np
from typing import Optional, Tuple, Dict
import logging
import time

from .hand_detector import HandDetector
from .feature_extractor import FeatureExtractor
from .gesture_classifier import GestureClassifier
from .temporal_smoother import TemporalSmoother

class GesturePipeline:
    """
    Complete pipeline for gesture detection with temporal smoothing
    Designed to eliminate random behavior and provide accurate, stable gestures
    """
    
    def __init__(
        self,
        min_detection_confidence: float = 0.8,
        min_tracking_confidence: float = 0.7,
        min_gesture_confidence: float = 0.7,
        consistency_frames: int = 5,
        cooldown_time: float = 0.5,
        enable_visualization: bool = True
    ):
        """
        Initialize the complete gesture detection pipeline
        
        Args:
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
            min_gesture_confidence: Minimum confidence for gesture classification
            consistency_frames: Frames needed for consistent gesture
            cooldown_time: Minimum time between gesture changes
            enable_visualization: Whether to draw landmarks on frames
        """
        # Initialize components
        self.hand_detector = HandDetector(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        
        self.feature_extractor = FeatureExtractor()
        
        self.gesture_classifier = GestureClassifier()
        
        self.temporal_smoother = TemporalSmoother(
            min_confidence=min_gesture_confidence,
            consistency_frames=consistency_frames,
            cooldown_time=cooldown_time
        )
        
        self.enable_visualization = enable_visualization
        
        # Performance tracking
        self.frame_count = 0
        self.total_processing_time = 0.0
        self.last_fps_update = time.time()
        self.current_fps = 0.0
        
        # Detection state
        self.last_detection_time = 0.0
        self.detection_timeout = 2.0  # Reset after 2 seconds of no detection
        
        logging.info("GesturePipeline initialized successfully")
    
    def process_frame(
        self, 
        frame: np.ndarray
    ) -> Tuple[Optional[str], float, bool, np.ndarray]:
        """
        Process a single frame and return gesture prediction
        
        Args:
            frame: Input frame (BGR format from camera)
            
        Returns:
            Tuple of:
            - gesture_name: Detected gesture (or None)
            - confidence: Gesture confidence score (0-1)
            - is_new_gesture: Whether this is a new gesture change
            - annotated_frame: Frame with landmarks drawn (if enabled)
        """
        start_time = time.time()
        
        # Step 1: Detect hand
        hand_landmarks = self.hand_detector.detect_hand(frame)
        
        annotated_frame = frame.copy()
        
        if hand_landmarks is None:
            # No hand detected
            gesture, confidence, is_new = self.temporal_smoother.update(None, 0.0)
            
            # Check for detection timeout
            if time.time() - self.last_detection_time > self.detection_timeout:
                if gesture is not None:
                    logging.debug("Detection timeout - resetting gesture")
                    self.temporal_smoother.reset()
                    gesture = None
                    confidence = 0.0
                    is_new = False
            
            self._update_performance(start_time)
            return gesture, confidence, is_new, annotated_frame
        
        # Hand detected - update detection time
        self.last_detection_time = time.time()
        
        # Step 2: Extract landmarks as array
        landmarks_array = self.hand_detector.extract_landmarks_array(hand_landmarks)
        
        # Step 3: Extract features
        features = self.feature_extractor.extract_features(landmarks_array)
        
        # Step 4: Classify gesture
        raw_gesture, raw_confidence = self.gesture_classifier.classify(features)
        
        # Step 5: Apply temporal smoothing
        gesture, confidence, is_new = self.temporal_smoother.update(
            raw_gesture, 
            raw_confidence
        )
        
        # Step 6: Draw visualization
        if self.enable_visualization:
            annotated_frame = self.hand_detector.draw_landmarks(
                annotated_frame,
                hand_landmarks
            )
            
            # Draw gesture info
            annotated_frame = self._draw_gesture_info(
                annotated_frame,
                gesture,
                confidence,
                is_new
            )
        
        self._update_performance(start_time)
        
        return gesture, confidence, is_new, annotated_frame
    
    def _draw_gesture_info(
        self,
        frame: np.ndarray,
        gesture: Optional[str],
        confidence: float,
        is_new: bool
    ) -> np.ndarray:
        """Draw gesture information on frame"""
        h, w = frame.shape[:2]
        
        # Draw background for text
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (400, 120), (0, 0, 0), -1)
        frame = cv2.addWeighted(frame, 0.7, overlay, 0.3, 0)
        
        # Draw gesture name
        if gesture:
            gesture_text = gesture.replace('_', ' ').title()
            color = (0, 255, 0) if is_new else (255, 255, 255)
            cv2.putText(
                frame,
                f"Gesture: {gesture_text}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                color,
                2
            )
            
            # Draw confidence bar
            bar_width = int(300 * confidence)
            cv2.rectangle(frame, (20, 55), (320, 75), (100, 100, 100), 2)
            cv2.rectangle(frame, (20, 55), (20 + bar_width, 75), (0, 255, 0), -1)
            cv2.putText(
                frame,
                f"{confidence:.2%}",
                (330, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
        else:
            cv2.putText(
                frame,
                "No gesture detected",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (100, 100, 100),
                2
            )
        
        # Draw FPS
        cv2.putText(
            frame,
            f"FPS: {self.current_fps:.1f}",
            (20, 100),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 0),
            1
        )
        
        return frame
    
    def _update_performance(self, start_time: float):
        """Update performance metrics"""
        processing_time = time.time() - start_time
        self.total_processing_time += processing_time
        self.frame_count += 1
        
        # Update FPS every second
        if time.time() - self.last_fps_update >= 1.0:
            self.current_fps = self.frame_count / (time.time() - self.last_fps_update)
            self.frame_count = 0
            self.last_fps_update = time.time()
    
    def get_current_gesture(self) -> Tuple[Optional[str], float]:
        """Get current stable gesture"""
        return (
            self.temporal_smoother.current_gesture,
            self.temporal_smoother.current_confidence
        )
    
    def get_gesture_duration(self) -> float:
        """Get how long current gesture has been active"""
        return self.temporal_smoother.get_gesture_duration()
    
    def adjust_sensitivity(self, sensitivity: str):
        """
        Adjust gesture detection sensitivity
        
        Args:
            sensitivity: 'low' (very stable), 'medium' (balanced), 'high' (responsive)
        """
        self.temporal_smoother.adjust_sensitivity(sensitivity)
        logging.info(f"Sensitivity adjusted to: {sensitivity}")
    
    def reset(self):
        """Reset pipeline state"""
        self.temporal_smoother.reset()
        self.hand_detector.reset_stats()
        self.gesture_classifier.reset_stats()
        self.frame_count = 0
        self.total_processing_time = 0.0
        logging.info("Pipeline reset")
    
    def get_statistics(self) -> Dict:
        """Get comprehensive statistics from all components"""
        avg_processing_time = (
            self.total_processing_time / max(self.frame_count, 1) * 1000
        )
        
        stats = {
            'performance': {
                'fps': self.current_fps,
                'avg_processing_time_ms': avg_processing_time,
                'total_frames': self.frame_count
            },
            'hand_detection': self.hand_detector.get_detection_stats(),
            'gesture_classification': self.gesture_classifier.get_stats(),
            'temporal_smoothing': self.temporal_smoother.get_stats()
        }
        
        return stats
    
    def get_all_gestures(self) -> Dict[str, str]:
        """Get dictionary of all available gestures with descriptions"""
        gestures = {}
        for gesture in self.gesture_classifier.gesture_labels.values():
            gestures[gesture] = self.gesture_classifier.get_gesture_description(gesture)
        return gestures
    
    def enable_visualization_mode(self, enable: bool):
        """Enable or disable visualization"""
        self.enable_visualization = enable
    
    def close(self):
        """Release resources"""
        self.hand_detector.close()
        logging.info("Pipeline closed")
