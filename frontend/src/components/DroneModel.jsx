import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere, RoundedBox, Torus } from '@react-three/drei';
import * as THREE from 'three';

const DroneModel = ({ position, rotation, isFlying }) => {
  const droneRef = useRef();
  const propellerRefs = useRef([]);
  const glowRef = useRef();
  
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
        if (propeller) {
          propeller.rotation.y += isFlying ? 0.8 : 0.05; // Fast rotation when flying
        }
      });
    }
    
    // Add subtle hover animation when flying
    if (droneRef.current && isFlying) {
      droneRef.current.position.y += Math.sin(state.clock.elapsedTime * 3) * 0.015;
    }
    
    // Animate glow
    if (glowRef.current && isFlying) {
      glowRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group ref={droneRef} position={dronePosition} rotation={droneRotation}>
      {/* Bottom glow effect when flying */}
      {isFlying && (
        <Torus 
          ref={glowRef}
          args={[1.5, 0.3, 16, 32]} 
          position={[0, -0.5, 0]} 
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshBasicMaterial 
            color="#3b82f6" 
            transparent
            opacity={0.4}
          />
        </Torus>
      )}
      
      {/* Main Body - Sleeker design */}
      <RoundedBox args={[1.8, 0.25, 1.8]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={isFlying ? "#2563eb" : "#475569"} 
          metalness={0.8}
          roughness={0.2}
          emissive={isFlying ? "#1e40af" : "#000000"}
          emissiveIntensity={isFlying ? 0.3 : 0}
        />
      </RoundedBox>
      
      {/* Top detail panel */}
      <RoundedBox args={[1.2, 0.08, 1.2]} radius={0.02} position={[0, 0.17, 0]}>
        <meshStandardMaterial 
          color={isFlying ? "#1e3a8a" : "#334155"} 
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>
      
      {/* Center Hub - More prominent */}
      <Cylinder args={[0.45, 0.5, 0.25]} position={[0, 0.13, 0]}>
        <meshStandardMaterial 
          color="#0f172a" 
          metalness={0.9}
          roughness={0.1}
        />
      </Cylinder>
      
      {/* Top antenna */}
      <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 0.45, 0]}>
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </Cylinder>
      <Sphere args={[0.05]} position={[0, 0.65, 0]}>
        <meshStandardMaterial 
          color={isFlying ? "#ef4444" : "#991b1b"}
          emissive={isFlying ? "#ef4444" : "#000000"}
          emissiveIntensity={isFlying ? 0.8 : 0}
        />
      </Sphere>
      
      {/* Arms and Motors */}
      {[
        { pos: [0.9, 0, 0.9], color: '#ef4444' },   // Front Right - Red
        { pos: [-0.9, 0, 0.9], color: '#10b981' },  // Front Left - Green
        { pos: [0.9, 0, -0.9], color: '#f59e0b' },  // Back Right - Orange
        { pos: [-0.9, 0, -0.9], color: '#3b82f6' }  // Back Left - Blue
      ].map((arm, index) => (
        <group key={index}>
          {/* Arm - Carbon fiber look */}
          <RoundedBox args={[0.7, 0.12, 0.12]} radius={0.02} position={arm.pos}>
            <meshStandardMaterial 
              color="#1e293b" 
              metalness={0.7} 
              roughness={0.3}
            />
          </RoundedBox>
          
          {/* Motor housing */}
          <Cylinder args={[0.18, 0.22, 0.35]} position={[arm.pos[0], arm.pos[1] + 0.18, arm.pos[2]]}>
            <meshStandardMaterial 
              color="#0f172a" 
              metalness={0.9} 
              roughness={0.1}
            />
          </Cylinder>
          
          {/* Motor top cap */}
          <Cylinder args={[0.15, 0.15, 0.05]} position={[arm.pos[0], arm.pos[1] + 0.38, arm.pos[2]]}>
            <meshStandardMaterial 
              color={arm.color}
              metalness={0.8}
              emissive={isFlying ? arm.color : "#000000"}
              emissiveIntensity={isFlying ? 0.5 : 0}
            />
          </Cylinder>
          
          {/* Propeller - More realistic */}
          <group 
            ref={(el) => (propellerRefs.current[index] = el)}
            position={[arm.pos[0], arm.pos[1] + 0.42, arm.pos[2]]}
          >
            {/* Propeller blades */}
            <Box args={[1.4, 0.03, 0.15]} position={[0, 0, 0]}>
              <meshStandardMaterial 
                color={isFlying ? "#cbd5e1" : "#64748b"} 
                transparent
                opacity={isFlying ? 0.6 : 0.9}
                metalness={0.6}
                roughness={0.3}
              />
            </Box>
            <Box args={[0.15, 0.03, 1.4]} position={[0, 0, 0]}>
              <meshStandardMaterial 
                color={isFlying ? "#cbd5e1" : "#64748b"} 
                transparent
                opacity={isFlying ? 0.6 : 0.9}
                metalness={0.6}
                roughness={0.3}
              />
            </Box>
            {/* Center hub */}
            <Cylinder args={[0.08, 0.08, 0.06]}>
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </Cylinder>
          </group>
        </group>
      ))}
      
      {/* Landing Gear - Only when not flying */}
      {!isFlying && [
        [0.6, -0.35, 0.6],
        [-0.6, -0.35, 0.6],
        [0.6, -0.35, -0.6],
        [-0.6, -0.35, -0.6]
      ].map((pos, index) => (
        <group key={`landing-${index}`}>
          <Cylinder args={[0.04, 0.04, 0.5]} position={pos}>
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </Cylinder>
          {/* Landing foot */}
          <Sphere args={[0.06]} position={[pos[0], pos[1] - 0.25, pos[2]]}>
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </Sphere>
        </group>
      ))}
      
      {/* Enhanced LED Lights - Navigation lights */}
      <Sphere args={[0.08]} position={[0.8, 0.15, 0.8]}>
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444"
          emissiveIntensity={isFlying ? 1.0 : 0.2}
          metalness={0.8}
        />
      </Sphere>
      <Sphere args={[0.08]} position={[-0.8, 0.15, 0.8]}>
        <meshStandardMaterial 
          color="#10b981" 
          emissive="#10b981"
          emissiveIntensity={isFlying ? 1.0 : 0.2}
          metalness={0.8}
        />
      </Sphere>
      
      {/* Status LED on top */}
      <Sphere args={[0.06]} position={[0, 0.2, 0]}>
        <meshStandardMaterial 
          color={isFlying ? "#3b82f6" : "#64748b"} 
          emissive={isFlying ? "#3b82f6" : "#000000"}
          emissiveIntensity={isFlying ? 0.8 : 0}
        />
      </Sphere>
      
      {/* Camera Gimbal - More detailed */}
      <group position={[0, -0.15, 0.7]}>
        {/* Gimbal mount */}
        <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </Cylinder>
        {/* Camera body */}
        <RoundedBox args={[0.25, 0.2, 0.25]} radius={0.03} position={[0, 0, 0.15]}>
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        {/* Camera lens */}
        <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </Cylinder>
        {/* Lens glass */}
        <Cylinder args={[0.06, 0.06, 0.02]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.35]}>
          <meshStandardMaterial color="#1e40af" metalness={1.0} roughness={0} transparent opacity={0.8} />
        </Cylinder>
      </group>
    </group>
  );
};

export default DroneModel;
