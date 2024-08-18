import { useRef } from 'react';
import { useFrame, extend, useLoader } from '@react-three/fiber';
import { shaderMaterial, Plane } from '@react-three/drei';
import * as THREE from 'three';
import useMonster from '../../hooks/useMonster';

const BloodMaterial = shaderMaterial(
	{
		uTime: 0,
		uSize: 10 * window.devicePixelRatio,
	},
	// vertex shader
	`
    uniform float uTime;
    uniform float uSize;

    void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        modelPosition.y = mod(-uTime * 5.0 + position.y , 3.0);
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
        gl_PointSize = uSize / gl_Position.z; 
    }
`,
	// fragment shader
	`
    void main() {
        vec2 coords = gl_PointCoord - vec2(0.5);
        if (dot(coords, coords) > 0.25) discard; 
        gl_FragColor = vec4(0.2, 0.0, 0.0, 1.0);
    }
`
);

extend({ BloodMaterial });

const Blood = () => {
	const monsterRotation = useMonster((state) => state.monsterRotation);
	const ref = useRef();
	const points = useRef();
	const geometry = new THREE.BufferGeometry();
	const count = 12;
	const positions = new Float32Array(count * 3);
	const texture = useLoader(THREE.TextureLoader, '/textures/blood.png');

	for (let i = 0; i < count; i++) {
		const i3 = i * 3;
		positions[i3] = Math.random() * 0.5 - 0.3;
		positions[i3 + 1] = Math.random() * 3 - 0.55;
		positions[i3 + 2] = Math.random() * 0.5 - 0.55;
	}
	geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

	useFrame(({ clock }) => {
		ref.current.uniforms.uTime = { value: clock.elapsedTime };
	});

	return (
		<group position={[0, 0, 0.25]}>
			<points ref={points} geometry={geometry}>
				<bloodMaterial ref={ref} />
			</points>
			<Plane
				frustumCulled={false}
				args={[1.4, 1.4]}
				rotation={[-Math.PI / 2, 0, monsterRotation[2]]}
				position={[0, 0.255, -0.35]}
				receiveShadow
			>
				<meshStandardMaterial
					attach="material"
					map={texture}
					side={THREE.DoubleSide}
					depthWrite={false}
					transparent
				/>
			</Plane>
		</group>
	);
};

export default Blood;
