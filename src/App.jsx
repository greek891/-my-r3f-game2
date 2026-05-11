import { useState, useRef, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, Environment, PerspectiveCamera, useProgress, CameraControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { useControls, folder, Leva } from 'leva';
import * as THREE from 'three';
import { EffectComposer, Bloom, Noise, Vignette, Pixelation } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

import { SceneModel } from './SceneModel';
import { DialogueBox } from './DialogueBox';
import { Player } from './Player';
import JewelCase from './JewelCase'; 
import StaticOverlay from './StaticOverlay0'; 
import { VolumeControl } from './VolumeControl';
import './App.css';


const CAMERA_CONFIG = {
  posA: [-20, 400, 40],     
  targetA: [-50, 19, -50], 
  posB: [-15, 17, 75],
  targetB: [0, 0, -50], 
  durationToB: 1.1,        
  posC: [0, 2, 70],
  targetC: [0, -1, 10], 
  durationToC: 0.5,        
  fov: 18.5,              
  near: 1,            
  far: 500,            
};

const PHYSICS_CONFIG = {
  gravity: [0, 0, 0],
  debug: false,
};

const CANVAS_CONFIG = {
  alpha: true,
  antialias: false,
  dpr: [1, 2],
};

const KEY_BINDINGS = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
  { name: 'jump', keys: ['Space'] },
];

const sceneRevealSound = new Audio('/testAudio5.mp3'); 
sceneRevealSound.volume = 1;


function IntroCameraPan({ isPlaying, onComplete }) {
  const controlsRef = useRef();

  useEffect(() => {
    if (!controlsRef.current) return;

    const runCameraScript = async () => {
      await controlsRef.current.setLookAt(
        ...CAMERA_CONFIG.posA, 
        ...CAMERA_CONFIG.targetA, 
        false 
      );

      if (!isPlaying) return; 

      controlsRef.current.smoothTime = CAMERA_CONFIG.durationToB;
      await controlsRef.current.setLookAt(
        ...CAMERA_CONFIG.posB, 
        ...CAMERA_CONFIG.targetB, 
        true 
      );

      controlsRef.current.smoothTime = CAMERA_CONFIG.durationToC;
      await controlsRef.current.setLookAt(
        ...CAMERA_CONFIG.posC, 
        ...CAMERA_CONFIG.targetC, 
        true 
      );
      
      console.log("Cinematic sequence complete!");

      if (onComplete) onComplete();
    };

    runCameraScript();
  }, [isPlaying, onComplete]);

  return (
    <CameraControls 
      ref={controlsRef} 
      makeDefault 
      mouseButtons={{ left: 0, middle: 0, right: 0, wheel: 0 }}
      touches={{ one: 0, two: 0, three: 0 }}
    />
  );
}

