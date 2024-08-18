import React, { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useGame from '../../hooks/useGame';

export default function Switches(props) {
	const roomLight = useGame((state) => state.roomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const { nodes, materials } = useGLTF('/models/room/switchs.glb');
	const switch1Ref = useRef();
	const switch2Ref = useRef();

	const [rotationSwitch1, setRotationSwitch1] = useState(0);
	const [rotationSwitch2, setRotationSwitch2] = useState(0);

	const switchOnSoundRef = useRef(new Audio('/sounds/switchON.ogg'));
	const switchOffSoundRef = useRef(new Audio('/sounds/switchOFF.ogg'));

	const handleClickSwitch1 = () => {
		setRotationSwitch1(rotationSwitch1 + Math.PI / 8);
		setRoomLight(!roomLight);

		if (!roomLight) {
			switchOnSoundRef.current.currentTime = 0;
			switchOnSoundRef.current.play();
		} else {
			switchOffSoundRef.current.currentTime = 0;
			switchOffSoundRef.current.play();
		}
	};

	const handleClickSwitch2 = () => {
		setRotationSwitch2(rotationSwitch2 + Math.PI / 8);
		setBathroomLight(!bathroomLight);

		if (!bathroomLight) {
			switchOnSoundRef.current.currentTime = 0;
			switchOnSoundRef.current.play();
		} else {
			switchOffSoundRef.current.currentTime = 0;
			switchOffSoundRef.current.play();
		}
	};

	useEffect(() => {
		setRotationSwitch1(roomLight ? -Math.PI / 30 : 0);
	}, [roomLight]);

	useEffect(() => {
		setRotationSwitch2(bathroomLight ? -Math.PI / 30 : 0);
	}, [bathroomLight]);

	useFrame(() => {
		if (switch1Ref.current) {
			switch1Ref.current.rotation.x = rotationSwitch1;
		}
		if (switch2Ref.current) {
			switch2Ref.current.rotation.z = rotationSwitch2;
		}
	});

	return (
		<group {...props} dispose={null}>
			<mesh
				ref={switch2Ref}
				castShadow
				receiveShadow
				geometry={nodes.Switch2.geometry}
				material={materials.White}
				position={[1.448, 1.031, -3.309]}
				onClick={handleClickSwitch2}
			/>
			<mesh
				ref={switch1Ref}
				castShadow
				receiveShadow
				geometry={nodes.Switch1.geometry}
				material={materials.White}
				position={[1.889, 1.031, -4.69]}
				onClick={handleClickSwitch1}
			/>
		</group>
	);
}

useGLTF.preload('/models/room/switchs.glb');
