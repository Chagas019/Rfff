import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './three/Scene';
import { Overlay } from './ui/Overlay';

export default function App() {
  return (
    <main className="relative h-full w-full">
      <Canvas shadows dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }} camera={{ fov: 36, near: 0.1, far: 600, position: [0, 31, 27] }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Overlay />
    </main>
  );
}
