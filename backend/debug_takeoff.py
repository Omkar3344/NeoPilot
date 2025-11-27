"""
Debug script for testing takeoff gesture specifically
Shows detailed finger detection information
"""
import cv2
import logging
import numpy as np
from gesture_system.gesture_pipeline import GesturePipeline
from gesture_system.hand_detector import HandDetector
from gesture_system.feature_extractor import FeatureExtractor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def main():
    print("="*60)
    print("TAKEOFF GESTURE DEBUG TEST")
    print("="*60)
    print("\nThis will help diagnose why takeoff isn't being detected.")
    print("\nFor TAKEOFF gesture:")
    print("  • Open your palm wide")
    print("  • Spread all 5 fingers")
    print("  • Face palm toward camera")
    print("\nPress 'q' to quit\n")
    print("="*60)
    
    # Initialize components
    hand_detector = HandDetector(min_detection_confidence=0.8)
    feature_extractor = FeatureExtractor()
    
    # Initialize camera
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    if not camera.isOpened():
        print("ERROR: Could not open camera")
        return
    
    try:
        while True:
            ret, frame = camera.read()
            if not ret:
                continue
            
            frame = cv2.flip(frame, 1)
            
            # Detect hand
            hand_landmarks = hand_detector.detect_hand(frame)
            
            if hand_landmarks:
                # Extract features
                landmarks_array = hand_detector.extract_landmarks_array(hand_landmarks)
                features = feature_extractor.extract_features(landmarks_array)
                
                # Get detailed info
                fingers_extended = features['fingers_extended']
                extended_count = features['extended_count']
                finger_spread = features['finger_spread']
                
                # Draw landmarks
                frame = hand_detector.draw_landmarks(frame, hand_landmarks)
                
                # Display detailed information
                y_pos = 30
                cv2.putText(frame, "FINGER STATUS:", (10, y_pos), 
                           cv2.FONT_HERSHEY_BOLD, 0.6, (255, 255, 255), 2)
                y_pos += 30
                
                finger_names = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
                for i, (name, extended) in enumerate(zip(finger_names, fingers_extended)):
                    color = (0, 255, 0) if extended else (0, 0, 255)
                    status = "EXTENDED" if extended else "closed"
                    cv2.putText(frame, f"{name}: {status}", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
                    y_pos += 25
                
                y_pos += 10
                cv2.putText(frame, f"Total Extended: {extended_count}/5", (10, y_pos), 
                           cv2.FONT_HERSHEY_BOLD, 0.6, (255, 255, 0), 2)
                y_pos += 30
                
                cv2.putText(frame, f"Finger Spread: {finger_spread:.3f}", (10, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                y_pos += 30
                
                # Check takeoff conditions
                takeoff_check1 = extended_count == 5 and finger_spread > 0.12
                takeoff_check2 = extended_count >= 4 and finger_spread > 0.13 and \
                                all(fingers_extended[1:])  # All fingers except thumb
                
                if takeoff_check1 or takeoff_check2:
                    cv2.putText(frame, "TAKEOFF DETECTED!", (10, y_pos), 
                               cv2.FONT_HERSHEY_BOLD, 1.0, (0, 255, 0), 3)
                    print(f"✓ TAKEOFF! Extended: {extended_count}, Spread: {finger_spread:.3f}")
                else:
                    # Show what's needed
                    cv2.putText(frame, "NOT TAKEOFF", (10, y_pos), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    y_pos += 30
                    
                    if extended_count < 4:
                        cv2.putText(frame, f"Need 4+ fingers (have {extended_count})", 
                                   (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)
                        y_pos += 25
                    
                    if finger_spread < 0.12:
                        cv2.putText(frame, f"Spread fingers more (spread={finger_spread:.3f})", 
                                   (10, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 1)
                        y_pos += 25
                
                # Show requirements
                cv2.putText(frame, "Requirements:", (10, frame.shape[0] - 80), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                cv2.putText(frame, "5 fingers + spread>0.12", (10, frame.shape[0] - 55), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                cv2.putText(frame, "OR 4 fingers + spread>0.13", (10, frame.shape[0] - 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
                
            else:
                cv2.putText(frame, "NO HAND DETECTED", (10, 30), 
                           cv2.FONT_HERSHEY_BOLD, 0.8, (0, 0, 255), 2)
                cv2.putText(frame, "Show your hand to the camera", (10, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            
            cv2.imshow('Takeoff Gesture Debug', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    except KeyboardInterrupt:
        print("\nInterrupted")
    
    finally:
        camera.release()
        cv2.destroyAllWindows()
        hand_detector.close()
        print("\n✓ Debug test completed")

if __name__ == "__main__":
    main()
