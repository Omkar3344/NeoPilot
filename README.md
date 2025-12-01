# 🛸 NeoPilot

> **Real-time hand gesture recognition for immersive 3D drone control**

![Project Status](https://img.shields.io/badge/Status-Active-green)
![Python Version](https://img.shields.io/badge/Python-3.11.9-blue)
![React Version](https://img.shields.io/badge/React-18.2.0-blue)
![License](https://img.shields.io/badge/License-Educational-orange)

## 📋 Project Overview

This project showcases a **cutting-edge web-based 3D virtual drone simulation system** that is controlled through real-time hand gestures. The system integrates machine learning-based gesture recognition with a modern frontend, offering an immersive and intuitive drone piloting experience without the need for traditional controllers.

### 🎯 Key Highlights

- **Real-time Gesture Detection**: Uses webcam input for instant hand tracking
- **Machine Learning Integration**: Custom-trained ML model (.h5 format) for precise gesture classification  
- **3D Drone Simulation**: Realistic drone physics and movement in 3D space
- **Live Telemetry**: Real-time flight metrics including speed, distance, and battery status
- **Modern UI/UX**: Dark-themed responsive interface built with latest web technologies
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🛠️ Tech Stack

### Backend Architecture
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11.9 | Core backend language |
| **FastAPI** | 0.104.1 | High-performance web framework |
| **OpenCV** | 4.8.1.78 | Computer vision and camera input |
| **MediaPipe** | 0.10.8 | Hand landmark detection |
| **TensorFlow** | 2.15.0 | Machine learning model inference |
| **WebSocket** | 12.0 | Real-time bidirectional communication |
| **Uvicorn** | 0.24.0 | ASGI server for FastAPI |

### Frontend Architecture
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | Frontend UI framework |
| **Vite** | 5.0.8 | Next-generation build tool |
| **Tailwind CSS** | 3.3.6 | Utility-first CSS framework |
| **React Three Fiber** | 8.15.12 | 3D graphics and drone simulation |
| **Three.js** | 0.158.0 | 3D library for WebGL |
| **Lucide React** | 0.294.0 | Modern icon library |
| **Framer Motion** | 10.16.16 | Animation library |

### Development Tools
- **Node.js** 16+ and npm
- **Python Virtual Environment** (venv)
- **VS Code** (recommended IDE)
- **Git** for version control

## ✨ Features

### 🔍 Core Functionality
- **Real-time Hand Tracking**: Advanced computer vision for accurate hand detection
- **10 Gesture Commands**: Comprehensive control scheme for all drone operations
- **3D Visualization**: Interactive 3D environment with realistic drone physics
- **Live Camera Feed**: Real-time webcam display with hand positioning guides
- **Flight Telemetry**: Comprehensive metrics dashboard

### 🎮 Gesture Commands
| Gesture | Action | Description | Confidence Threshold |
|---------|--------|-------------|---------------------|
| 🖐️ Open Palm Up | **Takeoff** | Launch drone to hover altitude | 70% |
| ✊ Closed Fist | **Land** | Safely land the drone | 70% |
| 👆 Point Forward | **Move Forward** | Advance drone in forward direction | 70% |
| 👇 Point Backward | **Move Backward** | Move drone backwards | 70% |
| 👈 Point Left | **Move Left** | Strafe drone to the left | 70% |
| 👉 Point Right | **Move Right** | Strafe drone to the right | 70% |
| 🤟 L-Shape | **Rotate Left** | Counter-clockwise rotation | 70% |
| 🤟 Reverse L | **Rotate Right** | Clockwise rotation | 70% |
| ✌️ Peace Sign | **Hover** | Maintain current position | 70% |
| 🖖 Spread Fingers | **Emergency Stop** | Immediate stop and land | 70% |

### 📊 Telemetry Dashboard
- **Battery Level**: Real-time battery percentage with visual indicators
- **Flight Speed**: Current velocity in meters per second
- **Altitude**: Height above ground level
- **Distance Traveled**: Total flight distance tracking
- **Flight Time**: Active flight duration
- **Position Coordinates**: Real-time X, Y, Z positioning
- **Rotation Data**: Pitch, yaw, and roll measurements

## 🚀 Quick Start Guide

### Prerequisites Checklist
- ✅ **Python 3.11.9** installed
- ✅ **Node.js 16+** and npm installed  
- ✅ **Webcam/Camera** access enabled
- ✅ **Git** for cloning repository
- ✅ Your trained gesture model file (`best_gesture_model.h5`)

### 📁 Project Structure
```
NeoPilot/
├── 📁 backend/                     # Python FastAPI backend
│   ├── 📄 main.py                  # FastAPI server entry point
│   ├── 📄 gesture_detector.py      # ML gesture recognition engine
│   ├── 📄 drone_simulator.py       # Virtual drone physics simulation
│   ├── 📄 requirements.txt         # Python dependencies
│   └── 📄 start_backend.bat        # Windows startup script
├── 📁 frontend/                    # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/          # React components
│   │   │   ├── 📄 DroneModel.jsx       # 3D drone visualization
│   │   │   ├── 📄 WebcamFeed.jsx       # Camera feed display
│   │   │   ├── 📄 TelemetryPanel.jsx   # Flight data dashboard
│   │   │   ├── 📄 GestureGuide.jsx     # Interactive gesture guide
│   │   │   └── 📄 FlightControls.jsx   # Control settings panel
│   │   ├── 📄 App.jsx              # Main application component
│   │   ├── 📄 main.jsx             # React entry point
│   │   └── 📄 index.css            # Global styles
│   ├── 📄 package.json             # Node.js dependencies
│   ├── 📄 tailwind.config.js       # Tailwind CSS configuration
│   ├── 📄 vite.config.js           # Vite build configuration
│   └── 📄 start_frontend.bat       # Windows startup script
├── 📄 best_gesture_model.h5        # Your trained ML model
└── 📄 README.md                    # This documentation
```

## 🔧 Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone <your-repository-url>
cd NeoPilot
```

### 2️⃣ Backend Setup (Python)

**Option A: Automated Setup (Windows)**
```bash
cd backend
start_backend.bat
```

**Option B: Manual Setup (All Platforms)**
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv myenv

# Activate virtual environment
# Windows:
myenv\Scripts\activate
# macOS/Linux:
source myenv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
python main.py
```

**Backend Services:**
- 🌐 **API Server**: http://127.0.0.1:8001
- 🔌 **WebSocket**: ws://127.0.0.1:8001/ws
- 📚 **API Documentation**: http://127.0.0.1:8001/docs

### 3️⃣ Frontend Setup (React)

**Option A: Automated Setup (Windows)**
```bash
cd frontend
start_frontend.bat
```

**Option B: Manual Setup (All Platforms)**
```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start Vite development server
npm run dev
```

**Frontend Access:**
- 🎨 **Web Application**: http://localhost:5173
- 🔥 **Hot Reload**: Enabled for development

### 4️⃣ Model Configuration

1. **Place your trained model**: Ensure `best_gesture_model.h5` is in the root directory
2. **Verify model compatibility**: Check that your model expects 68 input features
3. **Adjust gesture labels**: Modify `gesture_detector.py` if your model uses different labels

## 📖 Usage Instructions

### Starting the Application

1. **Start Backend First**:
   ```bash
   cd backend
   python main.py
   ```
   Wait for "Uvicorn running on http://127.0.0.1:8001" message

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Wait for "Local: http://localhost:5173" message

3. **Open Application**: Navigate to `http://localhost:5173` in your web browser

### Using Gesture Controls

1. **Camera Setup**: Allow camera permissions when prompted
2. **Hand Positioning**: Position your hand in the center guide box
3. **Gesture Recognition**: Hold gestures steady for 1-2 seconds
4. **Flight Control**: Watch real-time drone response in 3D view
5. **Monitor Telemetry**: Check flight data in the right panel

### Interface Navigation

- **📊 Telemetry Tab**: View flight metrics and drone status
- **🎮 Controls Tab**: Monitor flight parameters and limits  
- **✋ Gestures Tab**: Reference guide for all hand gestures
- **📹 Camera Feed**: Toggle webcam display on/off

## 🔧 Configuration Options

### Backend Configuration (`gesture_detector.py`)
```python
# Gesture Recognition Settings
min_detection_confidence = 0.7    # Hand detection threshold
min_tracking_confidence = 0.5     # Hand tracking threshold
confidence_threshold = 0.7        # Gesture classification threshold

# Model Settings
model_path = "../best_gesture_model.h5"  # Path to your model
input_features = 68                      # Expected model input size
```

### Drone Physics (`drone_simulator.py`)
```python
# Movement Parameters
movement_increment = 0.5      # Movement step size (meters)
rotation_increment = 15.0     # Rotation step size (degrees)
max_speed = 5.0              # Maximum flight speed (m/s)
battery_duration = 600       # Battery life (seconds)
```

### Camera Settings (`main.py`)
```python
# Camera Configuration
camera_index = 0             # Camera device index
frame_width = 640           # Camera resolution width
frame_height = 480          # Camera resolution height
frame_rate = 30             # Target FPS
```

## 🌐 API Reference

### REST Endpoints

#### `GET /` - Health Check
```json
{
  "message": "NeoPilot API",
  "status": "active",
  "endpoints": { ... }
}
```

#### `GET /drone/status` - Get Drone Status
```json
{
  "position": {"x": 0.0, "y": 0.0, "z": 0.0},
  "rotation": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
  "is_flying": false,
  "battery_level": 100.0,
  "speed": 0.0,
  "altitude": 0.0
}
```

#### `POST /drone/reset` - Reset Drone
```json
{
  "message": "Drone reset to initial state",
  "position": {"x": 0.0, "y": 0.0, "z": 0.0}
}
```

### WebSocket Protocol (`/ws`)

**Incoming Data:**
```json
{
  "frame": "base64_encoded_image",
  "gesture": {
    "name": "takeoff",
    "confidence": 0.85
  },
  "drone_status": { ... },
  "timestamp": 1705234567.89
}
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 🎥 Camera Problems
```bash
# Issue: Camera not detected
# Solution: Check camera permissions and availability
python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"

# Issue: Multiple camera devices
# Solution: Try different camera indices (0, 1, 2...)
```

#### 🤖 Model Loading Issues
```bash
# Issue: TensorFlow compatibility errors
# Solution: Use mock model for testing
# Check: gesture_detector.py line 25-60 for fallback logic

# Issue: Input shape mismatch
# Solution: Verify model expects 68 features, adjust preprocessing
```

#### 🌐 Connection Problems
```bash
# Issue: Backend not accessible
# Solution: Check if port 8001 is available
netstat -an | findstr 8001

# Issue: Frontend build errors
# Solution: Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 👋 Gesture Recognition Issues
```bash
# Issue: Only one gesture detected
# Solution: Check lighting, hand positioning, and confidence threshold

# Issue: Poor recognition accuracy
# Solution: Ensure good lighting, stable hand position, clean background
```

### Performance Optimization

#### System Requirements
- **CPU**: Intel i5 or AMD Ryzen 5 (minimum)
- **RAM**: 8GB (minimum), 16GB (recommended)
- **GPU**: Integrated graphics sufficient, dedicated GPU preferred
- **Camera**: 720p minimum, 1080p recommended

#### Performance Tips
```bash
# Reduce camera resolution for better performance
camera.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

# Lower frame rate if needed
await asyncio.sleep(0.066)  # ~15 FPS instead of 30 FPS
```

## 🚀 Advanced Usage

### Custom Gesture Training

1. **Data Collection**: Collect hand landmark data for new gestures
2. **Model Training**: Train with TensorFlow/Keras
3. **Integration**: Update `gesture_labels` dictionary
4. **Testing**: Verify accuracy with test dataset

### Extending Functionality

#### Adding New Drone Commands
```python
# In drone_simulator.py
elif gesture == "move_up" and self.is_flying:
    self.position["z"] += self.movement_increment
    message = "Drone moving up"
```

#### Custom UI Components
```jsx
// In React components
const NewPanel = () => {
  return (
    <div className="glass-panel p-4">
      {/* Your custom content */}
    </div>
  );
};
```

## 📊 Performance Metrics

### Benchmarks
- **Gesture Recognition Latency**: <100ms average
- **Camera Frame Rate**: 30 FPS (configurable)
- **WebSocket Latency**: <50ms local network
- **3D Rendering**: 60 FPS on modern hardware
- **Memory Usage**: ~500MB backend, ~200MB frontend

### System Resources
```bash
# Monitor system performance
# CPU Usage: ~15-25% on modern processors
# RAM Usage: ~700MB total
# Network: Minimal (local WebSocket communication)
```

## 🛡️ Security Considerations

- **Local Network Only**: Backend binds to 127.0.0.1 (localhost)
- **No External Dependencies**: All processing done locally
- **Camera Privacy**: Feed only processed locally, never transmitted
- **No Data Storage**: No persistent storage of camera data or gestures

## 📈 Future Enhancements

### Planned Features
- [ ] **Multi-hand Gesture Support**
- [ ] **Voice Command Integration**
- [ ] **VR/AR Compatibility**
- [ ] **Mobile App Development**
- [ ] **Multiplayer Drone Racing**
- [ ] **AI-powered Autonomous Flight**
- [ ] **Real Drone Hardware Integration**

### Contributing
This project is designed for educational purposes. Feel free to:
- Fork the repository
- Submit pull requests
- Report issues
- Suggest improvements

## 📄 License

This project is released under the **Educational License**. It is intended for:
- Learning and educational purposes
- Research and development
- Non-commercial demonstrations
- Academic projects

## 🤝 Support & Community

### Getting Help
- **Documentation**: This README file
- **Issues**: GitHub Issues page
- **Discussions**: Community discussion board

### Acknowledgments
- **MediaPipe**: Google's hand tracking solution
- **React Three Fiber**: 3D graphics in React
- **FastAPI**: Modern Python web framework
- **TensorFlow**: Machine learning platform

---

<div align="center">

**🛸 Built with ❤️ for the future of human-computer interaction**

*Last Updated: July 14, 2025*

</div>
