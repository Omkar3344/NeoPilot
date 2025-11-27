# NeoPilot - Quick Start Guide for Improved Backend

## 🚀 What's New?

The backend has been **completely rebuilt** with an advanced gesture detection pipeline that eliminates random behavior and provides accurate, stable gesture recognition.

### Key Improvements:
✅ **No more random movements** - Temporal smoothing prevents jitter  
✅ **Higher accuracy** - 50+ geometric features for classification  
✅ **Stable detection** - Requires consistent gestures (not just 1 frame)  
✅ **Better performance** - Optimized pipeline running at 30 FPS  
✅ **No ML model needed** - Rule-based classifier is more reliable  

---

## 📋 Prerequisites

⚠️ **IMPORTANT**: You need Python 3.10 or 3.11 (MediaPipe doesn't support 3.13)

### Check Your Python Version
```powershell
python --version
```

If you have Python 3.13, you need to install Python 3.11.

---

## 🔧 Installation Steps

### Step 1: Install Python 3.11
1. Download Python 3.11 from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Verify installation:
   ```powershell
   py -3.11 --version
   ```

### Step 2: Create Virtual Environment
```powershell
# Navigate to backend folder
cd C:\Users\HP\Desktop\NeoPilot\backend

# Create virtual environment with Python 3.11
py -3.11 -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Your prompt should now show (venv)
```

### Step 3: Install Dependencies
```powershell
# Upgrade pip first
pip install --upgrade pip

# Install all requirements
pip install -r requirements.txt

# This will install:
# - fastapi, uvicorn (web server)
# - opencv-python (computer vision)
# - mediapipe (hand detection)
# - tensorflow (if needed for other features)
# - pyyaml (configuration)
# - and more...
```

⏱️ This may take 5-10 minutes depending on your internet speed.

---

## 🧪 Testing the Improved System

### Test Gesture Detection (Without Full Backend)
```powershell
# Make sure virtual environment is activated
python test_improved_detection.py
```

**What you'll see:**
- Camera feed with hand landmarks
- Real-time gesture detection
- Confidence scores and FPS
- Visual feedback

**Controls:**
- `q` - Quit
- `s` - Show statistics
- `1` - Low sensitivity (very stable)
- `2` - Medium sensitivity (default)
- `3` - High sensitivity (responsive)
- `r` - Reset pipeline

---

## 🚁 Running the Full Backend

### Start the Server
```powershell
# Make sure virtual environment is activated
python main.py
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Improved gesture pipeline initialized successfully
INFO:     Camera initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Test API Endpoints
```powershell
# Health check
curl http://127.0.0.1:8000/

# Get available gestures
curl http://127.0.0.1:8000/gestures

# Get statistics
curl http://127.0.0.1:8000/stats

# Set sensitivity
curl -X POST http://127.0.0.1:8000/sensitivity/medium
```

---

## 🎯 Gesture Guide

| Gesture | Hand Position | Drone Action |
|---------|---------------|--------------|
| 🖐️ **Takeoff** | Open palm (5 fingers) | Take off |
| ✊ **Land** | Closed fist | Land |
| ✌️ **Forward** | Peace sign pointing forward | Move forward |
| 🖖 **Backward** | 4 fingers (no thumb) | Move backward |
| 👈 **Left** | Hand tilted/pointing left | Move left |
| 👉 **Right** | Hand tilted/pointing right | Move right |
| 🤟 **Rotate Left** | L-shape pointing left | Rotate CCW |
| 🤙 **Rotate Right** | L-shape pointing right | Rotate CW |
| 🤘 **Hover** | 3 fingers (index+middle+ring) | Hover |
| 🤙 **Emergency** | Only pinky extended | Emergency stop |

---

## ⚙️ Configuration

Edit `config.yaml` to customize:

```yaml
# Hand detection confidence (0.0 - 1.0)
hand_detection:
  min_detection_confidence: 0.8  # Higher = stricter

# Gesture confidence threshold
gesture_classification:
  min_confidence: 0.7

# Stability settings
temporal_smoothing:
  consistency_frames: 5     # Frames needed to confirm
  cooldown_time: 0.5       # Seconds between changes
```

**Recommendations:**
- **More stability**: Increase `consistency_frames` and `cooldown_time`
- **More responsive**: Decrease these values (but less stable)
- **Better detection**: Increase `min_detection_confidence`

---

## 🐛 Troubleshooting

### Issue: "Could not find a version that satisfies the requirement mediapipe"
**Solution**: You're using Python 3.13. Install Python 3.11 and recreate the virtual environment.

### Issue: Camera not opening
**Solution**: 
```powershell
# Check if camera is available
python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"
```
If False, check if another app is using the camera.

### Issue: Import errors
**Solution**: Make sure virtual environment is activated:
```powershell
.\venv\Scripts\activate
```

### Issue: Still getting random gestures
**Solution**: The new system prevents this, but you can:
1. Use lower sensitivity: `POST /sensitivity/low`
2. Increase `consistency_frames` in config.yaml
3. Make more deliberate, distinct gestures

### Issue: Gestures not detected
**Solution**:
1. Ensure good lighting
2. Keep hand clearly visible to camera
3. Make distinct gestures (don't rush)
4. Check camera angle and distance
5. Use higher sensitivity if needed

---

## 📊 Monitoring Performance

### Check Real-Time Stats
```bash
curl http://127.0.0.1:8000/stats
```

**Key metrics:**
- `fps`: Frames per second (should be ~30)
- `success_rate`: Hand detection rate (should be >80%)
- `gesture_changes`: How many times gesture changed
- `rejected_gestures`: Gestures filtered out (instability)

---

## 🎓 Understanding the New System

### Why It's Better:

1. **Multi-Stage Pipeline**
   - Hand Detection → Feature Extraction → Classification → Smoothing
   - Each stage optimized for accuracy

2. **Temporal Smoothing**
   - Tracks last 5 frames
   - Requires 60%+ consistency
   - 0.5s cooldown between changes
   - Result: No random commands!

3. **Advanced Features**
   - Finger extension detection
   - Palm orientation (pitch, yaw)
   - Hand direction vectors
   - Finger spread measurements
   - 50+ geometric features total

4. **Rule-Based Classification**
   - More reliable than ML for well-defined gestures
   - No model training needed
   - Easy to add new gestures
   - Deterministic behavior

---

## 🔄 Next Steps

1. **Test the system**: Run `test_improved_detection.py`
2. **Adjust config**: Tune `config.yaml` to your preference
3. **Start backend**: Run `python main.py`
4. **Start frontend**: In another terminal, start your frontend
5. **Fly the drone**: Use gestures to control!

---

## 📝 Notes

- The old `gesture_detector.py` is still there but not used
- The new system is in `gesture_system/` folder
- All code is modular and easy to customize
- Frontend code remains unchanged (same WebSocket API)

---

## 💡 Tips for Best Results

1. **Good Lighting**: Ensure your hand is well-lit
2. **Clear Background**: Plain background works best
3. **Steady Hand**: Hold gestures for 1-2 seconds
4. **Distinct Gestures**: Make clear, deliberate gestures
5. **Camera Position**: Keep camera at chest height, arm's length away
6. **One Hand**: System tracks one hand only

---

## ❓ Need Help?

Check `README_IMPROVED.md` for detailed documentation.

Happy flying! 🚁✨
