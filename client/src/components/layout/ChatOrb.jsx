import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial } from '@react-three/drei';

function OrbMesh({ isTyping }) {
  const meshRef = useRef();
  const speed = isTyping ? 4 : 1;
  const distort = isTyping ? 0.6 : 0.2;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5 * speed;
      meshRef.current.rotation.x += delta * 0.2 * speed;
    }
  });

  return (
    <Icosahedron ref={meshRef} args={[1, 4]}>
      <MeshDistortMaterial
        color="#4FD8C4"
        attach="material"
        distort={distort}
        speed={speed}
        roughness={0.2}
        metalness={0.8}
        wireframe={true}
      />
    </Icosahedron>
  );
}

export default function ChatOrb({ isTyping = false, className = "w-10 h-10" }) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <OrbMesh isTyping={isTyping} />
      </Canvas>
    </div>
  );
}
