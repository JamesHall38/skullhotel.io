import React, { useState } from 'react';
import { useTexture } from '@react-three/drei';

const Radio = () => {
	const [isOn, setIsOn] = useState(false);

	const textureOn = useTexture('/textures/bedroom/radio_on.webp');
	const textureOff = useTexture('/textures/bedroom/radio_off.webp');

	// Ratio 209 x 715
	const planeWidth = 2.09;
	const planeHeight = 7.15;

	return (
		<mesh
			scale={0.05}
			position={[4.12, 0.927, 0.295]}
			rotation={[Math.PI / 2, -Math.PI / 2, Math.PI]}
			onClick={() => setIsOn(!isOn)}
		>
			<planeGeometry args={[planeWidth, planeHeight]} />
			{isOn ? (
				<meshBasicMaterial map={textureOn} />
			) : (
				<meshStandardMaterial map={textureOff} />
			)}
		</mesh>
	);
};

export default Radio;
