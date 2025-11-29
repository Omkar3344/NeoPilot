"""
Advanced Feature Extraction from Hand Landmarks
"""
import numpy as np
from typing import Dict, List
import math

class FeatureExtractor:
    """Extract geometric and spatial features from hand landmarks"""
    
    # MediaPipe hand landmark indices
    WRIST = 0
    THUMB_CMC = 1
    THUMB_MCP = 2
    THUMB_IP = 3
    THUMB_TIP = 4
    INDEX_MCP = 5
    INDEX_PIP = 6
    INDEX_DIP = 7
    INDEX_TIP = 8
    MIDDLE_MCP = 9
    MIDDLE_PIP = 10
    MIDDLE_DIP = 11
    MIDDLE_TIP = 12
    RING_MCP = 13
    RING_PIP = 14
    RING_DIP = 15
    RING_TIP = 16
    PINKY_MCP = 17
    PINKY_PIP = 18
    PINKY_DIP = 19
    PINKY_TIP = 20
    
    def __init__(self):
        """Initialize feature extractor"""
        self.finger_tips = [
            self.THUMB_TIP,
            self.INDEX_TIP,
            self.MIDDLE_TIP,
            self.RING_TIP,
            self.PINKY_TIP
        ]
        
        self.finger_pips = [
            self.THUMB_IP,
            self.INDEX_PIP,
            self.MIDDLE_PIP,
            self.RING_PIP,
            self.PINKY_PIP
        ]
        
        self.finger_mcps = [
            self.THUMB_MCP,
            self.INDEX_MCP,
            self.MIDDLE_MCP,
            self.RING_MCP,
            self.PINKY_MCP
        ]
    
    def extract_features(self, landmarks: np.ndarray) -> Dict:
        """
        Extract comprehensive features from hand landmarks
        
        Args:
            landmarks: Array of shape (21, 3) containing hand landmarks
            
        Returns:
            Dictionary containing all extracted features
        """
        features = {}
        
        # Basic landmark features
        features['raw_landmarks'] = landmarks.flatten()
        features['wrist_position'] = {
            'x': landmarks[self.WRIST][0],
            'y': landmarks[self.WRIST][1],
            'z': landmarks[self.WRIST][2]
        }
        
        # Finger extension features (improved accuracy)
        features['fingers_extended'] = self._get_fingers_extended(landmarks)
        features['extended_count'] = sum(features['fingers_extended'])
        
        # Finger angles
        features['finger_angles'] = self._get_finger_angles(landmarks)
        
        # Distance features
        features['finger_distances'] = self._get_finger_distances(landmarks)
        
        # Palm features
        features['palm_center'] = self._get_palm_center(landmarks)
        features['palm_orientation'] = self._get_palm_orientation(landmarks)
        features['palm_normal'] = self._get_palm_normal(landmarks)  # Enhanced palm direction
        features['palm_size'] = self._get_palm_size(landmarks)
        
        # Hand direction
        features['hand_direction'] = self._get_hand_direction(landmarks)
        
        # Thumb direction (for left/right gestures)
        features['thumb_direction'] = self._get_thumb_direction(landmarks)
        
        # Finger spread
        features['finger_spread'] = self._get_finger_spread(landmarks)
        
        # Thumb position relative to other fingers
        features['thumb_position'] = self._get_thumb_position(landmarks)
        
        return features
    
    def _get_fingers_extended(self, landmarks: np.ndarray) -> List[bool]:
        """
        Determine which fingers are extended with improved accuracy
        
        Returns:
            List of 5 booleans [thumb, index, middle, ring, pinky]
        """
        extended = []
        wrist = landmarks[self.WRIST]
        
        # === THUMB (most complex due to different axis) ===
        thumb_tip = landmarks[self.THUMB_TIP]
        thumb_mcp = landmarks[self.THUMB_MCP]
        thumb_ip = landmarks[self.THUMB_IP]
        index_mcp = landmarks[self.INDEX_MCP]
        
        # Method 1: Compare thumb tip to MCP distance from wrist
        thumb_tip_dist = np.linalg.norm(thumb_tip - wrist)
        thumb_mcp_dist = np.linalg.norm(thumb_mcp - wrist)
        thumb_extended_dist = thumb_tip_dist > thumb_mcp_dist * 1.2
        
        # Method 2: Thumb should be away from index MCP (not folded in)
        thumb_to_index_dist = np.linalg.norm(thumb_tip - index_mcp)
        thumb_extended_spread = thumb_to_index_dist > 0.08
        
        # Method 3: Check X-axis distance (thumb extends sideways)
        thumb_extended_x = abs(thumb_tip[0] - wrist[0]) > 0.07
        
        # Thumb is extended if at least 2 of 3 methods confirm
        thumb_votes = sum([thumb_extended_dist, thumb_extended_spread, thumb_extended_x])
        thumb_extended = thumb_votes >= 2
        extended.append(thumb_extended)
        
        # === OTHER FINGERS (simpler - they extend vertically) ===
        finger_data = [
            (self.INDEX_TIP, self.INDEX_PIP, self.INDEX_MCP),
            (self.MIDDLE_TIP, self.MIDDLE_PIP, self.MIDDLE_MCP),
            (self.RING_TIP, self.RING_PIP, self.RING_MCP),
            (self.PINKY_TIP, self.PINKY_PIP, self.PINKY_MCP)
        ]
        
        for tip_idx, pip_idx, mcp_idx in finger_data:
            tip = landmarks[tip_idx]
            pip = landmarks[pip_idx]
            mcp = landmarks[mcp_idx]
            
            # Method 1: Tip should be above MCP (lower Y value)
            extended_vertical = tip[1] < mcp[1] - 0.03
            
            # Method 2: Tip should be far from wrist
            tip_wrist_dist = np.linalg.norm(tip - wrist)
            mcp_wrist_dist = np.linalg.norm(mcp - wrist)
            extended_distance = tip_wrist_dist > mcp_wrist_dist * 1.1
            
            # Method 3: Check if finger is straight (angle-based)
            # Calculate angle at PIP joint
            v1 = mcp - pip
            v2 = tip - pip
            cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
            angle = np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0)))
            extended_angle = angle > 140  # Finger is straight if angle > 140 degrees
            
            # Finger is extended if at least 2 methods confirm
            finger_votes = sum([extended_vertical, extended_distance, extended_angle])
            finger_extended = finger_votes >= 2
            extended.append(finger_extended)
        
        return extended
    
    def _get_finger_angles(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Calculate angles for each finger"""
        angles = {}
        
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        finger_joints = [
            [self.THUMB_CMC, self.THUMB_MCP, self.THUMB_IP, self.THUMB_TIP],
            [self.INDEX_MCP, self.INDEX_PIP, self.INDEX_DIP, self.INDEX_TIP],
            [self.MIDDLE_MCP, self.MIDDLE_PIP, self.MIDDLE_DIP, self.MIDDLE_TIP],
            [self.RING_MCP, self.RING_PIP, self.RING_DIP, self.RING_TIP],
            [self.PINKY_MCP, self.PINKY_PIP, self.PINKY_DIP, self.PINKY_TIP]
        ]
        
        for name, joints in zip(finger_names, finger_joints):
            # Calculate angle at middle joint (PIP)
            angle = self._calculate_angle(
                landmarks[joints[0]],
                landmarks[joints[1]],
                landmarks[joints[2]]
            )
            angles[f'{name}_angle'] = angle
        
        return angles
    
    def _calculate_angle(self, p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """Calculate angle between three points"""
        v1 = p1 - p2
        v2 = p3 - p2
        
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
        cos_angle = np.clip(cos_angle, -1.0, 1.0)
        angle = np.arccos(cos_angle)
        
        return np.degrees(angle)
    
    def _get_finger_distances(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Calculate distances between key points"""
        distances = {}
        
        # Distance from each fingertip to wrist
        wrist = landmarks[self.WRIST]
        finger_names = ['thumb', 'index', 'middle', 'ring', 'pinky']
        
        for name, tip_idx in zip(finger_names, self.finger_tips):
            dist = np.linalg.norm(landmarks[tip_idx] - wrist)
            distances[f'{name}_to_wrist'] = dist
        
        # Distance between adjacent fingertips
        for i in range(len(self.finger_tips) - 1):
            dist = np.linalg.norm(
                landmarks[self.finger_tips[i]] - landmarks[self.finger_tips[i + 1]]
            )
            distances[f'finger_{i}_to_{i+1}'] = dist
        
        # Thumb to index distance (important for pinch gestures)
        distances['thumb_index_distance'] = np.linalg.norm(
            landmarks[self.THUMB_TIP] - landmarks[self.INDEX_TIP]
        )
        
        return distances
    
    def _get_palm_center(self, landmarks: np.ndarray) -> np.ndarray:
        """Calculate palm center position"""
        palm_landmarks = [
            self.WRIST,
            self.INDEX_MCP,
            self.MIDDLE_MCP,
            self.RING_MCP,
            self.PINKY_MCP
        ]
        palm_points = landmarks[palm_landmarks]
        return np.mean(palm_points, axis=0)
    
    def _get_palm_orientation(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Calculate palm orientation angles"""
        # Vector from wrist to middle finger MCP
        wrist_to_middle = landmarks[self.MIDDLE_MCP] - landmarks[self.WRIST]
        
        # Calculate pitch (up/down) and yaw (left/right)
        pitch = np.arctan2(wrist_to_middle[1], wrist_to_middle[2])
        yaw = np.arctan2(wrist_to_middle[0], wrist_to_middle[2])
        
        # Calculate roll (rotation) using cross product of palm vectors
        wrist = landmarks[self.WRIST]
        index_mcp = landmarks[self.INDEX_MCP]
        pinky_mcp = landmarks[self.PINKY_MCP]
        
        # Vector across palm (index to pinky)
        palm_vector = pinky_mcp - index_mcp
        roll = np.arctan2(palm_vector[1], palm_vector[0])
        
        return {
            'pitch': np.degrees(pitch),
            'yaw': np.degrees(yaw),
            'roll': np.degrees(roll)
        }
    
    def _get_palm_normal(self, landmarks: np.ndarray) -> Dict[str, float]:
        """
        Calculate palm normal vector using cross product
        More accurate than pitch/yaw for detecting palm facing direction
        """
        wrist = landmarks[self.WRIST]
        index_mcp = landmarks[self.INDEX_MCP]
        pinky_mcp = landmarks[self.PINKY_MCP]
        middle_mcp = landmarks[self.MIDDLE_MCP]
        
        # Two vectors on the palm plane
        v1 = index_mcp - wrist  # Vector from wrist to index
        v2 = pinky_mcp - wrist  # Vector from wrist to pinky
        
        # Cross product gives normal vector perpendicular to palm
        normal = np.cross(v1, v2)
        normal_normalized = normal / (np.linalg.norm(normal) + 1e-6)
        
        # If palm is facing camera, normal.z should be negative
        # If palm is facing away, normal.z should be positive
        return {
            'x': normal_normalized[0],
            'y': normal_normalized[1],
            'z': normal_normalized[2],
            'facing_camera': normal_normalized[2] < -0.3,  # Palm facing forward
            'facing_away': normal_normalized[2] > 0.3,     # Back of hand visible
            'magnitude': np.linalg.norm(normal)
        }
    
    def _get_palm_size(self, landmarks: np.ndarray) -> float:
        """Calculate palm size (used for normalization)"""
        # Distance from wrist to middle finger MCP
        palm_size = np.linalg.norm(
            landmarks[self.MIDDLE_MCP] - landmarks[self.WRIST]
        )
        return palm_size
    
    def _get_hand_direction(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Get overall hand pointing direction"""
        # Use middle finger as reference
        wrist = landmarks[self.WRIST]
        middle_tip = landmarks[self.MIDDLE_TIP]
        
        direction = middle_tip - wrist
        direction_norm = direction / (np.linalg.norm(direction) + 1e-6)
        
        return {
            'x': direction_norm[0],
            'y': direction_norm[1],
            'z': direction_norm[2]
        }
    
    def _get_thumb_direction(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Get thumb pointing direction (for left/right detection)"""
        # Use thumb tip relative to wrist
        wrist = landmarks[self.WRIST]
        thumb_tip = landmarks[self.THUMB_TIP]
        
        direction = thumb_tip - wrist
        direction_norm = direction / (np.linalg.norm(direction) + 1e-6)
        
        return {
            'x': direction_norm[0],
            'y': direction_norm[1],
            'z': direction_norm[2]
        }
    
    def _get_finger_spread(self, landmarks: np.ndarray) -> float:
        """Calculate how spread out the fingers are"""
        # Calculate average distance between adjacent fingertips
        total_spread = 0
        count = 0
        
        for i in range(len(self.finger_tips) - 1):
            dist = np.linalg.norm(
                landmarks[self.finger_tips[i]] - landmarks[self.finger_tips[i + 1]]
            )
            total_spread += dist
            count += 1
        
        return total_spread / count if count > 0 else 0
    
    def _get_thumb_position(self, landmarks: np.ndarray) -> Dict[str, float]:
        """Get thumb position relative to palm"""
        thumb_tip = landmarks[self.THUMB_TIP]
        palm_center = self._get_palm_center(landmarks)
        
        relative_pos = thumb_tip - palm_center
        
        return {
            'x': relative_pos[0],
            'y': relative_pos[1],
            'z': relative_pos[2],
            'distance': np.linalg.norm(relative_pos)
        }
