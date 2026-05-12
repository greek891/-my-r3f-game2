import { useState, useRef, Suspense, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
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


// ==========================================
// 🎥 CINEMATIC CAMERA SCRIPTS 
// ==========================================
const DESKTOP_CAMERA = {
  posA: [-20, 400, 40],     
  targetA: [-50, 19, -50], 
  fovA: 100,          

  posB: [-15, 17, 75],
  targetB: [0, 0, -50], 
  durationToB: 2,        
  fovB: 50,          

  posC: [0, 2, 70],
  targetC: [0, -1, 10], 
  durationToC: 2,        
  fovC: 18.5,        
  
  near: 1,            
  far: 500,            
};

const MOBILE_CAMERA = {
  posA: [-20, 500, 50],     
  targetA: [-50, 19, -50], 
  fovA: 260,           

  posB: [-15, 50, 75],
  targetB: [0, 0, -50], 
  durationToB: 5.9,        
  fovB: 190,          
  
  posC: [0, 2, 70],
  targetC: [0, -1, 10], 
  durationToC: 1.5,       
  fovC: 17.5,         
  
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

// ==========================================
// 🎬 CINEMATIC CAMERA RIG (Multi-Step & Dynamic FOV)
// ==========================================
function IntroCameraPan({ isPlaying, onComplete, config }) {
  const controlsRef = useRef();
  const { camera } = useThree(); 
  const targetFov = useRef(config.fovA);

 
  useFrame((state, delta) => {
 
    if (Math.abs(camera.fov - targetFov.current) > 0.1) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov.current, 3, delta);
      camera.updateProjectionMatrix(); // Tell Three.js the lens changed
    }
  });

  useEffect(() => {
    if (!controlsRef.current) return;

    const runCameraScript = async () => {
    
      targetFov.current = config.fovA;
      camera.fov = config.fovA;
      camera.updateProjectionMatrix();
      
      await controlsRef.current.setLookAt(
        ...config.posA, 
        ...config.targetA, 
        false 
      );

      if (!isPlaying) return; 

      targetFov.current = config.fovB;
      
      controlsRef.current.smoothTime = config.durationToB;
      controlsRef.current.setLookAt(
        ...config.posB, 
        ...config.targetB, 
        true 
      );


      await new Promise(resolve => setTimeout(resolve, 1200));

      targetFov.current = config.fovC;
      
      controlsRef.current.smoothTime = config.durationToC;
      await controlsRef.current.setLookAt(
        ...config.posC, 
        ...config.targetC, 
        true 
      );
      
      console.log("Cinematic sequence complete!");

      if (onComplete) onComplete();
    };

    runCameraScript();
  }, [isPlaying, onComplete, config, camera]);

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
  //const [gameState, setGameState] = useState('game');
  const [dialogue, setDialogue] = useState(null);
  const videoRef = useRef();
  const { progress } = useProgress();

  const [showStatic, setShowStatic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

 
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeCamera = isMobile ? MOBILE_CAMERA : DESKTOP_CAMERA;

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
   
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
  

    document.body.classList.remove('bg-waiting', 'bg-game');
    const activeClass = (gameState === 'waiting') ? 'bg-waiting' : 'bg-game';
    document.body.classList.add(activeClass);
  
    let frameId;
    const syncSystemBar = () => {
      const currentColor = window.getComputedStyle(document.body).backgroundColor;
      themeMeta.setAttribute('content', currentColor);
      frameId = requestAnimationFrame(syncSystemBar);
    };
  
    frameId = requestAnimationFrame(syncSystemBar);
  
    return () => {
      cancelAnimationFrame(frameId);
      document.body.classList.remove('bg-waiting', 'bg-game');
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing_intro' && videoRef.current) {
      videoRef.current.play();
    }
  }, [gameState]);


  useEffect(() => {
    sceneRevealSound.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (gameState === 'game') {
      sceneRevealSound.currentTime = 0;
      sceneRevealSound.play().catch(e => console.log("Audio blocked:", e));
    }
  }, [gameState]);

  useEffect(() => {
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
  
    let frameId;

    const syncSystemBar = () => {

      const currentColor = window.getComputedStyle(document.body).backgroundColor;
      
      // Update the meta tag
      themeMeta.setAttribute('content', currentColor);
  
      // Keep syncing as long as the component is mounted
      frameId = requestAnimationFrame(syncSystemBar);
    };
  
    frameId = requestAnimationFrame(syncSystemBar);
  
    return () => cancelAnimationFrame(frameId);
  }, []); 

  const triggerTestDialogue = useCallback(() => {
    setDialogue({
      speaker: "Gavin",
      screens: [
        { text: "Hey Team BlueCoo Creative! 👋\nI’m a developer based just across the water in Fife." },
        { text: "I'm currently looking for new work opportunities, or even just some industry advice from a great local agency." },
        { text: "Instead of sending a standard CV, I built this PSX-style scene using React Three Fiber, Blender, and GIMP." },
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
  
      <div className={`dynamic-bg waiting-bg ${gameState === 'waiting' ? 'active' : ''}`} />
      <div className={`dynamic-bg game-bg ${gameState !== 'waiting' ? 'active' : ''}`} />

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
          backgroundColor: 'transparent', 
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

     {/* 2. THE INTRO VIDEO (Predictive Crossfade) */}
     {gameState !== 'waiting' && (
        <video
          ref={videoRef}
          playsInline
          disablePictureInPicture
          controls={false}
          muted={isMuted} 
          onTimeUpdate={handleTimeUpdate} 
          style={{
            position: 'absolute',
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100dvh', 
            minHeight: '100%',
            objectFit: 'cover', 
            objectPosition: 'center center',
            zIndex: 10, 
            backgroundColor: 'black',
            opacity: gameState === 'game' ? 0 : 1,
            transition: 'opacity 0.2s ease-out',
            pointerEvents: gameState === 'game' ? 'none' : 'auto'
          }}
        >
         
          <source src="/introVideoMobile2.mp4" media="(max-width: 768px)" type="video/mp4" />
          
          {/* If the screen is wider than 768px, it skips the first one and loads this desktop video. */}
          <source src="/introVideo5.mp4" type="video/mp4" />
          
        </video>
      )}

   
      <div style={{
        width: '100vw', height: '100dvh',
        backgroundImage: 'url(/psxBackdrop3.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'black',
        position: 'absolute', top: 0, left: 0, zIndex: 1
      }}>
        

        <KeyboardControls map={KEY_BINDINGS}>
          <Canvas gl={{ alpha: CANVAS_CONFIG.alpha, antialias: CANVAS_CONFIG.antialias }} dpr={CANVAS_CONFIG.dpr} shadows>
            
          <PerspectiveCamera 
              makeDefault 
              position={activeCamera.posA} 
              fov={activeCamera.fovA}          
              near={activeCamera.near}        
              far={activeCamera.far}          
            />
            
            <IntroCameraPan 
              isPlaying={gameState === 'game'} 
              onComplete={triggerTestDialogue} 
              config={activeCamera} 
            />

            <Suspense fallback={null}>
              <Environment preset={controls.envPreset} />
              <ambientLight intensity={controls.ambientIntensity} />
              <directionalLight castShadow color={controls.dirColor} position={controls.dirPosition} intensity={controls.dirIntensity} shadow-mapSize={[controls.shadowMapSize, controls.shadowMapSize]} />

              <Physics gravity={PHYSICS_CONFIG.gravity} debug={PHYSICS_CONFIG.debug}>
                <SceneModel />
                <Player rotation={[0, 0, 0]} position={[0.5, -1, 60]} />
              </Physics>

            
              {controls.enableFX && (
                <EffectComposer disableNormalPass alpha>
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