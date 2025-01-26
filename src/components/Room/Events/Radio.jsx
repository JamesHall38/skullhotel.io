import { useRef, useEffect, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import * as THREE from 'three';
import useInterface from '../../../hooks/useInterface';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio, useKTX2 } from '@react-three/drei';
import { usePositionalSound } from '../../../utils/audio';

const PROBABILITY_OF_ACTIVATION = 20;

const Radio = () => {
	const meshRef = useRef();
	const [isDetected, setIsDetected] = useState(false);
	const radio = useGame((state) => state.radio);
	const setRadio = useGame((state) => state.setRadio);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const mobileClick = useGame((state) => state.mobileClick);
	const { camera } = useThree();
	const setCursor = useInterface((state) => state.setCursor);
	const radioSoundRef = useRef();
	const radioSound = usePositionalSound('radio');

	const textureOn = useKTX2('/textures/bedroom/radio_on_etc1s.ktx2');
	const textureOff = useKTX2('/textures/bedroom/radio_off_etc1s.ktx2');

	// Ratio 209 x 715
	const planeWidth = 2.09;
	const planeHeight = 7.15;

	const [isDetectionActive, setIsDetectionActive] = useState(false);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const deaths = useGame((state) => state.deaths);
	const activeRadios = useGame((state) => state.activeRadios);
	const setActiveRadio = useGame((state) => state.setActiveRadios);
	const [randomRoomNumber, setRandomRoomNumber] = useState(
		Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION)
	);

	const generateRandomRoomNumber = useCallback(
		() => Math.floor(Math.random() * PROBABILITY_OF_ACTIVATION),
		[]
	);

	useEffect(() => {
		setRandomRoomNumber(generateRandomRoomNumber());
	}, [deaths, generateRandomRoomNumber]);

	useEffect(() => {
		if (playerPositionRoom === randomRoomNumber) {
			setIsDetectionActive(true);
		} else {
			setIsDetectionActive(false);
		}
	}, [playerPositionRoom, randomRoomNumber]);

	useEffect(() => {
		setRadio(activeRadios.includes(playerPositionRoom));
	}, [playerPositionRoom, activeRadios, setRadio]);

	useEffect(() => {
		if (radio) {
			radioSoundRef.current.play();
		} else {
			radioSoundRef.current.pause();
		}
	}, [radio]);

	useEffect(() => {
		const handleClick = () => {
			if (isDetected) {
				setRadio(!radio);
				setActiveRadio(playerPositionRoom);
			}
		};

		document.addEventListener('click', handleClick);

		return () => {
			document.removeEventListener('click', handleClick);
		};
	}, [isDetected]);

	return (
		<group position={[4.12, 0.927, 0.295]}>
			<DetectionZone
				position={[0.1, 0, -0.1]}
				scale={[0.5, 0.2, 0.5]}
				onDetect={() => {
					setCursor('power-radio');
					setIsDetected(true);
				}}
				onDetectEnd={() => {
					setCursor(null);
					setIsDetected(false);
				}}
				downward={true}
				name="radio"
				type="power"
			/>
			<mesh visible={false} position={[0, 0, -0.1]} ref={meshRef}>
				<boxGeometry args={[0.2, 0.2, 0.5]} />
			</mesh>
			<mesh scale={0.05} rotation={[Math.PI / 2, -Math.PI / 2, Math.PI]}>
				<planeGeometry args={[planeWidth, planeHeight]} />
				{radio ? (
					<meshBasicMaterial map={textureOn} />
				) : (
					<meshStandardMaterial map={textureOff} />
				)}
			</mesh>
			<PositionalAudio ref={radioSoundRef} {...radioSound} loop={true} />
		</group>
	);
};

export default Radio;
