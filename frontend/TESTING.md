# Frontend Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies (if not done)
```bash
cd frontend
npm install
```

### 2. Start Frontend
```bash
npm run dev
```

Frontend will start on: http://localhost:5173

### 3. Start Backend (in another terminal)
```bash
cd backend
python main.py
```

Backend will start on: http://127.0.0.1:8000

---

## ✅ What to Test

### Webcam Feed (Top of Right Panel)
- [ ] Webcam appears at TOP of right panel
- [ ] Large and clearly visible
- [ ] Corner guides (blue lines) visible in all 4 corners
- [ ] Center target box (dashed, blue) visible
- [ ] Hand icon in center of target
- [ ] Blue-purple gradient banner at top with instructions
- [ ] Three checkmark tips at bottom
- [ ] Live indicator (green dot pulsing)

**Test**: Place your hand in camera
- Hand should be clearly visible
- Landmarks drawn on hand when detected
- Target zone helps you center your hand

---

### Improved Drone Design
- [ ] Drone looks realistic and modern
- [ ] Sleek, rounded body (blue when flying, gray when landed)
- [ ] Four arms with color-coded motors:
  - Front Right: Red
  - Front Left: Green
  - Back Right: Orange
  - Back Left: Blue
- [ ] Propellers spinning (fast when flying)
- [ ] Blue glow ring under drone when flying
- [ ] Red LED on antenna (glowing when flying)
- [ ] Landing gear with feet (only when NOT flying)
- [ ] Camera gimbal at front

**Test**: Make takeoff gesture (open palm)
- Drone should lift off
- LEDs light up brightly
- Propellers spin fast
- Blue glow appears underneath
- Landing gear disappears

---

### Camera Follow System
- [ ] Purple camera button in header (Maximize2 icon)
- [ ] Button highlighted when camera follow is ON
- [ ] Status indicator bottom-left shows "Following Drone"
- [ ] Camera smoothly tracks drone movement

**Test**: 
1. Make drone move (forward, left, right gestures)
2. Camera should smoothly follow drone
3. Drone stays centered in view
4. Click purple button to toggle OFF
5. Status changes to "Free Camera"
6. Now you can manually pan/rotate view

---

### 3D Space Improvements
- [ ] Blue wireframe boundary box visible (20x20x20 units)
- [ ] Grid has smaller cells (1x1 instead of 2x2)
- [ ] Better lighting (shadows visible)
- [ ] Coordinate labels with directions:
  - +X East (red)
  - -X West (red)
  - +Z North (blue)
  - -Z South (blue)
  - +Y Up (green)
- [ ] Labels have black outlines for readability

**Test**: Rotate camera view
- Boundary box should be clearly visible
- Grid extends far into distance
- Coordinate labels help orient you
- Shadows add depth

---

### Gesture Detection Overlay
- [ ] Appears top-left when gesture detected
- [ ] Larger card (min 250px width)
- [ ] "Active Gesture" label
- [ ] Gesture name in blue-purple gradient
- [ ] Progress bar showing confidence
- [ ] Percentage displayed
- [ ] Pulse ring animation on left

**Test**: Make different gestures
- Open palm → "Takeoff" appears
- Fist → "Land" appears
- Peace sign → "Move Forward" appears
- Confidence bar should be 70%+

---

### Layout & Responsiveness
- [ ] Right panel is wider (420px)
- [ ] Webcam at TOP of right panel
- [ ] Tab navigation below webcam
- [ ] Content area scrollable
- [ ] Three tabs work: Telemetry, Controls, Gestures
- [ ] Toggle webcam button (video icon in header)
- [ ] Reset drone button (red)

