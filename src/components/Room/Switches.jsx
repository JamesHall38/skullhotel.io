import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import DetectableCube from '../DetectableCube';

export default function Switches(props) {
	const roomLight = useGame((state) => state.roomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const setCursor = useInterface((state) => state.setCursor);
	const { nodes, materials } = useGLTF('/models/room/switchs.glb');
	const [switch1Clickable, setSwitch2Clickable] = useState(false);
	const [switch2Clickable, setSwitch1Clickable] = useState(false);
	const switch1Ref = useRef();
	const switch2Ref = useRef();

	const switchOnSoundRef = useRef(new Audio('/sounds/switch_on.ogg'));
	const switchOffSoundRef = useRef(new Audio('/sounds/switch_off.ogg'));

	useEffect(() => {
		const handleClickSwitch1 = () => {
			if (switch1Clickable) {
				setBathroomLight(!bathroomLight);
				if (!bathroomLight) {
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play();
				} else {
					switchOffSoundRef.current.currentTime = 0;
					switchOffSoundRef.current.play();
				}
			}
		};

		const handleClickSwitch2 = () => {
			if (switch2Clickable) {
				setRoomLight(!roomLight);
				if (!roomLight) {
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play();
				} else {
					switchOffSoundRef.current.currentTime = 0;
					switchOffSoundRef.current.play();
				}
			}
		};

		document.addEventListener('click', handleClickSwitch1);
		document.addEventListener('click', handleClickSwitch2);
		return () => {
			document.removeEventListener('click', handleClickSwitch1);
			document.removeEventListener('click', handleClickSwitch2);
		};
	}, [
		bathroomLight,
		roomLight,
		setBathroomLight,
		setRoomLight,
		switch1Clickable,
		switch2Clickable,
	]);

	const handleDetectionSwitch1 = useCallback(() => {
		setCursor('light');
		setSwitch1Clickable(true);
	}, [setCursor, setSwitch1Clickable]);

	const handleDetectionSwitch2 = useCallback(() => {
		setCursor('light');
		setSwitch2Clickable(true);
	}, [setCursor, setSwitch2Clickable]);

	const handleDetectionEnd1 = useCallback(() => {
		setCursor(null);
		setSwitch1Clickable(false);
	}, [setCursor, setSwitch1Clickable]);

	const handleDetectionEnd2 = useCallback(() => {
		setCursor(null);
		setSwitch2Clickable(false);
	}, [setCursor, setSwitch2Clickable]);

	return (
		<group {...props} dispose={null}>
			<mesh
				ref={switch1Ref}
				castShadow
				receiveShadow
				geometry={nodes.Switch1.geometry}
				material={materials.White}
				position={[1.889, 1.031, -4.69]}
			/>
			<DetectableCube
				position={[1.889, 1.031, -4.67]}
				scale={[0.2, 0.2, 0.05]}
				distance={1.5}
				onDetect={handleDetectionSwitch1}
				onDetectEnd={handleDetectionEnd1}
			/>
			<mesh
				ref={switch2Ref}
				castShadow
				receiveShadow
				geometry={nodes.Switch2.geometry}
				material={materials.White}
				position={[1.448, 1.031, -3.309]}
			/>
			<DetectableCube
				position={[1.448, 1.031, -3.309]}
				scale={0.2}
				distance={1.5}
				onDetect={handleDetectionSwitch2}
				onDetectEnd={handleDetectionEnd2}
			/>
		</group>
	);
}

useGLTF.preload('/models/room/switchs.glb');
