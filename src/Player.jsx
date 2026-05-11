import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls, useGLTF, useAnimations } from '@react-three/drei';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';

const SPEED = 5;
const direction = new THREE.Vector3();
const frontVector = new THREE.Vector3();
const sideVector = new THREE.Vector3();

// 👇 Accept "props" so App.jsx can pass position and rotation data!
export function Player(props) {
  const playerRef = useRef();
  const [, getKeys] = useKeyboardControls();

  const { scene, animations } = useGLTF('/myCharacter.glb');
  const { actions } = useAnimations(animations, scene);
  const currentAction = useRef('');

  useEffect(() => {
    console.log("🎬 Available Animations:", actions);
    if (actions['Idle']) {
      actions['Idle'].play();
      currentAction.current = 'Idle';
    }
  }, [actions]);

  useFrame(() => {
    if (!playerRef.current) return;

    const { forward, backward, left, right } = getKeys();

    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED);

    const velocity = playerRef.current.linvel();
    playerRef.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z }, true);

    const isMoving = forward || backward || left || right;
    
    if (isMoving) {
      // 👇 Added Math.PI so the character doesn't face backward when walking
      const angle = Math.atan2(direction.x, direction.z);
      scene.rotation.y = angle + Math.PI; 
    }

    const targetAction = (isMoving && actions['Walk']) ? 'Walk' : 'mixamo.com';

    if (actions[targetAction] && currentAction.current !== targetAction) {
      const next = actions[targetAction];
      const current = actions[currentAction.current];

      current?.fadeOut(0.2);
      next?.reset().fadeIn(0.2).play();
      
      currentAction.current = targetAction;
    }

    // 🚨 DELETED ALL CAMERA HIJACKING CODE HERE 🚨
    // App.jsx is now strictly the boss of the camera.
  });

// 👇 Removed hardcoded position, spread {...props} instead
return (
  <RigidBody 
    ref={playerRef} 
    colliders={false} 
    mass={1} 
    type="dynamic" 
    lockRotations 
    {...props} 
  >
    <CapsuleCollider args={[0.5, 0.5]} />
    

    <primitive object={scene} position-y={-1} />
  </RigidBody>
);
}