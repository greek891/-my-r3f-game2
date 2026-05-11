import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

export function SceneModel(props) {
  const { scene } = useGLTF('/officeScene14.glb'); // Path to your scene file

  return (
    // "fixed" means it has collision but doesn't move or fall
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={scene} {...props} />
    </RigidBody>
  );
}