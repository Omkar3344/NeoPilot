import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Box, Sphere, RoundedBox, Torus } from '@react-three/drei';
import * as THREE from 'three';

const DroneModel = ({ position, rotation, isFlying }) => {
  const droneRef = useRef();
  const propellerRefs = useRef([]);
  const glowRef = useRef();
  const targetPosition = useRef([0, 0, 0]);
  const currentPosition = useRef([0, 0, 0]);
  const prevPosition = useRef([0, 0, 0]);
  
  // CORRECT axis mapping for Three.js:
  // Backend: X (left/right), Y (altitude), Z (forward/back)
  // Three.js: X (left/right), Y (altitude), Z (forward/back)
  targetPosition.current = [
    position.x || 0,      // X: left/right (same)
    position.y || 0,      // Y: altitude (same)
    position.z || 0       // Z: forward/back (same)
  ];
  
  // Add base height when on ground
  if (!isFlying) {
    targetPosition.current[1] = 0.5;
  }
  
  // Detect large position jumps (like reset) and snap immediately
  useEffect(() => {
    const dx = Math.abs(targetPosition.current[0] - prevPosition.current[0]);
    const dy = Math.abs(targetPosition.current[1] - prevPosition.current[1]);
    const dz = Math.abs(targetPosition.current[2] - prevPosition.current[2]);
    const totalDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // If position jumped more than 5 units, it's likely a reset - snap immediately
    if (totalDistance > 5) {
      currentPosition.current[0] = targetPosition.current[0];
      currentPosition.current[1] = targetPosition.current[1];
      currentPosition.current[2] = targetPosition.current[2];
    }
    
    // Update previous position
    prevPosition.current[0] = targetPosition.current[0];
    prevPosition.current[1] = targetPosition.current[1];
    prevPosition.current[2] = targetPosition.current[2];
  }, [position.x, position.y, position.z]);
  
  // Convert rotation
  const droneRotation = [
    (rotation.pitch || 0) * Math.PI / 180,
    (rotation.yaw || 0) * Math.PI / 180,
    (rotation.roll || 0) * Math.PI / 180
  ];

  // Animate propellers and smooth position interpolation with easing
  useFrame((state, delta) => {
    // Smooth position interpolation with exponential easing for natural movement
    if (droneRef.current) {
      // Use delta time for frame-rate independent interpolation
      const lerpFactor = Math.min(1.0, 0.2 + delta * 5); // Adaptive lerp based on frame time
      
      // Exponential easing for smoother transitions
      const easeOut = (t) => 1 - Math.pow(1 - t, 3); // Cubic ease-out
      
      const dx = targetPosition.current[0] - currentPosition.current[0];
      const dy = targetPosition.current[1] - currentPosition.current[1];
      const dz = targetPosition.current[2] - currentPosition.current[2];
      
      // Apply easing to each axis
      currentPosition.current[0] += dx * lerpFactor * easeOut(Math.abs(dx) / 10);
      currentPosition.current[1] += dy * lerpFactor * easeOut(Math.abs(dy) / 10);
      currentPosition.current[2] += dz * lerpFactor * easeOut(Math.abs(dz) / 10);
      
      droneRef.current.position.set(
        currentPosition.current[0],
        currentPosition.current[1],
        currentPosition.current[2]
      );
      
      // Add subtle hover animation when flying with smoother sine wave
      if (isFlying) {
        const hoverOffset = Math.sin(state.clock.elapsedTime * 2.5) * 0.012;
        const smoothHover = hoverOffset * (1 - Math.abs(dy) / 5); // Reduce hover when moving vertically
        droneRef.current.position.y += smoothHover;
      }
    }
    
    // Propeller rotation with variable speed based on flight state
    if (propellerRefs.current) {
      const baseSpeed = isFlying ? 0.8 : 0.05;
      // Add slight variation to each propeller for realism
      propellerRefs.current.forEach((propeller, index) => {
        if (propeller) {
          const variation = 1 + (index % 2) * 0.1; // Alternate propellers slightly
          propeller.rotation.y += baseSpeed * variation * (delta * 60); // Frame-rate independent
        }
      });
    }
    
    // Animate glow with smoother pulsing
    if (glowRef.current && isFlying) {
      const pulseSpeed = 2;
      const baseOpacity = 0.3;
      const pulseAmplitude = 0.2;
      // Use smoother easing for pulse
      const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed);
      const easedPulse = pulse * (0.5 + 0.5 * Math.cos(state.clock.elapsedTime * 0.5)); // Double wave for smoother effect
      glowRef.current.material.opacity = baseOpacity + easedPulse * pulseAmplitude;
    }
  });

  return (
    <group ref={droneRef} rotation={droneRotation}>
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
          color="#ffffff" 
          metalness={0.8}
          roughness={0.2}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </RoundedBox>
      
      {/* Top detail panel */}
      <RoundedBox args={[1.2, 0.08, 1.2]} radius={0.02} position={[0, 0.17, 0]}>
        <meshStandardMaterial 
          color="#ffffff" 
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>
      
      {/* Center Hub - More prominent */}
      <Cylinder args={[0.45, 0.5, 0.25]} position={[0, 0.13, 0]}>
        <meshStandardMaterial 
          color="#ffffff" 
          metalness={0.9}
          roughness={0.1}
        />
      </Cylinder>
      
      {/* Top antenna */}
      <Cylinder args={[0.02, 0.02, 0.4]} position={[0, 0.45, 0]}>
        <meshStandardMaterial color="#ffffff" metalness={0.8} />
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
              color="#ffffff" 
              metalness={0.7} 
              roughness={0.3}
            />
          </RoundedBox>
          
          {/* Motor housing */}
          <Cylinder args={[0.18, 0.22, 0.35]} position={[arm.pos[0], arm.pos[1] + 0.18, arm.pos[2]]}>
            <meshStandardMaterial 
              color="#ffffff" 
              metalness={0.9} 
              roughness={0.1}
            />
          </Cylinder>
          
          {/* Motor top cap */}
          <Cylinder args={[0.15, 0.15, 0.05]} position={[arm.pos[0], arm.pos[1] + 0.38, arm.pos[2]]}>
            <meshStandardMaterial 
              color="#ffffff"
              metalness={0.8}
              emissive="#000000"
              emissiveIntensity={0}
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
              <meshStandardMaterial color="#ffffff" metalness={0.9} />
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
            <meshStandardMaterial color="#ffffff" metalness={0.7} />
          </Cylinder>
          {/* Landing foot */}
          <Sphere args={[0.06]} position={[pos[0], pos[1] - 0.25, pos[2]]}>
            <meshStandardMaterial color="#ffffff" metalness={0.6} />
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
          <meshStandardMaterial color="#ffffff" metalness={0.9} />
        </Cylinder>
        {/* Camera body */}
        <RoundedBox args={[0.25, 0.2, 0.25]} radius={0.03} position={[0, 0, 0.15]}>
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        {/* Camera lens */}
        <Cylinder args={[0.08, 0.08, 0.1]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
          <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
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
