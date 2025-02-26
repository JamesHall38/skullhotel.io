import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useGamepadControls from '../../../hooks/useGamepadControls';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio, useKTX2 } from '@react-three/drei';
import { usePositionalSound } from '../../../utils/audio';

const Radio = () => {
	const meshRef = useRef();
	const [isDetected, setIsDetected] = useState(false);
	const radio = useGame((state) => state.radio);
	const setRadio = useGame((state) => state.setRadio);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const mobileClick = useGame((state) => state.mobileClick);
	const setCursor = useInterface((state) => state.setCursor);
	const radioSoundRef = useRef();
	const radioSound = usePositionalSound('radio');
	const gamepadControls = useGamepadControls();
	const prevXButtonRef = useRef(false);

	const textureOn = useKTX2('/textures/bedroom/radio_on_etc1s.ktx2');
	const textureOff = useKTX2('/textures/bedroom/radio_off_etc1s.ktx2');

	// Ratio 209 x 715
	const planeWidth = 2.09;
	const planeHeight = 7.15;

	const playerPositionRoom = useGame((state) => state.playerPositionRoom);
	const activeRadios = useGame((state) => state.activeRadios);
	const setActiveRadio = useGame((state) => state.setActiveRadios);

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

	useFrame(() => {
		const xButtonPressed = gamepadControls().action;
		if (isDetected && xButtonPressed && !prevXButtonRef.current) {
			setRadio(!radio);
			setActiveRadio(playerPositionRoom);
		}
		prevXButtonRef.current = xButtonPressed;
	});

	useEffect(() => {
		if (isDetected && mobileClick) {
			setRadio(!radio);
			setActiveRadio(playerPositionRoom);
			setMobileClick(false);
		}
	}, [
		isDetected,
		mobileClick,
		playerPositionRoom,
		setActiveRadio,
		setMobileClick,
		setRadio,
		radio,
	]);

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
			<mesh
				onPointerDown={(e) => {
					if (e.button === 0) {
						setRadio(true);
						setActiveRadio(playerPositionRoom);
					}
				}}
				visible={false}
				position={[0, 0, -0.1]}
				ref={meshRef}
			>
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
