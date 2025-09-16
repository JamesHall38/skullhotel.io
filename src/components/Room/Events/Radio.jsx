import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import useGame from '../../../hooks/useGame';
import useInterface from '../../../hooks/useInterface';
import useGamepadControls from '../../../hooks/useGamepadControls';
import DetectionZone from '../../DetectionZone';
import { PositionalAudio, useKTX2 } from '@react-three/drei';
import { usePositionalSound } from '../../../utils/audio';
import useLight from '../../../hooks/useLight';

const Radio = () => {
	const meshRef = useRef();
	const [isDetected, setIsDetected] = useState(false);
	const radio = useGame((state) => state.radio);
	const setRadio = useGame((state) => state.setRadio);
	const isMobile = useGame((state) => state.isMobile);
	const setMobileClick = useGame((state) => state.setMobileClick);
	const mobileClick = useGame((state) => state.mobileClick);
	const setCursor = useInterface((state) => state.setCursor);
	const cursor = useInterface((state) => state.cursor);
	const radioSoundRef = useRef();
	const hideSoundRef = useRef();
	const radioSound = usePositionalSound('radio');
	const hideSound = usePositionalSound('hide');
	const gamepadControls = useGamepadControls();
	const prevXButtonRef = useRef(false);
	const setRadioLight = useLight((state) => state.setRadioLight);

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

	useEffect(() => {}, [radio, playHideSound]);

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
			setRadioLight('#fff0be', 0.1);

			if (playHideSound) {
				hideSoundRef.current.play();
			} else {
				hideSoundRef.current.pause();
			}
		} else {
			radioSoundRef.current.pause();
			hideSoundRef.current.pause();
			setRadioLight('#fff0be', 0);
		}
	}, [radio, playHideSound, setRadioLight]);

	useFrame(() => {
		const xButtonPressed = gamepadControls().action;
		if (
			isDetected &&
			xButtonPressed &&
			!prevXButtonRef.current &&
			cursor === 'power-radio'
		) {
			setRadio(!radio);
			setActiveRadio(playerPositionRoom);
		}
		prevXButtonRef.current = xButtonPressed;
	});

	useEffect(() => {
		if (isDetected && mobileClick && cursor === 'power-radio') {
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
		cursor,
	]);

	useEffect(() => {
		const handleMouseDown = (e) => {
			if (
				e.button === 0 &&
				cursor === 'power-radio' &&
				!isMobile &&
				isDetected
			) {
				setRadio(!radio);
				setActiveRadio(playerPositionRoom);
			}
		};

		window.addEventListener('mousedown', handleMouseDown);

		return () => {
			window.removeEventListener('mousedown', handleMouseDown);
		};
	}, [cursor, isDetected, radio, setRadio, setActiveRadio, playerPositionRoom]);

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
			<PositionalAudio
				ref={radioSoundRef}
				{...radioSound}
				distance={2}
				loop={true}
			/>
			<PositionalAudio ref={hideSoundRef} {...hideSound} loop={true} />
		</group>
	);
};

export default Radio;
