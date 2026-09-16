import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';

function GlobeMesh() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2.5, 24, 24]}>
      <meshBasicMaterial color="#E3A857" wireframe transparent opacity={0.15} />
    </Sphere>
  );
}

export default function HeroGlobe() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center mix-blend-screen">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <GlobeMesh />
      </Canvas>
      {/* Subtle radial gradient to blend the globe into the background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-bg-primary)_70%)]" />
    </div>
  );
}
