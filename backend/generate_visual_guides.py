"""
Visual Gesture Guide Generator
Creates a visual reference for all supported gestures
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def create_gesture_guide():
    """Create a visual guide for all gestures"""
    
    # Define gestures with visual descriptions
    gestures = [
        {
            'name': 'TAKEOFF',
            'hand': '🖐️',
            'description': 'Open palm\n5 fingers extended\nFingers spread wide',
            'action': 'Drone takes off'
        },
        {
            'name': 'LAND',
            'hand': '✊',
            'description': 'Closed fist\nAll fingers down\nNo fingers visible',
            'action': 'Drone lands'
        },
        {
            'name': 'MOVE FORWARD',
            'hand': '✌️',
            'description': 'Peace sign\nIndex + Middle up\nPoint forward',
            'action': 'Move forward'
        },
        {
            'name': 'MOVE BACKWARD',
            'hand': '🖖',
            'description': '4 fingers up\nNo thumb\nPalm facing camera',
            'action': 'Move backward'
        },
        {
            'name': 'MOVE LEFT',
            'hand': '👈',
            'description': 'Hand tilted left\nOr pointing left\n3+ fingers',
            'action': 'Move left'
        },
        {
            'name': 'MOVE RIGHT',
            'hand': '👉',
            'description': 'Hand tilted right\nOr pointing right\n3+ fingers',
            'action': 'Move right'
        },
        {
            'name': 'ROTATE LEFT',
            'hand': '🤟',
            'description': 'L-shape left\nThumb + Index\nPointing left',
            'action': 'Rotate CCW'
        },
        {
            'name': 'ROTATE RIGHT',
            'hand': '🤙',
            'description': 'L-shape right\nThumb + Index\nPointing right',
            'action': 'Rotate CW'
        },
        {
            'name': 'HOVER',
            'hand': '🤘',
            'description': '3 fingers up\nIndex+Middle+Ring\nNo thumb, no pinky',
            'action': 'Hover in place'
        },
        {
            'name': 'EMERGENCY STOP',
            'hand': '🤙',
            'description': 'Only pinky up\nAll other fingers down\nClear signal',
            'action': 'Emergency stop'
        }
    ]
    
    # Create image
    width = 1200
    height = 300 * len(gestures)
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    
    # Colors
    header_bg = (41, 128, 185)  # Blue
    text_color = (0, 0, 0)
    action_color = (46, 204, 113)  # Green
    
    y_offset = 0
    row_height = 300
    
    for i, gesture in enumerate(gestures):
        # Alternating background
        if i % 2 == 0:
            cv2.rectangle(img, (0, y_offset), (width, y_offset + row_height), 
                         (245, 245, 245), -1)
        
        # Gesture number circle
        cv2.circle(img, (80, y_offset + 150), 50, header_bg, -1)
        cv2.putText(img, str(i+1), (60, y_offset + 170), 
                   cv2.FONT_HERSHEY_BOLD, 1.5, (255, 255, 255), 3)
        
        # Gesture name
        cv2.putText(img, gesture['name'], (160, y_offset + 80), 
                   cv2.FONT_HERSHEY_BOLD, 1.2, text_color, 3)
        
        # Hand emoji (large)
        cv2.putText(img, gesture['hand'], (160, y_offset + 180), 
                   cv2.FONT_HERSHEY_SIMPLEX, 3, text_color, 2)
        
        # Description (multi-line)
        desc_lines = gesture['description'].split('\n')
        for j, line in enumerate(desc_lines):
            cv2.putText(img, line, (400, y_offset + 80 + j*35), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, text_color, 2)
        
        # Action box
        cv2.rectangle(img, (400, y_offset + 200), (900, y_offset + 260), 
                     action_color, 2)
        cv2.putText(img, f"Action: {gesture['action']}", (420, y_offset + 235), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, action_color, 2)
        
        # Separator line
        if i < len(gestures) - 1:
            cv2.line(img, (0, y_offset + row_height), 
                    (width, y_offset + row_height), (200, 200, 200), 2)
        
        y_offset += row_height
    
    # Title at top
    title_height = 100
    title_img = np.ones((title_height, width, 3), dtype=np.uint8)
    title_img[:] = header_bg
    
    cv2.putText(title_img, "NeoPilot - Gesture Reference Guide", 
               (50, 65), cv2.FONT_HERSHEY_BOLD, 1.5, (255, 255, 255), 3)
    
    # Combine
    final_img = np.vstack([title_img, img])
    
    # Save
    cv2.imwrite('gesture_guide.png', final_img)
    print("✓ Gesture guide saved as 'gesture_guide.png'")
    print(f"  Size: {final_img.shape[1]}x{final_img.shape[0]} pixels")
    
    return final_img

def create_tips_guide():
    """Create a tips and best practices guide"""
    
    width = 800
    height = 900
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    
    # Header
    header_height = 80
    cv2.rectangle(img, (0, 0), (width, header_height), (231, 76, 60), -1)
    cv2.putText(img, "Tips for Best Results", (50, 55), 
               cv2.FONT_HERSHEY_BOLD, 1.5, (255, 255, 255), 3)
    
    tips = [
        ("1. Lighting", "Ensure your hand is well-lit. Natural light works best."),
        ("2. Background", "Use a plain background. Avoid clutter behind you."),
        ("3. Distance", "Keep hand at arm's length from camera (~50-70cm)."),
        ("4. Position", "Center your hand in the camera frame."),
        ("5. Steady Hold", "Hold each gesture for 1-2 seconds before changing."),
        ("6. Clear Gestures", "Make distinct, deliberate gestures. Don't rush."),
        ("7. One Hand", "System tracks one hand only. Use your dominant hand."),
        ("8. Camera Angle", "Position camera at chest height for best results."),
        ("9. Confidence", "Watch confidence meter. Should be >70% for reliable detection."),
        ("10. Practice", "Try test mode first to get familiar with gestures.")
    ]
    
    y_offset = 120
    
    for title, desc in tips:
        # Tip number and title
        cv2.putText(img, title, (50, y_offset), 
                   cv2.FONT_HERSHEY_BOLD, 0.9, (52, 73, 94), 2)
        
        # Description
        cv2.putText(img, desc, (50, y_offset + 35), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 1)
        
        # Separator
        cv2.line(img, (50, y_offset + 55), (width-50, y_offset + 55), 
                (200, 200, 200), 1)
        
        y_offset += 80
    
    # Save
    cv2.imwrite('tips_guide.png', img)
    print("✓ Tips guide saved as 'tips_guide.png'")
    print(f"  Size: {img.shape[1]}x{img.shape[0]} pixels")
    
    return img

def create_troubleshooting_guide():
    """Create troubleshooting guide"""
    
    width = 900
    height = 1000
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    
    # Header
    header_height = 80
    cv2.rectangle(img, (0, 0), (width, header_height), (155, 89, 182), -1)
    cv2.putText(img, "Troubleshooting Guide", (50, 55), 
               cv2.FONT_HERSHEY_BOLD, 1.5, (255, 255, 255), 3)
    
    issues = [
        ("Gestures not detected", [
            "• Check lighting conditions",
            "• Ensure hand is in frame",
            "• Make more distinct gestures",
            "• Try higher sensitivity mode"
        ]),
        ("Too many false detections", [
            "• Use lower sensitivity mode",
            "• Make more deliberate gestures",
            "• Increase cooldown time in config",
            "• Keep hand still during gesture"
        ]),
        ("Low FPS / Laggy", [
            "• Close other programs",
            "• Reduce video resolution",
            "• Check CPU usage",
            "• Disable visualization if needed"
        ]),
        ("Random commands still occurring", [
            "• Increase consistency_frames in config",
            "• Use low sensitivity mode",
            "• Ensure good lighting",
            "• Keep hand steady"
        ])
    ]
    
    y_offset = 110
    
    for issue, solutions in issues:
        # Issue title
        cv2.rectangle(img, (30, y_offset-5), (width-30, y_offset+35), 
                     (52, 152, 219), -1)
        cv2.putText(img, issue, (50, y_offset+25), 
                   cv2.FONT_HERSHEY_BOLD, 0.85, (255, 255, 255), 2)
        
        y_offset += 50
        
        # Solutions
        for solution in solutions:
            cv2.putText(img, solution, (60, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.65, (80, 80, 80), 1)
            y_offset += 30
        
        y_offset += 20
    
    # Bottom note
    cv2.rectangle(img, (30, height-120), (width-30, height-30), 
                 (46, 204, 113), -1)
    cv2.putText(img, "Still having issues?", (50, height-85), 
               cv2.FONT_HERSHEY_BOLD, 0.9, (255, 255, 255), 2)
    cv2.putText(img, "Check statistics: curl http://127.0.0.1:8000/stats", 
               (50, height-55), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 1)
    
    # Save
    cv2.imwrite('troubleshooting_guide.png', img)
    print("✓ Troubleshooting guide saved as 'troubleshooting_guide.png'")
    print(f"  Size: {img.shape[1]}x{img.shape[0]} pixels")
    
    return img

if __name__ == "__main__":
    print("="*60)
    print("NeoPilot - Generating Visual Guides")
    print("="*60)
    print()
    
    create_gesture_guide()
    create_tips_guide()
    create_troubleshooting_guide()
    
    print()
    print("="*60)
    print("✓ All guides generated successfully!")
    print("="*60)
    print("\nGenerated files:")
    print("  1. gesture_guide.png - Complete gesture reference")
    print("  2. tips_guide.png - Best practices")
    print("  3. troubleshooting_guide.png - Common issues")
    print("\nYou can view these images or include them in documentation.")
