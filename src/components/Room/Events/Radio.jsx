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
	const hideSoundRef = useRef();
	const radioSound = usePositionalSound('radio');
	const hideSound = usePositionalSound('hide');
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
	const activeRaids = useGame((state) => state.activeRaids);
	const [playHideSound, setPlayHideSound] = useState(false);
	const knockedRooms = useGame((state) => state.knockedRooms);

	useEffect(() => {
		setRadio(activeRadios.includes(playerPositionRoom));
	}, [playerPositionRoom, activeRadios, setRadio]);

	// Determine if we should play the hide sound
	useEffect(() => {
		if (radio && activeRaids.includes(playerPositionRoom)) {
			setPlayHideSound(true);
		} else {
			setPlayHideSound(false);
		}
	}, [radio, activeRaids, playerPositionRoom]);

	useEffect(() => {
		if (radio) {
			radioSoundRef.current.play();
			radioSoundRef.current.volume = 1;

			if (playHideSound) {
				hideSoundRef.current.play();
			} else {
				hideSoundRef.current.pause();
			}
		} else {
			radioSoundRef.current.pause();
			hideSoundRef.current.pause();
		}
	}, [radio, playHideSound]);

	useFrame(() => {
		const xButtonPressed = gamepadControls().action;
		if (isDetected && xButtonPressed && !prevXButtonRef.current) {
			const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
			setRadio(!radio);
			setActiveRadio(playerPositionRoom);
		}
		prevXButtonRef.current = xButtonPressed;
	});

	useEffect(() => {
		if (isDetected && mobileClick) {
			const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
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
		knockedRooms,
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
						const canTriggerRaid = !knockedRooms.includes(playerPositionRoom);
						setRadio(!radio);
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
			<PositionalAudio ref={hideSoundRef} {...hideSound} loop={true} />
		</group>
	);
};

export default Radio;
