import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

export function SceneModel(props) {
  const { scene } = useGLTF('/officeScene14-transformed.glb');

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={scene} {...props} />
    </RigidBody>
  );
}