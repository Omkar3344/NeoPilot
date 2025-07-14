import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text } from '@react-three/drei';
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
  Gamepad2
} from 'lucide-react';

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
        <div className="flex-1 relative">
          <Canvas className="bg-slate-900">
            <PerspectiveCamera makeDefault position={[10, 8, 10]} />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
            
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            {/* Environment */}
            <Grid
              renderOrder={-1}
              position={[0, -0.01, 0]}
              infiniteGrid
              cellSize={2}
              cellThickness={0.6}
              sectionSize={10}
              sectionThickness={1.5}
              sectionColor={[0.5, 0.5, 10]}
              fadeDistance={30}
            />
            
            {/* Coordinate system labels */}
            <Text
              position={[15, 0.5, 0]}
              rotation={[0, 0, 0]}
              fontSize={1}
              color="red"
              anchorX="center"
              anchorY="middle"
            >
              +X
            </Text>
            <Text
              position={[0, 0.5, 15]}
              rotation={[0, 0, 0]}
              fontSize={1}
              color="blue"
              anchorX="center"
              anchorY="middle"
            >
              +Z
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
            <div className="absolute top-4 left-4 glass-panel p-4">
              <div className="flex items-center space-x-3">
                <div className="pulse-ring w-3 h-3"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <div className="text-sm text-slate-300">Current Gesture</div>
                  <div className="text-lg font-semibold text-blue-400 capitalize">
                    {currentGesture.name.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-slate-400">
                    Confidence: {(currentGesture.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Controls and Info */}
        <div className="w-96 bg-slate-800/50 backdrop-blur-md border-l border-slate-700/50 flex flex-col">
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
          <div className="flex-1 overflow-hidden">
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

          {/* Webcam Feed */}
          {showWebcam && (
            <div className="border-t border-slate-700/50">
              <WebcamFeed frame={webcamFrame} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
