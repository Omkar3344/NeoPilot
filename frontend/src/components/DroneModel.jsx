import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const DroneModel = ({ position, rotation, isFlying }) => {
  const droneRef = useRef();
  const propellerRefs = useRef([]);
  
  // Convert position coordinates for 3D space
  const dronePosition = [
    position.x || 0,
    (position.z || 0) + (isFlying ? 2 : 0.5), // Y is up in Three.js
    position.y || 0
  ];
  
  // Convert rotation
  const droneRotation = [
    (rotation.pitch || 0) * Math.PI / 180,
    (rotation.yaw || 0) * Math.PI / 180,
    (rotation.roll || 0) * Math.PI / 180
  ];

  // Animate propellers and add hover effect
  useFrame((state) => {
    if (propellerRefs.current) {
      propellerRefs.current.forEach((propeller) => {
        if (propeller && isFlying) {
          propeller.rotation.y += 0.5; // Fast rotation when flying
        }
      });
    }
    
    // Add subtle hover animation when flying
    if (droneRef.current && isFlying) {
      droneRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={droneRef} position={dronePosition} rotation={droneRotation}>
      {/* Main Body */}
      <Box args={[1.5, 0.3, 1.5]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={isFlying ? "#3b82f6" : "#64748b"} 
          metalness={0.7}
          roughness={0.3}
        />
      </Box>
      
      {/* Center Hub */}
      <Cylinder args={[0.4, 0.4, 0.2]} position={[0, 0.1, 0]}>
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.8}
          roughness={0.2}
        />
      </Cylinder>
      
      {/* Arms */}
      {[
        [0.8, 0, 0.8],   // Front Right
        [-0.8, 0, 0.8],  // Front Left
        [0.8, 0, -0.8],  // Back Right
        [-0.8, 0, -0.8]  // Back Left
      ].map((pos, index) => (
        <group key={index}>
          {/* Arm */}
          <Box args={[0.6, 0.1, 0.1]} position={pos}>
            <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
          </Box>
          
          {/* Motor */}
          <Cylinder args={[0.15, 0.15, 0.3]} position={[pos[0], pos[1] + 0.15, pos[2]]}>
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </Cylinder>
          
          {/* Propeller */}
          <group 
            ref={(el) => (propellerRefs.current[index] = el)}
            position={[pos[0], pos[1] + 0.35, pos[2]]}
          >
            <Box args={[1.2, 0.02, 0.1]}>
              <meshStandardMaterial 
                color={isFlying ? "#10b981" : "#6b7280"} 
                transparent
                opacity={isFlying ? 0.7 : 1}
              />
            </Box>
            <Box args={[0.1, 0.02, 1.2]}>
              <meshStandardMaterial 
                color={isFlying ? "#10b981" : "#6b7280"} 
                transparent
                opacity={isFlying ? 0.7 : 1}
              />
            </Box>
          </group>
        </group>
      ))}
      
      {/* Landing Gear */}
      {!isFlying && [
        [0.5, -0.3, 0.5],
        [-0.5, -0.3, 0.5],
        [0.5, -0.3, -0.5],
        [-0.5, -0.3, -0.5]
      ].map((pos, index) => (
        <Cylinder key={index} args={[0.03, 0.03, 0.4]} position={pos}>
          <meshStandardMaterial color="#374151" />
        </Cylinder>
      ))}
      
      {/* LED Lights */}
      <Sphere args={[0.05]} position={[0.7, 0.1, 0.7]}>
        <meshStandardMaterial 
          color={isFlying ? "#ef4444" : "#dc2626"} 
          emissive={isFlying ? "#ef4444" : "#000000"}
          emissiveIntensity={isFlying ? 0.5 : 0}
        />
      </Sphere>
      <Sphere args={[0.05]} position={[-0.7, 0.1, 0.7]}>
        <meshStandardMaterial 
          color={isFlying ? "#10b981" : "#059669"} 
          emissive={isFlying ? "#10b981" : "#000000"}
          emissiveIntensity={isFlying ? 0.5 : 0}
        />
      </Sphere>
      
      {/* Camera Gimbal */}
      <group position={[0, -0.2, 0.6]}>
        <Sphere args={[0.2]}>
          <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
        </Sphere>
        <Box args={[0.3, 0.1, 0.15]} position={[0, 0, 0.15]}>
          <meshStandardMaterial color="#111827" />
        </Box>
      </group>
    </group>
  );
};

export default DroneModel;