export default function App() {
  const [gameState, setGameState] = useState('waiting');
  const [dialogue, setDialogue] = useState(null);
  const videoRef = useRef();
  const { progress } = useProgress();

  const [showStatic, setShowStatic] = useState(false);
  
  // 👇 NEW: State to control global audio (Defaults to false/Audio ON)
  const [isMuted, setIsMuted] = useState(false);

  // ==========================================
  // 💡 REAL-TIME UI CONTROLS (Leva)
  // ==========================================
  const controls = useControls({
    '💡 Scene Lighting': folder({
      ambientIntensity: { value: 0.4, min: 0, max: 5, step: 0.1 },
      dirIntensity: { value: 0.8, min: 0, max: 10, step: 0.1 },
      dirPosition: { value: [-2, 3, -10] },
      dirColor: { value: '#f6ff94' },
      shadowMapSize: { options: [512, 1024, 2048, 4096], value: 512 },
      envPreset: { options: ['city', 'sunset', 'dawn', 'night', 'warehouse', 'forest', 'studio'], value: 'forest' }
    }),
    '📺 Post-Processing': folder({
      enableFX: { value: true, label: 'Enable All FX' },
      pixelate: { value: true, label: 'ON: Pixelation' },
      pixelSize: { value: 2, min: 1, max: 10, step: 1, render: (get) => get('📺 Post-Processing.pixelate') },
      bloom: { value: true, label: 'ON: Bloom' },
      bloomIntensity: { value: 1, min: 0, max: 5, step: 0.1, render: (get) => get('📺 Post-Processing.bloom') },
      bloomThreshold: { value: 0, min: 0, max: 1, step: 0.1, render: (get) => get('📺 Post-Processing.bloom') },
      noise: { value: true, label: 'ON: Film Grain' },
      noiseOpacity: { value: 0.30, min: 0, max: 1, step: 0.05, render: (get) => get('📺 Post-Processing.noise') },
      vignette: { value: true, label: 'ON: Vignette' },
      vignetteDarkness: { value: 1, min: 0, max: 1, step: 0.05, render: (get) => get('📺 Post-Processing.vignette') },
    })
  });

  const startIntro = () => {
    setGameState('playing_intro');
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (!duration) return;

    if (duration - currentTime < 0.1 && gameState === 'playing_intro') {
      setGameState('game');
    }
  };

  useEffect(() => {
    if (gameState === 'playing_intro' && videoRef.current) {
      videoRef.current.play();
    }
  }, [gameState]);

  // 👇 NEW: Keep the scene sound synced with the mute state
  useEffect(() => {
    sceneRevealSound.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (gameState === 'game') {
      sceneRevealSound.currentTime = 0;
      sceneRevealSound.play().catch(e => console.log("Audio blocked:", e));
    }
  }, [gameState]);

  const triggerTestDialogue = useCallback(() => {
    setDialogue({
      speaker: "Gavin",
      screens: [
        { text: "Hey Team BlueCoo Creative! 👋\nI’m a developer based just across the water in Fife." },
        { text: "I'm currently looking for new work opportunities, or even just some industry advice from a great local agency." },
        { text: "Instead of sending a standard CV, I built this PS-style scene using React Three Fiber, Blender, and GIMP." },
        { 
          text: "Feel free to explore my portfolio, and I'd love it if you took a look at my CV!",
          attachmentUrl: "/cvEdited.png", 
          buttons: [
            {
              label: "View CV",
              action: "VIEW_ATTACHMENT" 
            },
            {
              label: "My Portfolio",
              onClick: () => {
                setShowStatic(true);
                setTimeout(() => {
                  window.location.href = "https://greekie.dev";
                }, 100); 
              }
            }
          ]
        }
      ]
    });
  }, []); 

  return (
    <>
      <Leva hidden />

  
      <VolumeControl isMuted={isMuted} onToggle={() => setIsMuted(!isMuted)} />

      {showStatic && (
        <StaticOverlay 
          isActive={showStatic} 
          duration={9000} 
          onComplete={() => setShowStatic(false)} 
        />
      )}

      {dialogue && (
        <DialogueBox 
          speaker={dialogue.speaker} 
          screens={dialogue.screens} 
          // If you want to mute dialogue sounds too, you can pass isMuted down!
          // isMuted={isMuted} 
          onComplete={() => setDialogue(null)} 
        />
      )}


      {gameState === 'waiting' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'black', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 20, color: 'white', fontFamily: 'sans-serif'
        }}>
          
          <JewelCase 
            imageSrc="/blueCooPS1BoxArt.png" 
            altText="BLUECOO"
            tiltIntensity={20} 
          />

          <button type="button" className="button" onClick={startIntro} style={{ marginTop: '50px' }}>
            START
          </button>
        </div>
      )}

      {gameState !== 'waiting' && (
        <video
          ref={videoRef}
          src="/introVideo5.mp4"
          playsInline
          muted={isMuted} // 👈 NEW: Ties the video volume to the toggle state
          onTimeUpdate={handleTimeUpdate} 
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100vw', height: '100vh',
            objectFit: 'cover', zIndex: 10, backgroundColor: 'black',
            opacity: gameState === 'game' ? 0 : 1,
            transition: 'opacity 0.2s ease-out',
            pointerEvents: gameState === 'game' ? 'none' : 'auto'
          }}
        />
      )}

   
      <div style={{
        width: '100vw', height: '100vh',
        backgroundImage: 'url(/psxBackdrop3.png)', backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'absolute', top: 0, left: 0, zIndex: 1
      }}>
        

        <KeyboardControls map={KEY_BINDINGS}>
          <Canvas gl={{ alpha: CANVAS_CONFIG.alpha, antialias: CANVAS_CONFIG.antialias }} dpr={CANVAS_CONFIG.dpr} shadows>
            
            <PerspectiveCamera 
              makeDefault 
              position={CAMERA_CONFIG.posA} 
              fov={CAMERA_CONFIG.fov} 
              near={CAMERA_CONFIG.near} 
              far={CAMERA_CONFIG.far} 
            />
            
            <IntroCameraPan isPlaying={gameState === 'game'} onComplete={triggerTestDialogue} />

            <Suspense fallback={null}>
              <Environment preset={controls.envPreset} />
              <ambientLight intensity={controls.ambientIntensity} />
              <directionalLight castShadow color={controls.dirColor} position={controls.dirPosition} intensity={controls.dirIntensity} shadow-mapSize={[controls.shadowMapSize, controls.shadowMapSize]} />

              <Physics gravity={PHYSICS_CONFIG.gravity} debug={PHYSICS_CONFIG.debug}>
                <SceneModel />
                <Player rotation={[0, 0, 0]} position={[0.5, -1, 60]} />
              </Physics>

            
              {controls.enableFX && (
                <EffectComposer disableNormalPass>
                  {controls.pixelate && <Pixelation granularity={controls.pixelSize} />}
                  {controls.bloom && <Bloom luminanceThreshold={controls.bloomThreshold} luminanceSmoothing={0.9} intensity={controls.bloomIntensity} mipmapBlur />}
                  {controls.noise && <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={controls.noiseOpacity} />}
                  {controls.vignette && <Vignette eskil={false} offset={0.1} darkness={controls.vignetteDarkness} />}
                </EffectComposer>
              )}
            </Suspense>
              
          </Canvas>
        </KeyboardControls>
      </div>
    </>
  );
}