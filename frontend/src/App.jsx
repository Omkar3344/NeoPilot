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
  
  useFrame(() => {
    if (follow && dronePosition) {
      // Smooth camera follow
      const offset = new THREE.Vector3(8, 6, 8);
      targetPosition.current.set(
        dronePosition[0] + offset.x,
        dronePosition[1] + offset.y,
        dronePosition[2] + offset.z
      );
      
      camera.position.lerp(targetPosition.current, 0.05);
      camera.lookAt(dronePosition[0], dronePosition[1], dronePosition[2]);
    }
  });
  
  return null;
}

// 3D Boundary Box
function BoundaryBox({ size = 20 }) {
  const points = [
    // Bottom square
    [-size, 0, -size], [size, 0, -size],
    [size, 0, -size], [size, 0, size],
    [size, 0, size], [-size, 0, size],
    [-size, 0, size], [-size, 0, -size],
    // Top square
    [-size, size, -size], [size, size, -size],
    [size, size, -size], [size, size, size],
    [size, size, size], [-size, size, size],
    [-size, size, size], [-size, size, -size],
    // Vertical lines
    [-size, 0, -size], [-size, size, -size],
    [size, 0, -size], [size, size, -size],
    [size, 0, size], [size, size, size],
    [-size, 0, size], [-size, size, size],
  ];
  
  return (
    <Line
      points={points}
      color="#3b82f6"
      opacity={0.2}
      transparent
      lineWidth={1}
    />
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
            
            {/* Enhanced Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[15, 15, 10]} 
              intensity={1.2}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={50}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
            />
            <directionalLight position={[-10, 10, -10]} intensity={0.4} />
            <pointLight position={[0, 10, 0]} intensity={0.6} color="#3b82f6" />
            
            {/* Environment */}
            <Grid
              renderOrder={-1}
              position={[0, -0.01, 0]}
              infiniteGrid
              cellSize={1}
              cellThickness={0.8}
              sectionSize={5}
              sectionThickness={1.5}
              sectionColor={[0.4, 0.6, 1]}
              cellColor={[0.3, 0.3, 0.5]}
              fadeDistance={50}
              fadeStrength={1}
            />
            
            {/* Flight Boundary Visualization */}
            <BoundaryBox size={15} />
            
            {/* Coordinate system labels - Enhanced */}
            <Text
              position={[18, 0.5, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.2}
              color="#ef4444"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              +X East
            </Text>
            <Text
              position={[-18, 0.5, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.2}
              color="#ef4444"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              -X West
            </Text>
            <Text
              position={[0, 0.5, 18]}
              rotation={[0, 0, 0]}
              fontSize={1.2}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              +Z North
            </Text>
            <Text
              position={[0, 0.5, -18]}
              rotation={[0, 0, 0]}
              fontSize={1.2}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              -Z South
            </Text>
            <Text
              position={[0, 18, 0]}
              rotation={[0, 0, 0]}
              fontSize={1.2}
              color="#10b981"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              +Y Up
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
    </div>
  );
}

export default App;
