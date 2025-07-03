import React, {
	useRef,
	useCallback,
	useEffect,
	useState,
	useMemo,
} from 'react';
import { useGLTF } from '@react-three/drei';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import DetectionZone from '../DetectionZone';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';

export default function Switches(props) {
	const roomLight = useGame((state) => state.roomLight);
	const setRoomLight = useGame((state) => state.setRoomLight);
	const bathroomLight = useGame((state) => state.bathroomLight);
	const setBathroomLight = useGame((state) => state.setBathroomLight);
	const mobileClick = useGame((state) => state.mobileClick);
	const setCursor = useInterface((state) => state.setCursor);
	const cursor = useInterface((state) => state.cursor);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const doneObjectives = useInterface((state) => state.interfaceObjectives);
	const deaths = useGame((state) => state.deaths);
	const doneObjectivesNumberRef = useRef(doneObjectives);
	const { nodes, materials } = useGLTF('/models/room/switchs.glb');
	const [soundsReady, setSoundsReady] = useState(false);
	const [bulbBurned, setBulbBurned] = useState(false);
	const switch1Ref = useRef();
	const switch2Ref = useRef();
	const wasClickProcessedRef = useRef(false);

	const switchOnSoundRef = useRef(null);
	const switchOffSoundRef = useRef(null);
	const neonSoundRef = useRef(null);
	const bulbSoundRef = useRef(null);

	const bathroomLightRef = useRef(bathroomLight);
	const roomLightRef = useRef(roomLight);

	const doneObjectivesNumber = useMemo(() => {
		const count = doneObjectives?.reduce((acc, subArray) => {
			if (subArray.every(Boolean)) {
				return acc + 1;
			}
			return acc;
		}, 0);
		return count;
	}, [doneObjectives]);

	useEffect(() => {
		doneObjectivesNumberRef.current = doneObjectivesNumber || 0;
	}, [doneObjectivesNumber]);

	useEffect(() => {
		setBulbBurned(false);
	}, [deaths]);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				switchOnSoundRef.current = getAudioInstance('switchOn');
				switchOffSoundRef.current = getAudioInstance('switchOff');
				neonSoundRef.current = getAudioInstance('neon');
				bulbSoundRef.current = getAudioInstance('bulb');
				if (
					switchOnSoundRef.current &&
					switchOffSoundRef.current &&
					neonSoundRef.current &&
					bulbSoundRef.current
				) {
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (switchOnSoundRef.current) {
				switchOnSoundRef.current.pause();
				switchOnSoundRef.current.currentTime = 0;
			}
			if (switchOffSoundRef.current) {
				switchOffSoundRef.current.pause();
				switchOffSoundRef.current.currentTime = 0;
			}
			if (neonSoundRef.current) {
				neonSoundRef.current.pause();
				neonSoundRef.current.currentTime = 0;
			}
		};
	}, []);

	useEffect(() => {
		bathroomLightRef.current = bathroomLight;
	}, [bathroomLight]);

	useEffect(() => {
		roomLightRef.current = roomLight;
	}, [roomLight]);

	useEffect(() => {
		if (!soundsReady) return;

		if (mobileClick) {
			if (cursor && cursor.includes('switch2')) {
				const newBathroomLight = !bathroomLightRef.current;
				setBathroomLight(newBathroomLight);
				if (newBathroomLight) {
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play().catch(() => {});
					neonSoundRef.current.currentTime = 0;
					neonSoundRef.current.play().catch(() => {});
				} else {
					switchOffSoundRef.current.currentTime = 0;
					switchOffSoundRef.current.play().catch(() => {});
					neonSoundRef.current.pause();
					neonSoundRef.current.currentTime = 0;
				}
			}
			if (cursor && cursor.includes('switch1')) {
				const newRoomLight = !roomLightRef.current;
				setRoomLight(newRoomLight);
				if (newRoomLight) {
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play().catch(() => {});
				} else {
					switchOffSoundRef.current.currentTime = 0;
					switchOffSoundRef.current.play().catch(() => {});
				}
			}
		}
	}, [mobileClick, cursor, setBathroomLight, setRoomLight, soundsReady]);

	useEffect(() => {
		if (!soundsReady) return;

		const handleClickSwitch1 = (e) => {
			if (e.button !== 0) return;

			if (wasClickProcessedRef.current) {
				return;
			}

			if (cursor && cursor.includes('switch2')) {
				wasClickProcessedRef.current = true;

				setTimeout(() => {
					wasClickProcessedRef.current = false;
				}, 300);

				setBathroomLight(!bathroomLight);
				if (!bathroomLight) {
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play().catch(() => {});
					neonSoundRef.current.currentTime = 0;
					neonSoundRef.current.play().catch(() => {});
				} else {
					switchOffSoundRef.current.currentTime = 0;
					switchOffSoundRef.current.play().catch(() => {});
					neonSoundRef.current.pause();
					neonSoundRef.current.currentTime = 0;
				}
			}
		};

		const handleClickSwitch2 = (e) => {
			if (e.button !== 0) return;

			if (wasClickProcessedRef.current) {
				return;
			}

			if (cursor && cursor.includes('switch1')) {
				wasClickProcessedRef.current = true;

				setTimeout(() => {
					wasClickProcessedRef.current = false;
				}, 300);

				const totalSteps = 6;
				const currentStep = Math.floor(
					(doneObjectivesNumberRef.current / (roomCount / 2)) * totalSteps
				);

				if (currentStep > totalSteps / 2 && !roomLight && !bulbBurned) {
					setRoomLight(true);
					switchOnSoundRef.current.currentTime = 0;
					switchOnSoundRef.current.play().catch(() => {});
					setBulbBurned(true);

					setTimeout(() => {
						setRoomLight(false);
						bulbSoundRef.current.currentTime = 0;
						bulbSoundRef.current.play().catch(() => {});
					}, 500);
				} else {
					if (!bulbBurned) {
						setRoomLight(!roomLight);
					}
					if (!roomLight) {
						switchOnSoundRef.current.currentTime = 0;
						switchOnSoundRef.current.play().catch(() => {});
					} else {
						switchOffSoundRef.current.currentTime = 0;
						switchOffSoundRef.current.play().catch(() => {});
					}
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
		soundsReady,
		cursor,
		doneObjectivesNumber,
		roomCount,
		bulbBurned,
	]);

	const handleDetectionSwitch1 = useCallback(() => {
		setCursor('light-switch1');
	}, [setCursor]);

	const handleDetectionSwitch2 = useCallback(() => {
		setCursor('light-switch2');
	}, [setCursor]);

	const handleDetectionEnd1 = useCallback(() => {
		setCursor(null);
	}, [setCursor]);

	const handleDetectionEnd2 = useCallback(() => {
		setCursor(null);
	}, [setCursor]);

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
			<DetectionZone
				position={[1.889, 1.031, -4.67]}
				scale={[0.2, 0.2, 0.05]}
				distance={1.5}
				onDetect={handleDetectionSwitch1}
				onDetectEnd={handleDetectionEnd1}
				name="switch1"
				type="light"
			/>
			<mesh
				ref={switch2Ref}
				castShadow
				receiveShadow
				geometry={nodes.Switch2.geometry}
				material={materials.White}
				position={[1.448, 1.031, -3.309]}
			/>
			<DetectionZone
				position={[1.448, 1.031, -3.309]}
				scale={0.2}
				distance={1.5}
				onDetect={handleDetectionSwitch2}
				onDetectEnd={handleDetectionEnd2}
				name="switch2"
				type="light"
			/>
		</group>
	);
}
