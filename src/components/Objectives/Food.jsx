import React, {
	useEffect,
	useMemo,
	useRef,
	useState,
	useCallback,
} from 'react';
import { useGLTF, useKTX2 } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import DetectionZone from '../DetectionZone';
import useGamepadControls from '../../hooks/useGamepadControls';
import useInterfaceStore from '../../hooks/useInterface';

export default function Food(props) {
	const group = useRef();
	const { nodes } = useGLTF('/models/objectives/food.glb');
	const bakedTexture = useKTX2('/textures/food/baked_food_etc1s.ktx2');
	const materialRef = useRef(null);
	const { camera } = useThree();
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const cleanedFoodRooms = useGame((state) => state.cleanedFoodRooms);
	const setCleanedFoodRoom = useGame((state) => state.setCleanedFoodRoom);
	const setCursor = useInterface((state) => state.setCursor);
	const setInterfaceObjectives = useInterface(
		(state) => state.setInterfaceObjectives
	);
	const tutorialObjectives = useInterface((state) => state.tutorialObjectives);
	const recentlyChangedObjectives = useInterface(
		(state) => state.recentlyChangedObjectives
	);
	const setTutorialObjectives = useInterface(
		(state) => state.setTutorialObjectives
	);
	const [isDetected, setIsDetected] = useState(false);
	const [isFading, setIsFading] = useState(false);
	const [isHidden, setIsHidden] = useState(false);
	const progressConditionsRef = useRef(null);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);

	const foodGroups = useMemo(
		() => [
			['Ramen', 'Burger', 'Pizza', 'Sushi'],
			['Hotdog', 'Chicken', 'Fruit', 'Steak'],
			['Bawl', 'Rat', 'Fish', 'Pig'],
			['Cat', 'Leg', 'Chest', 'Head'],
		],
		[]
	);

	const meshes = useMemo(() => foodGroups.flat(), [foodGroups]);

	const shuffleVersion = useGame((state) => state.shuffleVersion);
	const objectives = useInterfaceStore((state) => state.interfaceObjectives);

	const foodOptions = useMemo(() => {
		const map = { None: '' };
		meshes.forEach((k) => {
			map[k] = k;
		});
		return map;
	}, [meshes]);

	const { food: foodOverrideName } = useControls({
		food: { options: foodOptions, value: '' },
	});
	const doneObjectivesCount = useMemo(() => {
		const count = objectives?.reduce((acc, subArray) => {
			if (subArray.every(Boolean)) return acc + 1;
			return acc;
		}, 0);
		return count || 0;
	}, [objectives]);

	const getFoodGroup = useCallback(() => {
		const d = Math.min(doneObjectivesCount, 7);
		if (d < 2) return 1; // 0,1
		if (d < 4) return 2; // 2,3
		if (d < 6) return 3; // 4,5
		return 4; // 6,7
	}, [doneObjectivesCount]);

	const seededIndex = useCallback(
		(length, salt = '') => {
			const r = roomNumber ?? 0;
			const s = shuffleVersion ?? 0;
			const d = doneObjectivesCount ?? 0;
			const deaths = (() => {
				try {
					return useGame.getState().deaths || 0;
				} catch (e) {
					return 0;
				}
			})();
			const start = (() => {
				try {
					return useGame.getState().gameStartTime || 0;
				} catch (e) {
					return 0;
				}
			})();
			const str = `${salt}|${r}|${s}|${d}|${deaths}|${start}`;
			let h = 2166136261;
			for (let i = 0; i < str.length; i++) {
				h ^= str.charCodeAt(i);
				h = Math.imul(h, 16777619);
			}
			const idx = Math.abs(h) % Math.max(1, length);
			return idx;
		},
		[roomNumber, shuffleVersion, doneObjectivesCount]
	);

	const autoSelectedFood = useMemo(() => {
		const groupIndex = getFoodGroup() - 1;
		const groupArr = foodGroups[groupIndex] || [];

		const seenFoods = useGame.getState().seenFoods || {};
		const preferUnseen = (arr) => {
			const unseen = arr.filter((n) => !seenFoods[n]);
			return unseen.length > 0 ? unseen : arr;
		};

		const choose = (arr, salt) => arr[seededIndex(arr.length, salt)];
		return choose(preferUnseen(groupArr), `food-g${groupIndex}`);
	}, [seededIndex, foodGroups, getFoodGroup]);

	const selectedFood = useMemo(() => {
		if (foodOverrideName) {
			return foodOverrideName;
		}
		return autoSelectedFood;
	}, [roomNumber, foodOverrideName, autoSelectedFood]);

	useEffect(() => {
		if (!bakedTexture) return;
		bakedTexture.colorSpace = THREE.SRGBColorSpace;
		bakedTexture.flipY = false;
		bakedTexture.channel = 0;

		const material = new THREE.MeshStandardMaterial({
			map: bakedTexture,
			roughness: 1,
			metalness: 0,
		});
		materialRef.current = material;
	}, [bakedTexture]);

	const visiblePosition = [2.28, 0.615, 3.1];
	const hiddenPosition = [0, 1000, 0];

	const textureParts = [
		{
			name: 'baked',
			label: 'Base Textures',
			texture: bakedTexture,
			type: 'map',
			uvChannel: 0,
		},
	];

	const { loadedItems } = useProgressiveLoad(textureParts, 'Food');

	if (!materialRef.current) {
		materialRef.current = new THREE.MeshStandardMaterial({
			roughness: 1,
			metalness: 0,
		});
	}

	useEffect(() => {
		if (!materialRef.current) return;
		materialRef.current.transparent = true;
	}, []);

	useEffect(() => {
		const shouldBeHidden =
			(cleanedFoodRooms?.[roomNumber] && !isTutorialOpen) ||
			(isTutorialOpen && tutorialObjectives[3] === true);

		if (shouldBeHidden) {
			setIsHidden(true);
		} else {
			setIsHidden(false);
			setIsFading(false);
			if (materialRef.current) {
				materialRef.current.opacity = 1;
				materialRef.current.needsUpdate = true;
			}
		}
	}, [
		cleanedFoodRooms,
		roomNumber,
		isTutorialOpen,
		// , tutorialObjectives
	]);

	loadedItems.forEach((item) => {
		const texture = item.texture;
		if (!texture || !materialRef.current) return;
		if (item.name === 'baked') {
			texture.colorSpace = THREE.SRGBColorSpace;
		}
		texture.flipY = false;
		texture.channel = item.uvChannel;
		materialRef.current[item.type] = texture;
		materialRef.current.needsUpdate = true;
	});

	const handleDetection = useCallback(() => {
		if (isHidden || isFading) return;
		setCursor('clean-food');
		setIsDetected(true);
		progressConditionsRef.current = { isDetected: true };
	}, [setCursor, isHidden, isFading]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	useEffect(() => {
		return () => {
			try {
				if (useInterface.getState().cursor === 'clean-food') {
					setCursor(null);
				}
			} catch (e) {}
		};
	}, [setCursor]);

	useEffect(() => {
		let timeoutId = null;

		const handleProgressComplete = () => {
			const saved = progressConditionsRef.current;
			const currentCursor = useInterface.getState().cursor;
			if (saved && currentCursor === 'clean-food') {
				setCursor(null);
				setIsDetected(false);
				setIsFading(true);
				progressConditionsRef.current = null;

				// try {
				// 	if (areSoundsLoaded()) {
				// 		const a = getAudioInstance('pop');
				// 		if (a) {
				// 			a.currentTime = 0;
				// 			a.play && a.play();
				// 		}
				// 	}
				// } catch (e) {}

				timeoutId = setTimeout(() => {
					setInterfaceObjectives(3, roomNumber);
				}, 1000);

				if (tutorialObjectives[3] === false && !recentlyChangedObjectives[3]) {
					setTutorialObjectives([
						tutorialObjectives[0],
						tutorialObjectives[1],
						tutorialObjectives[2],
						true,
						tutorialObjectives[4],
					]);
				}

				const currentRoom = Object.values(useGame.getState().seedData)[
					roomNumber
				];
				if (currentRoom?.hideObjective === 'food') {
					useGame
						.getState()
						.checkObjectiveCompletion('food', roomNumber, camera);
				}

				try {
					useGame.getState().addSeenFood(selectedFood);
				} catch (e) {}
			}
		};

		document.addEventListener('progressComplete', handleProgressComplete);
		return () => {
			document.removeEventListener('progressComplete', handleProgressComplete);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [
		setCursor,
		// tutorialObjectives,
		recentlyChangedObjectives,
		setTutorialObjectives,
		setInterfaceObjectives,
		roomNumber,
		camera,
		selectedFood,
	]);

	useEffect(() => {
		if (deviceMode !== 'gamepad') return;

		const checkGamepad = () => {
			const gamepadControls = gamepadControlsRef();
			if (
				gamepadControls.action &&
				!wasActionPressedRef.current &&
				isDetected
			) {
				wasActionPressedRef.current = true;
				const event = new MouseEvent('mousedown', {
					bubbles: true,
					cancelable: true,
					button: 0,
				});
				document.dispatchEvent(event);
			} else if (!gamepadControls.action && wasActionPressedRef.current) {
				wasActionPressedRef.current = false;
				const event = new MouseEvent('mouseup', {
					bubbles: true,
					cancelable: true,
					button: 0,
				});
				document.dispatchEvent(event);
			}
		};

		const interval = setInterval(checkGamepad, 16);
		return () => clearInterval(interval);
	}, [deviceMode, gamepadControlsRef, isDetected]);

	useEffect(() => {
		if (!isFading || !materialRef.current) return;
		let raf;
		const step = () => {
			materialRef.current.opacity = Math.max(
				(materialRef.current.opacity ?? 1) - 0.05,
				0
			);
			materialRef.current.needsUpdate = true;
			if (materialRef.current.opacity > 0) {
				raf = requestAnimationFrame(step);
			} else {
				setCleanedFoodRoom(roomNumber, true);
				setIsFading(false);
				setIsHidden(true);
			}
		};
		raf = requestAnimationFrame(step);
		return () => raf && cancelAnimationFrame(raf);
	}, [isFading, roomNumber, setCleanedFoodRoom]);

	useEffect(() => {
		if (tutorialObjectives[3] === false && isTutorialOpen) {
			setIsHidden(false);
			setIsFading(false);
			if (materialRef.current) {
				materialRef.current.opacity = 1;
				materialRef.current.needsUpdate = true;
			}
		}
	}, [tutorialObjectives, isTutorialOpen]);

	if (isHidden) {
		return null;
	}

	return (
		<group ref={group} {...props} dispose={null}>
			{!isFading && !isHidden && (
				<DetectionZone
					position={[
						visiblePosition[0],
						visiblePosition[1],
						visiblePosition[2],
					]}
					scale={[0.5, 0.5, 0.5]}
					distance={1.5}
					onDetect={handleDetection}
					onDetectEnd={handleDetectionEnd}
					type="clean"
					name="food"
				/>
			)}
			{meshes
				.filter((name) => nodes?.[name]?.geometry)
				.map((name) => (
					<mesh
						key={name}
						name={name}
						// castShadow
						receiveShadow
						position={selectedFood === name ? visiblePosition : hiddenPosition}
						geometry={nodes[name].geometry}
						material={materialRef.current}
					/>
				))}
		</group>
	);
}

useGLTF.preload('/models/objectives/food.glb');
