"""
Test script for the improved gesture detection system
Run this to test gesture detection without the full backend
"""
import cv2
import sys
import logging
from gesture_system.gesture_pipeline import GesturePipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Test the gesture detection pipeline"""
    
    print("="*60)
    print("NeoPilot - Improved Gesture Detection Test")
    print("="*60)
    print("\nInitializing gesture detection pipeline...")
    
    # Initialize pipeline
    try:
        pipeline = GesturePipeline(
            min_detection_confidence=0.8,
            min_tracking_confidence=0.7,
            min_gesture_confidence=0.7,
            consistency_frames=5,
            cooldown_time=0.5,
            enable_visualization=True
        )
        print("✓ Pipeline initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize pipeline: {e}")
        return
    
    # Initialize camera
    print("\nInitializing camera...")
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    camera.set(cv2.CAP_PROP_FPS, 30)
    
    if not camera.isOpened():
        print("✗ Failed to open camera")
        return
    
    print("✓ Camera initialized successfully")
    
    # Print available gestures
    print("\n" + "="*60)
    print("AVAILABLE GESTURES")
    print("="*60)
    gestures = pipeline.get_all_gestures()
    for gesture, description in gestures.items():
        print(f"• {gesture.replace('_', ' ').title()}")
        print(f"  {description}")
        print()
    
    print("="*60)
    print("CONTROLS")
    print("="*60)
    print("• Press 'q' to quit")
    print("• Press 's' to show statistics")
    print("• Press '1' for low sensitivity (stable)")
    print("• Press '2' for medium sensitivity (default)")
    print("• Press '3' for high sensitivity (responsive)")
    print("• Press 'r' to reset pipeline")
    print("="*60)
    print("\nStarting gesture detection...\n")
    
    frame_count = 0
    last_gesture = None
    
    try:
        while True:
            ret, frame = camera.read()
            if not ret:
                print("Failed to capture frame")
                break
            
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            gesture, confidence, is_new, annotated_frame = pipeline.process_frame(frame)
            
            # Log new gestures
            if is_new and gesture:
                print(f"[NEW GESTURE] {gesture.replace('_', ' ').title()} - Confidence: {confidence:.2%}")
                last_gesture = gesture
            
            # Display frame
            cv2.imshow('NeoPilot - Gesture Detection Test', annotated_frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("\nQuitting...")
                break
            elif key == ord('s'):
                # Show statistics
                stats = pipeline.get_statistics()
                print("\n" + "="*60)
                print("STATISTICS")
                print("="*60)
                print(f"FPS: {stats['performance']['fps']:.1f}")
                print(f"Avg Processing Time: {stats['performance']['avg_processing_time_ms']:.1f}ms")
                print(f"Hand Detection Success Rate: {stats['hand_detection']['success_rate']:.1f}%")
                print(f"Current Gesture: {stats['temporal_smoothing']['current_gesture']}")
                print(f"Gesture Duration: {stats['temporal_smoothing']['gesture_duration']:.1f}s")
                print(f"Gesture Changes: {stats['temporal_smoothing']['gesture_changes']}")
                print(f"Rejected Gestures: {stats['temporal_smoothing']['rejected_gestures']}")
                print("="*60 + "\n")
            elif key == ord('1'):
                pipeline.adjust_sensitivity('low')
                print("Sensitivity: LOW (very stable)")
            elif key == ord('2'):
                pipeline.adjust_sensitivity('medium')
                print("Sensitivity: MEDIUM (balanced)")
            elif key == ord('3'):
                pipeline.adjust_sensitivity('high')
                print("Sensitivity: HIGH (responsive)")
            elif key == ord('r'):
                pipeline.reset()
                print("Pipeline reset")
            
            frame_count += 1
    
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    
    finally:
        # Cleanup
        print("\nCleaning up...")
        
        # Show final statistics
        stats = pipeline.get_statistics()
        print("\n" + "="*60)
        print("FINAL STATISTICS")
        print("="*60)
        print(f"Total Frames: {stats['performance']['total_frames']}")
        print(f"Average FPS: {stats['performance']['fps']:.1f}")
        print(f"Hand Detection Success Rate: {stats['hand_detection']['success_rate']:.1f}%")
        print(f"Total Gesture Changes: {stats['temporal_smoothing']['gesture_changes']}")
        print(f"Rejected Gestures: {stats['temporal_smoothing']['rejected_gestures']}")
        
        print("\nGesture Distribution:")
        if 'gesture_percentages' in stats['gesture_classification']:
            for gesture, percentage in stats['gesture_classification']['gesture_percentages'].items():
                if percentage > 0:
                    print(f"  {gesture.replace('_', ' ').title()}: {percentage:.1f}%")
        
        print("="*60)
        
        camera.release()
        cv2.destroyAllWindows()
        pipeline.close()
        print("\n✓ Test completed successfully")

if __name__ == "__main__":
    main()
