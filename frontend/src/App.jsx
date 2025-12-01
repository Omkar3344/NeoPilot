import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Line, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
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

// Camera Follow Component - Enhanced with multiple camera modes
function CameraRig({ dronePosition, follow, cameraMode, droneRotation }) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(10, 12, 10));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const smoothedLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const prevCameraMode = useRef(cameraMode);
  const transitionProgress = useRef(1.0);
  
  useFrame((state, delta) => {
    if (follow && dronePosition) {
      // Detect camera mode change for smooth transition
      if (prevCameraMode.current !== cameraMode) {
        transitionProgress.current = 0;
        prevCameraMode.current = cameraMode;
      }
      transitionProgress.current = Math.min(1.0, transitionProgress.current + delta * 2);
      
      const yawRad = (droneRotation?.yaw || 0) * Math.PI / 180;
      const pitchRad = (droneRotation?.pitch || 0) * Math.PI / 180;
      
      let baseOffset;
      let lookAtOffset = new THREE.Vector3(0, 0, 0);
      let lerpSpeed;
      
      // Calculate camera position based on mode
      switch (cameraMode) {
        case 'first-person':
          // FPV: Camera at front of drone where camera gimbal is, looking forward
          // Position camera at the front camera location (matching DroneModel gimbal position)
          const fpvForwardOffset = 1.2; // In front of drone (where camera gimbal is at z=0.7 + lens offset)
          const fpvHeight = 0.0; // Slightly below drone center (gimbal is at y=-0.15)
          
          // Calculate forward direction based on drone's yaw
          baseOffset = new THREE.Vector3(
            Math.sin(yawRad) * fpvForwardOffset,
            fpvHeight,
            Math.cos(yawRad) * fpvForwardOffset
          );
          
          // Look far ahead in the direction the drone is facing
          const lookDistance = 50;
          lookAtOffset = new THREE.Vector3(
            Math.sin(yawRad) * lookDistance,
            -Math.sin(pitchRad) * lookDistance * 0.5, // Slight pitch influence
            Math.cos(yawRad) * lookDistance
          );
          lerpSpeed = 0.5; // Very responsive for FPV
          break;
          
        case 'chase':
          // Chase camera: Behind and above the drone, following its direction
          const chaseDistance = 10;
          const chaseHeight = 4;
          const chaseLookAhead = 5;
          
          // Position camera behind the drone based on yaw
          baseOffset = new THREE.Vector3(
            -Math.sin(yawRad) * chaseDistance,
            chaseHeight,
            -Math.cos(yawRad) * chaseDistance
          );
          
          // Look slightly ahead of the drone
          lookAtOffset = new THREE.Vector3(
            Math.sin(yawRad) * chaseLookAhead,
            0,
            Math.cos(yawRad) * chaseLookAhead
          );
          lerpSpeed = 0.08; // Smooth chase following
          break;
          
        case 'cinematic':
          // Smooth orbiting camera with dynamic angles
          const orbitRadius = 18;
          const orbitAngle = state.clock.elapsedTime * 0.2; // Slower orbit
          const orbitHeight = 10 + Math.sin(state.clock.elapsedTime * 0.3) * 3;
          baseOffset = new THREE.Vector3(
            Math.cos(orbitAngle) * orbitRadius,
            orbitHeight,
            Math.sin(orbitAngle) * orbitRadius
          );
          lookAtOffset = new THREE.Vector3(0, 1, 0); // Look slightly above drone center
          lerpSpeed = 0.03; // Very slow for smooth cinematic
          break;
          
        case 'top-down':
          // Directly above drone with slight offset for better view
          baseOffset = new THREE.Vector3(0, 25, 0.1);
          lookAtOffset = new THREE.Vector3(0, 0, 0);
          lerpSpeed = 0.1;
          break;
          
        case 'default':
        default:
          // Default: Dynamic diagonal view that follows drone movement
          // Offset adjusts based on drone's horizontal distance from origin
          const droneDistFromOrigin = Math.sqrt(
            dronePosition[0] * dronePosition[0] + 
            dronePosition[2] * dronePosition[2]
          );
          
          // Scale offset based on distance for better framing
          const scaleFactor = Math.max(1, 1 + droneDistFromOrigin * 0.02);
          const baseOffsetDist = 12 * scaleFactor;
          const baseOffsetHeight = 10 * scaleFactor;
          
          baseOffset = new THREE.Vector3(
            baseOffsetDist * 0.7, // Slight angle
            baseOffsetHeight,
            baseOffsetDist * 0.7
          );
          lookAtOffset = new THREE.Vector3(0, 0.5, 0);
          lerpSpeed = 0.06;
          break;
      }
      
      // Calculate target camera position
      targetPosition.current.set(
        dronePosition[0] + baseOffset.x,
        dronePosition[1] + baseOffset.y,
        dronePosition[2] + baseOffset.z
      );
      
      // Calculate look-at target
      targetLookAt.current.set(
        dronePosition[0] + lookAtOffset.x,
        dronePosition[1] + lookAtOffset.y,
        dronePosition[2] + lookAtOffset.z
      );
      
      // Ground constraints (except FPV which can be at drone level)
      if (cameraMode !== 'first-person') {
        if (targetPosition.current.y < 2.0) {
          targetPosition.current.y = 2.0;
        }
      } else {
        // For FPV, allow camera to be at drone altitude but not below ground
        if (targetPosition.current.y < 0.5) {
          targetPosition.current.y = 0.5;
        }
      }
      
      // Apply position interpolation with frame-rate independent smoothing
      const smoothFactor = 1 - Math.pow(1 - lerpSpeed, delta * 60);
      camera.position.lerp(targetPosition.current, smoothFactor);
      
      // Keep camera above ground
      if (cameraMode !== 'first-person' && camera.position.y < 1.5) {
        camera.position.y = 1.5;
      }
      
      // Smooth look-at interpolation
      const lookAtSmooth = cameraMode === 'first-person' ? 0.4 : lerpSpeed * 1.5;
      const lookAtFactor = 1 - Math.pow(1 - lookAtSmooth, delta * 60);
      smoothedLookAt.current.lerp(targetLookAt.current, lookAtFactor);
      camera.lookAt(smoothedLookAt.current);
    }
  });
  
  return null;
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
  const [cameraMode, setCameraMode] = useState('default');
  const [activeTab, setActiveTab] = useState('telemetry');
  const [cameraSource, setCameraSource] = useState('laptop');
  const [phoneIpAddress, setPhoneIpAddress] = useState('');
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [realisticBackground, setRealisticBackground] = useState(false);
  
  const wsRef = useRef(null);
  const pressedKeysRef = useRef(new Set());

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://127.0.0.1:8001/ws');
        
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

  // Send keyboard command to backend
  const sendKeyboardCommand = async (command) => {
    try {
      const response = await fetch('http://127.0.0.1:8001/drone/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update drone data if status is returned
        if (data.position) {
          setDroneData(data);
        }
      } else {
        const error = await response.json();
        console.error('Failed to execute command:', error);
      }
    } catch (error) {
      console.error('Error sending keyboard command:', error);
    }
  };

  // Stop movement in a specific direction
  const stopMovement = async (direction) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/drone/stop/${direction}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.position) {
          setDroneData(data);
        }
      }
    } catch (error) {
      console.error('Error stopping movement:', error);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const keyMap = {
      'w': 'go_forward',
      'W': 'go_forward',
      'ArrowUp': 'go_forward',
      's': 'back',
      'S': 'back',
      'ArrowDown': 'back',
      'a': 'left',
      'A': 'left',
      'ArrowLeft': 'left',
      'd': 'right',
      'D': 'right',
      'ArrowRight': 'right',
      ' ': 'stop', // Space key
      'Space': 'stop', // Space code
      'z': 'up',
      'Z': 'up',
      'x': 'down',
      'X': 'down',
      'l': 'land',
      'L': 'land',
    };

    const handleKeyDown = (event) => {
      const key = event.key;
      const code = event.code;
      
      // Skip if key is already pressed (prevent repeat)
      if (pressedKeysRef.current.has(key) || pressedKeysRef.current.has(code)) {
        return;
      }

      // Map key to command (check code first for special keys like Space, Shift)
      let command = null;
      if (keyMap[code]) {
        command = keyMap[code];
      } else if (keyMap[key]) {
        command = keyMap[key];
      }

      if (command) {
        // Prevent default browser behavior for these keys
        event.preventDefault();
        
        // Add key to pressed set
        pressedKeysRef.current.add(key);
        pressedKeysRef.current.add(code);

        // Send command (starts continuous movement for movement commands)
        sendKeyboardCommand(command);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key;
      const code = event.code;
      
      // Map key to command
      let command = null;
      if (keyMap[code]) {
        command = keyMap[code];
      } else if (keyMap[key]) {
        command = keyMap[key];
      }

      // Stop movement for movement commands (not for stop/land)
      if (command && ['go_forward', 'back', 'left', 'right', 'up', 'down'].includes(command)) {
        stopMovement(command);
      }
      
      // Remove key from pressed set
      pressedKeysRef.current.delete(key);
      pressedKeysRef.current.delete(code);
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetDrone = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8001/drone/reset', {
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
      const url = new URL('http://127.0.0.1:8001/camera/switch');
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
          
          {/* Camera Control Section */}
          <div className="flex items-center space-x-2">
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
            
            {/* Camera Mode Selector - Only show when following */}
            {cameraFollow && (
              <div className="flex items-center space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <span className="text-xs text-slate-400 px-2">View:</span>
                {[
                  { id: 'default', label: 'Default', title: 'Default Diagonal View' },
                  { id: 'first-person', label: 'FPV', title: 'First-Person View' },
                  { id: 'chase', label: 'Chase', title: 'Chase Camera' },
                  { id: 'cinematic', label: 'Cinema', title: 'Cinematic Orbit' },
                  { id: 'top-down', label: 'Top', title: 'Top-Down View' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setCameraMode(mode.id)}
                    className={`px-2 py-1 text-xs rounded transition ${
                      cameraMode === mode.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                    title={mode.title}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
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
            onClick={() => setRealisticBackground(!realisticBackground)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              realisticBackground 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
            title={realisticBackground ? 'Realistic Environment' : 'Grid Environment'}
          >
            {realisticBackground ? '🌍 Realistic' : '📐 Grid'}
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
            <PerspectiveCamera makeDefault position={[10, 12, 10]} fov={60} far={20000} />
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={!cameraFollow}
              maxDistance={5000}
              minDistance={3}
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2.1}
            />
            
            {/* Camera Follow System with Multiple Modes */}
            <CameraRig 
              dronePosition={[
                droneData.position.x || 0,
                droneData.position.y || 0,
                droneData.position.z || 0
              ]}
              follow={cameraFollow}
              cameraMode={cameraMode}
              droneRotation={droneData.rotation}
            />
            
            {/* Enhanced Lighting - Better atmosphere */}
            <ambientLight intensity={realisticBackground ? 0.8 : 0.6} />
            <directionalLight 
              position={[20, 25, 15]} 
              intensity={realisticBackground ? 2.0 : 1.5}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={60}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
            />
            <directionalLight position={[-15, 15, -15]} intensity={0.5} color={realisticBackground ? "#fbbf24" : "#8b5cf6"} />
            <pointLight position={[0, 15, 0]} intensity={realisticBackground ? 0.5 : 0.8} color={realisticBackground ? "#fef3c7" : "#60a5fa"} />
            <hemisphereLight 
              skyColor={realisticBackground ? "#87CEEB" : "#60a5fa"}
              groundColor={realisticBackground ? "#8B7355" : "#1e293b"}
              intensity={realisticBackground ? 0.6 : 0.4}
            />
            
            {/* Realistic Sky with EXR Environment Map (only in realistic mode) */}
            {realisticBackground && (
              <Environment 
                files="/bloem_field_sunrise_2k.exr" 
                background
              />
            )}
            
            {/* Infinite ground plane for realistic mode */}
            {realisticBackground && (
              <mesh 
                receiveShadow 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.01, 0]}
              >
                <planeGeometry args={[10000, 10000]} />
                <meshStandardMaterial 
                  color="#4A7C2F"
                  roughness={0.95}
                  metalness={0.0}
                />
              </mesh>
            )}
            
            {/* Ground Plane - Only for grid mode */}
            {!realisticBackground && (
              <mesh 
                receiveShadow 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, -0.01, 0]}
              >
                <planeGeometry args={[10000, 10000]} />
                <meshStandardMaterial 
                  color="#0f172a"
                  roughness={0.8}
                  metalness={0.2}
                />
              </mesh>
            )}
            
            {/* Enhanced Grid (only in grid mode) - Infinite grid that follows camera */}
            {!realisticBackground && (
              <Grid
                renderOrder={-1}
                position={[0, 0.01, 0]}
                infiniteGrid={true}
                cellSize={2}
                cellThickness={0.5}
                sectionSize={10}
                sectionThickness={1.5}
                sectionColor={[0.5, 0.7, 1]}
                cellColor={[0.2, 0.3, 0.5]}
                fadeDistance={200}
                fadeStrength={1}
                followCamera={true}
              />
            )}
            
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
            
            {/* Drone Model - Hide in FPV mode to prevent seeing the drone body */}
            {cameraMode !== 'first-person' && (
              <DroneModel 
                position={droneData.position}
                rotation={droneData.rotation}
                isFlying={droneData.is_flying}
              />
            )}
            
            {/* FPV Mode - Show camera frame/cockpit overlay effect */}
            {cameraMode === 'first-person' && cameraFollow && (
              <group
                position={[
                  droneData.position.x || 0,
                  droneData.position.y || 0,
                  droneData.position.z || 0
                ]}
                rotation={[
                  (droneData.rotation.pitch || 0) * Math.PI / 180,
                  (droneData.rotation.yaw || 0) * Math.PI / 180,
                  (droneData.rotation.roll || 0) * Math.PI / 180
                ]}
              >
                {/* Minimal cockpit frame for FPV immersion - just corner indicators */}
                {/* These are positioned behind the camera so they won't be visible */}
              </group>
            )}
          </Canvas>

          {/* Current Gesture Overlay */}
          {currentGesture && currentGesture.name && (
            <div className="absolute top-4 left-[240px] glass-panel p-4 min-w-[250px]">
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
                  {cameraFollow ? (cameraMode === 'first-person' ? 'FPV Mode' : 'Following Drone') : 'Free Camera'}
                </span>
              </div>
            </div>
          </div>
          
          {/* FPV HUD Overlay - Only visible in first-person mode */}
          {cameraMode === 'first-person' && cameraFollow && (
            <>
              {/* Corner brackets for FPV frame effect */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top-left corner */}
                <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-400/60"></div>
                {/* Top-right corner */}
                <div className="absolute top-8 right-[440px] w-16 h-16 border-r-2 border-t-2 border-cyan-400/60"></div>
                {/* Bottom-left corner */}
                <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-cyan-400/60"></div>
                {/* Bottom-right corner */}
                <div className="absolute bottom-8 right-[440px] w-16 h-16 border-r-2 border-b-2 border-cyan-400/60"></div>
                
                {/* Center crosshair */}
                <div className="absolute top-1/2 left-[calc(50%-210px)] transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute w-8 h-0.5 bg-cyan-400/40 -left-4 top-0"></div>
                    <div className="absolute h-8 w-0.5 bg-cyan-400/40 left-0 -top-4"></div>
                    <div className="w-2 h-2 border border-cyan-400/60 rounded-full"></div>
                  </div>
                </div>
                
                {/* FPV telemetry overlay */}
                <div className="absolute top-8 left-1/2 transform -translate-x-[calc(50%+210px)] text-center">
                  <div className="text-cyan-400/80 text-xs font-mono">
                    <div>ALT: {(droneData.altitude || 0).toFixed(1)}m</div>
                    <div>SPD: {(droneData.speed || 0).toFixed(1)}m/s</div>
                  </div>
                </div>
                
                {/* Heading indicator */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-[calc(50%+210px)]">
                  <div className="text-cyan-400/80 text-xs font-mono text-center">
                    <div>HDG: {((droneData.rotation?.yaw || 0) % 360).toFixed(0)}°</div>
                  </div>
                </div>
                
                {/* REC indicator */}
                <div className="absolute top-8 left-24 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400/80 text-xs font-mono">REC</span>
                </div>
              </div>
            </>
          )}
          
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
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              {activeTab === 'telemetry' && (
                <motion.div
                  key="telemetry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TelemetryPanel droneData={droneData} />
                </motion.div>
              )}
              {activeTab === 'controls' && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <FlightControls droneData={droneData} />
                </motion.div>
              )}
              {activeTab === 'gestures' && (
                <motion.div
                  key="gestures"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <GestureGuide />
                </motion.div>
              )}
            </AnimatePresence>
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
