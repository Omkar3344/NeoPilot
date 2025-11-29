import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Line } from '@react-three/drei';
import DroneModel from './components/DroneModel';
import WebcamFeed from './components/WebcamFeed';
import TelemetryPanel from './components/TelemetryPanel';
import GestureGuide from './components/GestureGuide';
import FlightControls from './components/FlightControls';
import { 
  Wifi, 
  WifiOff, 
  Video, 
  VideoOff, 
  Settings,
  Activity,
  Gamepad2,
  Maximize2
} from 'lucide-react';
import * as THREE from 'three';

// Camera Follow Component
function CameraRig({ dronePosition, follow }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(10, 8, 10));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  
  useFrame(() => {
    if (follow && dronePosition) {
      // Dynamic offset based on drone position
      const offset = new THREE.Vector3(8, 6, 8);
      
      // Adjust offset if drone is far from origin
      const distance = Math.sqrt(
        dronePosition[0] * dronePosition[0] + 
        dronePosition[2] * dronePosition[2]
      );
      
      if (distance > 10) {
        offset.multiplyScalar(1.2); // Pull back camera if drone is far
      }
      
      targetPosition.current.set(
        dronePosition[0] + offset.x,
        dronePosition[1] + offset.y,
        dronePosition[2] + offset.z
      );
      
      targetLookAt.current.set(
        dronePosition[0],
        dronePosition[1],
        dronePosition[2]
      );
      
      // Smooth camera follow with faster lerp for better tracking
      camera.position.lerp(targetPosition.current, 0.08);
      
      // Smooth look-at
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.multiplyScalar(10).add(camera.position);
      currentLookAt.lerp(targetLookAt.current, 0.08);
      camera.lookAt(currentLookAt);
    }
  });
  
  return null;
}

