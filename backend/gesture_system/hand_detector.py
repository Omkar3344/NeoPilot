"""
Optimized Hand Detection using MediaPipe
"""
import cv2
import mediapipe as mp
import numpy as np
from typing import Optional, List, Tuple
import logging

class HandDetector:
    """Enhanced hand detection with MediaPipe optimized for accuracy"""
    
    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.8,  # Increased for accuracy
        min_tracking_confidence: float = 0.7,   # Increased for stability
        model_complexity: int = 1               # 0=lite, 1=full (more accurate)
    ):
        """
        Initialize hand detector with optimized parameters
        
        Args:
            static_image_mode: If True, detection runs on every frame (slower but more accurate)
            max_num_hands: Maximum number of hands to detect
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
            model_complexity: Model complexity (0 or 1), higher = more accurate
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=model_complexity
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Hand detection statistics
        self.detection_count = 0
        self.failed_detection_count = 0
        
        logging.info(f"HandDetector initialized with confidence={min_detection_confidence}")
    
    def detect_hand(self, frame: np.ndarray) -> Optional[object]:
        """
        Detect hand in frame
        
        Args:
            frame: Input frame in BGR format
            
        Returns:
            Hand landmarks object if detected, None otherwise
        """
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Improve image quality for better detection
        rgb_frame = self._preprocess_frame(rgb_frame)
        
        # Process the frame
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            self.detection_count += 1
            # Return first detected hand
            return results.multi_hand_landmarks[0]
        else:
            self.failed_detection_count += 1
            return None
    
    def _preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """
        Preprocess frame for better hand detection
        
        Args:
            frame: Input frame in RGB format
            
        Returns:
            Preprocessed frame
        """
        # Apply slight blur to reduce noise
        frame = cv2.GaussianBlur(frame, (3, 3), 0)
        
        # Enhance contrast
        lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.merge([l, a, b])
        frame = cv2.cvtColor(enhanced, cv2.COLOR_LAB2RGB)
        
        return frame
    
    def extract_landmarks(self, hand_landmarks) -> List[float]:
        """
        Extract normalized 3D landmarks from hand
        
        Args:
            hand_landmarks: MediaPipe hand landmarks object
            
        Returns:
            List of 63 values (21 landmarks × 3 coordinates)
        """
        landmarks = []
        for landmark in hand_landmarks.landmark:
            landmarks.extend([landmark.x, landmark.y, landmark.z])
        return landmarks
    
    def extract_landmarks_array(self, hand_landmarks) -> np.ndarray:
        """
        Extract landmarks as numpy array for easier processing
        
        Args:
            hand_landmarks: MediaPipe hand landmarks object
            
        Returns:
            Array of shape (21, 3) containing landmark coordinates
        """
        landmarks = self.extract_landmarks(hand_landmarks)
        return np.array(landmarks).reshape(21, 3)
    
    def get_hand_bounding_box(self, hand_landmarks, frame_width: int, frame_height: int, padding: float = 0.3) -> Tuple[int, int, int, int]:
        """
        Calculate bounding box around detected hand with padding
        
        Args:
            hand_landmarks: MediaPipe hand landmarks object
            frame_width: Width of the frame
            frame_height: Height of the frame
            padding: Padding percentage around hand (0.3 = 30% extra space)
            
        Returns:
            Tuple of (x_min, y_min, x_max, y_max) in pixel coordinates
        """
        if hand_landmarks is None:
            return None
        
        # Extract all x, y coordinates
        x_coords = [landmark.x for landmark in hand_landmarks.landmark]
        y_coords = [landmark.y for landmark in hand_landmarks.landmark]
        
        # Find bounding box
        x_min = min(x_coords)
        x_max = max(x_coords)
        y_min = min(y_coords)
        y_max = max(y_coords)
        
        # Add padding
        width = x_max - x_min
        height = y_max - y_min
        
        x_min = max(0, x_min - width * padding)
        x_max = min(1, x_max + width * padding)
        y_min = max(0, y_min - height * padding)
        y_max = min(1, y_max + height * padding)
        
        # Convert to pixel coordinates
        x_min_px = int(x_min * frame_width)
        x_max_px = int(x_max * frame_width)
        y_min_px = int(y_min * frame_height)
        y_max_px = int(y_max * frame_height)
        
        # Ensure minimum size for better visibility
        min_size = 200
        if x_max_px - x_min_px < min_size:
            center_x = (x_min_px + x_max_px) // 2
            x_min_px = max(0, center_x - min_size // 2)
            x_max_px = min(frame_width, center_x + min_size // 2)
        
        if y_max_px - y_min_px < min_size:
            center_y = (y_min_px + y_max_px) // 2
            y_min_px = max(0, center_y - min_size // 2)
            y_max_px = min(frame_height, center_y + min_size // 2)
        
        return (x_min_px, y_min_px, x_max_px, y_max_px)
    
    def draw_landmarks(
        self, 
        frame: np.ndarray, 
        hand_landmarks,
        draw_connections: bool = True
    ) -> np.ndarray:
        """
        Draw hand landmarks on frame
        
        Args:
            frame: Input frame
            hand_landmarks: MediaPipe hand landmarks
            draw_connections: Whether to draw connections between landmarks
            
        Returns:
            Frame with drawn landmarks
        """
        if hand_landmarks is None:
            return frame
        
        if draw_connections:
            self.mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing_styles.get_default_hand_landmarks_style(),
                self.mp_drawing_styles.get_default_hand_connections_style()
            )
        else:
            self.mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                None,
                self.mp_drawing_styles.get_default_hand_landmarks_style()
            )
        
        return frame
    
    def get_detection_stats(self) -> dict:
        """Get hand detection statistics"""
        total = self.detection_count + self.failed_detection_count
        success_rate = (self.detection_count / total * 100) if total > 0 else 0
        
        return {
            'detections': self.detection_count,
            'failed_detections': self.failed_detection_count,
            'success_rate': success_rate
        }
    
    def reset_stats(self):
        """Reset detection statistics"""
        self.detection_count = 0
        self.failed_detection_count = 0
    
    def close(self):
        """Release resources"""
        self.hands.close()