**Test**: Click through tabs
- All tabs should load
- Content should be scrollable if needed
- Webcam stays at top (doesn't scroll away)

---

### Visual Effects
- [ ] Glass morphism on panels (blur effect)
- [ ] Smooth color transitions
- [ ] Gradient backgrounds
- [ ] Shadows on cards
- [ ] Pulsing animations (gesture indicator, live dot)
- [ ] Propeller blur when spinning

**Test**: Watch animations
- Everything should be smooth (30fps+)
- No stuttering
- Transitions feel polished

---

## 🎯 Key Gestures to Test

### Takeoff
- **Gesture**: Open palm, 5 fingers spread
- **Result**: 
  - Drone lifts to altitude 2
  - All LEDs glow bright
  - Propellers spin fast
  - Blue glow appears
  - Camera follows up

### Land
- **Gesture**: Closed fist
- **Result**:
  - Drone descends
  - LEDs dim
  - Propellers slow down
  - Glow disappears
  - Landing gear appears

### Move Forward
- **Gesture**: Peace sign (index + middle)
- **Result**:
  - Drone moves in +Z direction
  - Camera follows if enabled
  - Position updates in telemetry

### Move Left/Right
- **Gesture**: Hand tilted or pointing
- **Result**:
  - Drone moves in X direction
  - Stays in boundary box
  - Smooth movement

---

## 🐛 Common Issues & Solutions

### Issue: Webcam not visible
**Check**:
- Backend running?
- Camera permission granted?
- Green "Connected" indicator in header?
- Video toggle button enabled (blue)?

### Issue: Drone not moving
**Check**:
- Make clear, deliberate gestures
- Hold gesture for 1-2 seconds
- Check confidence is >70%
- Backend logs for gesture detection

### Issue: Can't see drone
**Check**:
- Enable camera follow (purple button)
- Reset drone (red button in header)
- Check telemetry for position
- Zoom out if needed

### Issue: Camera follow not working
**Check**:
- Purple button highlighted?
- Status says "Following Drone"?
- Try toggling off and on again

### Issue: Performance slow
**Check**:
- Close other browser tabs
- Check system resources
- Reduce window size if needed

---

## 📊 Expected Behavior

### On Page Load
1. Header appears with logo and status
2. 3D scene loads with grid and boundaries
3. Drone appears at origin (0,0,0)
4. Right panel loads with webcam at top
5. "Disconnected" status (red) initially
6. Connects within 1-2 seconds
7. Status changes to "Connected" (green)
8. Webcam feed starts showing

### During Flight
1. Gesture detected in webcam
2. Overlay appears top-left
3. Drone responds within 0.5s
4. Camera follows smoothly
5. Telemetry updates in real-time
6. Position shown in 3D space
7. All within boundary box

### Visual Quality
- Smooth 30+ FPS
- No lag or stuttering
- Clear, readable text
- Vibrant colors
- Professional appearance

---

## 🎨 Design Elements to Notice

### Color Coding
- **Blue**: Primary actions, boundaries
- **Purple**: Camera controls
- **Green**: Success, connected, front-left motor
- **Red**: Reset, emergency, front-right motor
- **Orange**: Back-right motor
- **Slate**: Backgrounds, inactive states

### Visual Hierarchy
1. **Top**: Webcam (most important for control)
2. **Middle**: Tabs and content
3. **Left**: 3D scene (main display)
4. **Overlays**: Gesture and status info

### Micro-interactions
- Button hover states
- Tab active indicators
- Pulsing animations
- Smooth transitions
- Progress bars

---

## ✨ Pro Tips

1. **Best Lighting**: Position light source behind camera, on your hand
2. **Camera Distance**: Arm's length works best
3. **Hand Position**: Center in target zone
4. **Gesture Duration**: Hold 1-2 seconds minimum
5. **Camera Follow**: Enable for automatic tracking
6. **Free Camera**: Disable for manual exploration

---

## 📸 Screenshot Checklist

If taking screenshots:
- [ ] Webcam with hand visible
- [ ] Gesture overlay showing
- [ ] Drone in flight with effects
- [ ] Boundary box visible
- [ ] All panels visible
- [ ] Connected status shown
- [ ] Telemetry data visible

---

## 🎉 Success Criteria

Frontend is working perfectly if:
✅ Webcam large and clear at top
✅ Hand positioning guides helpful
✅ Drone looks realistic and attractive
✅ Camera smoothly follows drone
✅ Never lose sight of drone
✅ Gestures detected accurately
✅ UI feels polished and professional
✅ Everything runs smoothly (30+ FPS)

---

Happy Testing! 🚁✨