// 3D Boundary Box - Enhanced with better visibility
function BoundaryBox({ size = 20 }) {
  const points = [
    // Bottom square (on ground)
    [-size, 0, -size], [size, 0, -size],
    [size, 0, -size], [size, 0, size],
    [size, 0, size], [-size, 0, size],
    [-size, 0, size], [-size, 0, -size],
    // Top square (max altitude)
    [-size, size, -size], [size, size, -size],
    [size, size, -size], [size, size, size],
    [size, size, size], [-size, size, size],
    [-size, size, size], [-size, size, -size],
    // Vertical lines (corners)
    [-size, 0, -size], [-size, size, -size],
    [size, 0, -size], [size, size, -size],
    [size, 0, size], [size, size, size],
    [-size, 0, size], [-size, size, size],
  ];
  
  return (
    <>
      <Line
        points={points}
        color="#8b5cf6"
        opacity={0.4}
        transparent
        lineWidth={2}
      />
      {/* Corner markers */}
      {[
        [-size, 0, -size], [size, 0, -size], [size, 0, size], [-size, 0, size],
        [-size, size, -size], [size, size, -size], [size, size, size], [-size, size, size]
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial 
            color="#8b5cf6" 
            emissive="#8b5cf6" 
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </>
  );
}

function App() {
  const [wsConnection, setWsConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [droneData, setDroneData] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    is_flying: false,
    battery_level: 100,
    speed: 0,
    altitude: 0,
    total_distance: 0,
    flight_time: 0
  });
  const [currentGesture, setCurrentGesture] = useState(null);
  const [webcamFrame, setWebcamFrame] = useState(null);
  const [showWebcam, setShowWebcam] = useState(true);
  const [cameraFollow, setCameraFollow] = useState(true);
  const [activeTab, setActiveTab] = useState('telemetry');
  const [cameraSource, setCameraSource] = useState('laptop');
  const [phoneIpAddress, setPhoneIpAddress] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://127.0.0.1:8000/ws');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setWsConnection(ws);
          wsRef.current = ws;
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.drone_status) {
              setDroneData(data.drone_status);
            }
            
            if (data.gesture) {
              setCurrentGesture(data.gesture);
            }
            
            if (data.frame) {
              setWebcamFrame(`data:image/jpeg;base64,${data.frame}`);
            }
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setWsConnection(null);
          wsRef.current = null;
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const resetDrone = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/drone/reset', {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Drone reset:', data);
    } catch (error) {
      console.error('Error resetting drone:', error);
    }
  };

  const switchCamera = async (source, ipAddress = null) => {
    try {
      const url = new URL('http://127.0.0.1:8000/camera/switch');
      url.searchParams.append('source', source);
      if (source === 'phone' && ipAddress) {
        url.searchParams.append('ip_address', ipAddress);
      }
      
      const response = await fetch(url, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setCameraSource(source);
        console.log('Camera switched:', data);
        setShowCameraModal(false);
      } else {
        console.error('Failed to switch camera:', data);
        alert(data.detail || 'Failed to switch camera');
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      alert('Error switching camera. Make sure the backend is running.');
    }
  };

  const handlePhoneCameraSubmit = () => {
    if (!phoneIpAddress) {
      alert('Please enter phone IP address');
      return;
    }
    switchCamera('phone', phoneIpAddress);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              NeoPilot
            </h1>
          </div>
          
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCameraModal(true)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              cameraSource === 'phone'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
            }`}
            title="Switch Camera Source"
          >
            <Video className="h-4 w-4" />
            <span>{cameraSource === 'laptop' ? 'Laptop' : 'Phone'} Camera</span>
          </button>
          
          <button
            onClick={() => setCameraFollow(!cameraFollow)}
            className={`p-2 rounded-lg transition-colors ${
              cameraFollow 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
            title={cameraFollow ? 'Camera Following Drone' : 'Free Camera'}
          >
            <Maximize2 className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowWebcam(!showWebcam)}
            className={`p-2 rounded-lg transition-colors ${
              showWebcam 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            {showWebcam ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={resetDrone}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Reset Drone
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - 3D Simulation */}
        <div className="flex-1 relative bg-gradient-to-br from-slate-950 to-slate-900">
          <Canvas shadows className="bg-transparent">
            <PerspectiveCamera makeDefault position={[10, 8, 10]} fov={60} />
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={!cameraFollow}
              maxDistance={40}
              minDistance={3}
            />
            
            {/* Camera Follow System */}
            <CameraRig 
              dronePosition={[
                droneData.position.x || 0,
                (droneData.position.z || 0) + (droneData.is_flying ? 2 : 0.5),
                droneData.position.y || 0
              ]}
              follow={cameraFollow}
            />
            
            {/* Enhanced Lighting - Better atmosphere */}
            <ambientLight intensity={0.6} />
            <directionalLight 
              position={[20, 25, 15]} 
              intensity={1.5}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={60}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
            />
            <directionalLight position={[-15, 15, -15]} intensity={0.5} color="#8b5cf6" />
            <pointLight position={[0, 15, 0]} intensity={0.8} color="#60a5fa" />
            <hemisphereLight 
              skyColor="#60a5fa"
              groundColor="#1e293b"
              intensity={0.4}
            />
            
            {/* Ground Plane with Texture */}
            <mesh 
              receiveShadow 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, -0.02, 0]}
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial 
                color="#0f172a"
                roughness={0.8}
                metalness={0.2}
              />
            </mesh>
            
            {/* Enhanced Grid */}
            <Grid
              renderOrder={-1}
              position={[0, 0, 0]}
              infiniteGrid
              cellSize={1}
              cellThickness={1}
              sectionSize={5}
              sectionThickness={2}
              sectionColor={[0.5, 0.7, 1]}
              cellColor={[0.2, 0.3, 0.5]}
              fadeDistance={60}
              fadeStrength={1.5}
            />
            
            {/* Axis Indicators - 3D Arrows */}
            {/* X-axis (Red) - Left/Right */}
            <mesh position={[15, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.3, 1, 8]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[7.5, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 15, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Z-axis (Blue) - Forward/Back */}
            <mesh position={[0, 0.1, 15]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.3, 1, 8]} />
              <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 0.05, 7.5]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 15, 16]} />
              <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Y-axis (Green) - Altitude */}
            <mesh position={[0, 15, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.3, 1, 8]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 7.5, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 15, 16]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
            </mesh>
            
            {/* Flight Boundary Visualization - Enhanced */}
            <BoundaryBox size={15} />
            
            {/* Coordinate System Labels - Enhanced with better styling */}
            <Text
              position={[16, 1, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.5}
              color="#ef4444"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              RIGHT (+X)
            </Text>
            <Text
              position={[-16, 1, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.5}
              color="#ef4444"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              LEFT (-X)
            </Text>
            <Text
              position={[0, 1, 16]}
              rotation={[0, 0, 0]}
              fontSize={1.5}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              FORWARD (+Z)
            </Text>
            <Text
              position={[0, 1, -16]}
              rotation={[0, 0, 0]}
              fontSize={1.5}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              BACK (-Z)
            </Text>
            <Text
              position={[0, 16, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.5}
              color="#10b981"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              UP (+Y)
            </Text>
            <Text
              position={[-13, 0.3, -13]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={2}
              color="#60a5fa"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.15}
              outlineColor="#000000"
              opacity={0.7}
            >
              NEOPILOT
            </Text>
            
            {/* Drone Model */}
            <DroneModel 
              position={droneData.position}
              rotation={droneData.rotation}
              isFlying={droneData.is_flying}
            />
          </Canvas>

          {/* Current Gesture Overlay */}
          {currentGesture && currentGesture.name && (
            <div className="absolute top-4 left-4 glass-panel p-4 min-w-[250px]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="pulse-ring w-4 h-4"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Active Gesture</div>
                  <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 capitalize">
                    {currentGesture.name.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${(currentGesture.confidence * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-300 font-semibold">
                      {(currentGesture.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Camera Mode Indicator */}
          <div className="absolute bottom-4 left-4">
            <div className="glass-panel px-3 py-2">
              <div className="flex items-center space-x-2">
                <Maximize2 className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-slate-300">
                  {cameraFollow ? 'Following Drone' : 'Free Camera'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Controls and Info */}
        <div className="w-[420px] bg-slate-800/50 backdrop-blur-md border-l border-slate-700/50 flex flex-col">
          {/* Webcam Feed - Now at top */}
          {showWebcam && (
            <div className="border-b border-slate-700/50">
              <WebcamFeed frame={webcamFrame} />
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700/50">
            {[
              { id: 'telemetry', label: 'Telemetry', icon: Activity },
              { id: 'controls', label: 'Controls', icon: Settings },
              { id: 'gestures', label: 'Gestures', icon: Gamepad2 }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'telemetry' && (
              <TelemetryPanel droneData={droneData} />
            )}
            {activeTab === 'controls' && (
              <FlightControls droneData={droneData} />
            )}
            {activeTab === 'gestures' && (
              <GestureGuide />
            )}
          </div>
        </div>
      </div>

      {/* Camera Source Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl p-6 w-96 border border-slate-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Camera Source
            </h2>
            
            <div className="space-y-4">
              {/* Laptop Camera Option */}
              <button
                onClick={() => switchCamera('laptop')}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  cameraSource === 'laptop'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Video className="h-6 w-6 text-blue-400" />
                  <div className="text-left">
                    <div className="font-semibold">Laptop Camera</div>
                    <div className="text-sm text-slate-400">Built-in webcam</div>
                  </div>
                </div>
              </button>

              {/* Phone Camera Option */}
              <div className={`p-4 rounded-lg border-2 transition-all ${
                cameraSource === 'phone'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-600 bg-slate-700/50'
              }`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Video className="h-6 w-6 text-orange-400" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">Phone Camera</div>
                    <div className="text-sm text-slate-400">Via IP Webcam app</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={phoneIpAddress}
                    onChange={(e) => setPhoneIpAddress(e.target.value)}
                    placeholder="192.168.1.100:8080"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handlePhoneCameraSubmit}
                    className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
                  >
                    Connect Phone Camera
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-sm text-blue-300">
                  <strong>Setup Instructions:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                    <li>Install "IP Webcam" app on phone</li>
                    <li>Connect phone to same WiFi as laptop</li>
                    <li>Open app and tap "Start Server"</li>
                    <li>Note the IP address shown (e.g., 192.168.1.100:8080)</li>
                    <li>Enter the IP address above</li>
                  </ol>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowCameraModal(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
