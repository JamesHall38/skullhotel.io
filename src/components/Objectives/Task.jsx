import React, {
	useMemo,
	useRef,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { getKTX2Loader } from '@/utils/getKTX2Loader';
import { useControls } from 'leva';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';
import DetectionZone from '../DetectionZone';
import useGamepadControls from '../../hooks/useGamepadControls';
import VolumeAwarePositionalAudio from '../VolumeAwarePositionalAudio';
import useDoor from '../../hooks/useDoor';
import useInterfaceStore from '../../hooks/useInterface';
import useHiding from '../../hooks/useHiding';
import useGameplaySettings from '../../hooks/useGameplaySettings';
import * as THREE from 'three';
import usePositionalSound from '../../hooks/usePositionalSound';
import { getAudioInstance, areSoundsLoaded } from '../../utils/audio';
import {
	VISIBLE_POS,
	HIDDEN_POS,
	DEFAULT_DETECTION_SCALE,
	DETECTION_DISTANCE,
	ROPE_DROP_OFFSET,
	ROPE_DROP_SPEED,
	TASK_TRANSFORMS,
	DETECTION_FALLBACKS,
} from './taskConfig';

export default function Task(props) {
	const group = useRef();
	const { gl } = useThree();

	const { nodes, materials } = useGLTF(
		'/models/objectives/tasks.glb',
		undefined,
		undefined,
		(loader) => {
			const ktx = getKTX2Loader(gl);
			loader.setKTX2Loader(ktx);
		}
	);

	const { camera } = useThree();
	const roomNumber = useGame((state) => state.playerPositionRoom);
	const roomCount = useGameplaySettings((state) => state.roomCount);
	const cleanedTaskRooms = useGame((state) => state.cleanedTaskRooms);
	const setCleanedTaskRoom = useGame((state) => state.setCleanedTaskRoom);
	const setCursor = useInterface((state) => state.setCursor);
	const [isDetected, setIsDetected] = useState(false);
	const [isFading, setIsFading] = useState(false);
	const [isHidden, setIsHidden] = useState(false);
	const progressConditionsRef = useRef(null);
	const progressCursorRef = useRef(null);
	const deviceMode = useGame((state) => state.deviceMode);
	const gamepadControlsRef = useGamepadControls();
	const wasActionPressedRef = useRef(false);
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
	const isTutorialOpen = useGame((state) => state.isTutorialOpen);

	useEffect(() => {
		try {
			useGame.getState().setMannequinTaskStatus(null);
		} catch (e) {}
	}, [roomNumber]);

	const blackBloodTexture = useMemo(() => {
		const tex = materials?.BloodMat?.map || null;
		if (tex) {
			tex.colorSpace = THREE.SRGBColorSpace;
		}
		return tex;
	}, [materials]);

	const blackBloodMaterial = useMemo(() => {
		const mat = new THREE.MeshBasicMaterial({
			map: blackBloodTexture || undefined,
			color: 0x000000,
			transparent: true,
		});
		if (materials?.BloodMat) {
			if (materials.BloodMat.alphaTest != null)
				mat.alphaTest = materials.BloodMat.alphaTest;
			if (materials.BloodMat.side != null) mat.side = materials.BloodMat.side;
			if (materials.BloodMat.depthWrite != null)
				mat.depthWrite = materials.BloodMat.depthWrite;
			if (materials.BloodMat.depthTest != null)
				mat.depthTest = materials.BloodMat.depthTest;
		}
		return mat;
	}, [blackBloodTexture, materials]);

	const bloodWaterMaterial = useMemo(() => {
		const base =
			materials?.Water && typeof materials.Water.clone === 'function'
				? materials.Water.clone()
				: new THREE.MeshStandardMaterial({ transparent: true, opacity: 1 });
		const blood = materials?.BloodMat;
		if (blood) {
			if (blood.color && base.color) {
				base.color.copy(blood.color);
			} else if (base.color) {
				base.color.set(0x6a0000);
			}
			if (typeof blood.roughness === 'number') {
				base.roughness = blood.roughness;
			}
		}
		base.needsUpdate = true;
		return base;
	}, [materials]);

	const groups = useMemo(() => {
		return [
			// Single blood splatters and prints
			{
				key: 'FloorSplatter',
				items: [
					{
						geometry: nodes?.FloorSplatter?.geometry,
						material: blackBloodMaterial,
					},
				],
			},
			{
				key: 'BathSplatter',
				items: [
					{
						geometry: nodes?.BathSplatter?.geometry,
						material: blackBloodMaterial,
					},
				],
			},
			{
				key: 'MirrorSplatter',
				items: [
					{
						geometry: nodes?.MirrorSplatter?.geometry,
						material: blackBloodMaterial,
					},
				],
			},
			{
				key: 'Handprint',
				items: [
					{
						geometry: nodes?.Handprint?.geometry,
						material: materials?.BloodMat,
					},
				],
			},
			// Footprints
			{
				key: 'Footprints',
				items: [
					{
						geometry: nodes?.Footprint1?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.Footprint2?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.Footprint3?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.Footprint4?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.Footprint5?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.Footprint6?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.BathWater?.geometry,
						material: bloodWaterMaterial,
					},
				],
			},
			// Pentagram group
			{
				key: 'Pentagram',
				items: [
					{
						geometry: nodes?.Pentagram?.geometry,
						material: materials?.BloodMat,
					},
					{
						geometry: nodes?.PentagramSkull?.geometry,
						material: materials?.FleshSkull,
					},
				],
			},
			// Waters
			{
				key: 'BathWater',
				items: [
					{ geometry: nodes?.BathWater?.geometry, material: materials?.Water },
					{
						geometry: nodes?.BathWaterFaucet?.geometry,
						material: materials?.Water,
					},
				],
			},
			{
				key: 'SinkWater',
				items: [
					{ geometry: nodes?.SinkWater?.geometry, material: materials?.Water },
				],
			},
			// Ropes
			{
				key: 'Rope',
				items: [{ geometry: nodes?.Rope?.geometry, material: materials?.Rope }],
			},
			// Hangman
			{
				key: 'Hangman',
				items: [{ geometry: nodes?.Rope?.geometry, material: materials?.Rope }],
			},
			{
				key: 'ToiletCloged',
				items: [
					{
						geometry: nodes?.ToiletCloged?.geometry,
						material: materials?.Material,
					},
				],
			},
			{
				key: 'ToiletPaper',
				items: [
					{
						geometry: nodes?.ToiletPaper?.geometry,
						material: materials?.Material,
					},
				],
			},
			// Mannequin
			// {
			// 	key: 'MannequinSkull',
			// 	items: [
			// 		{
			// 			geometry: nodes?.MannequinSkull?.geometry,
			// 			material: materials?.FleshSkull,
			// 		},
			// 	],
			// },
			// Toilets group
			{
				key: 'Toilets',
				items: [
					{
						geometry: nodes?.ToiletsBones?.geometry,
						material: materials?.FleshAnimal,
					},
					{
						geometry: nodes?.ToiletsFlesh?.geometry,
						material: materials?.Flesh,
					},
				],
			},
			{
				key: 'ToiletsSkull',
				items: [
					{
						geometry: nodes?.ToiletsSkull?.geometry,
						material: materials?.FleshSkull,
					},
				],
			},
			// Sink group
			{
				key: 'Sink',
				items: [
					{
						geometry: nodes?.SinkBones?.geometry,
						material: materials?.FleshAnimal,
					},
					{ geometry: nodes?.SinkFlesh?.geometry, material: materials?.Flesh },
				],
			},
			{
				key: 'SinkSkull',
				items: [
					{
						geometry: nodes?.SinkSkull?.geometry,
						material: materials?.FleshSkull,
					},
				],
			},
			// Bath group
			{
				key: 'Bath',
				items: [
					{
						geometry: nodes?.BathBones?.geometry,
						material: materials?.FleshAnimal,
					},
					{ geometry: nodes?.BathFlesh?.geometry, material: materials?.Flesh },
				],
			},
			{
				key: 'BathSkull',
				items: [
					{
						geometry: nodes?.BathSkull?.geometry,
						material: materials?.FleshSkull,
					},
				],
			},
			// Spider variants
			{
				key: 'Spider1',
				items: [
					{
						geometry: nodes?.Spider?.geometry,
						material: materials?.SpiderMat,
					},
				],
			},
			// {
			// 	key: 'Spider2',
			// 	items: [
			// 		{
			// 			geometry: nodes?.Spider?.geometry,
			// 			material: materials?.SpiderMat,
			// 		},
			// 	],
			// },
			{
				key: 'Spider3',
				items: [
					{
						geometry: nodes?.Spider?.geometry,
						material: materials?.SpiderMat,
					},
				],
			},
		];
	}, [nodes, materials]);

	const options = useMemo(() => groups.map((g) => g.key), [groups]);

	const taskOptions = useMemo(() => {
		const map = { None: '' };
		options.forEach((k) => {
			map[k] = k;
		});
		return map;
	}, [options]);

	const { task: taskOverrideKey } = useControls({
		task: { options: taskOptions, value: '' },
	});

	const specialTransforms = useMemo(() => TASK_TRANSFORMS, []);

	const detectionPositions = useMemo(() => {
		const map = {};
		options.forEach((k) => {
			const conf = TASK_TRANSFORMS[k];
			if (conf && conf.detectionPosition) {
				map[k] = conf.detectionPosition;
				return;
			}
			if (DETECTION_FALLBACKS[k]) {
				map[k] = DETECTION_FALLBACKS[k];
			}
		});
		return map;
	}, [options]);

	const visiblePosition = VISIBLE_POS;
	const hiddenPosition = HIDDEN_POS;
	const initialLoadPosition = [14.5, 0, 14.5];

	const shuffleVersion = useGame((state) => state.shuffleVersion);
	const objectives = useInterfaceStore((state) => state.interfaceObjectives);
	const doneObjectivesCount = useMemo(() => {
		const count = objectives?.reduce((acc, subArray) => {
			if (subArray.every(Boolean)) return acc + 1;
			return acc;
		}, 0);
		return count || 0;
	}, [objectives]);

	const getTaskGroup = useCallback(() => {
		const d = Math.min(doneObjectivesCount, 7);
		if (d < 2) return 1; // 0,1
		if (d < 6) return 2; // 2..5
		return 3; // 6,7
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

	const autoSelectedTask = useMemo(() => {
		const group = getTaskGroup();

		const group1Keys = [
			'FloorSplatter',
			'BathSplatter',
			'MirrorSplatter',
			'ToiletPaper',
			'ToiletCloged',
			'BathWater',
			'SinkWater',
		];

		const group2Keys = [
			'Handprint',
			'Footprints',
			'Pentagram',
			'Rope',
			'Hangman',
			// 'MannequinSkull',
			'ToiletsSkull',
			'SinkSkull',
			'BathSkull',
			'Spider1',
			// 'Spider2',
			'Spider3',
		];

		const group3Keys = options.filter(
			(key) => ![...group1Keys, ...group2Keys].includes(key)
		);

		const seenTasks = useGame.getState().seenTasks || {};
		const preferUnseen = (arr) => {
			const unseen = arr.filter((n) => !seenTasks[n]);
			return unseen.length > 0 ? unseen : arr;
		};

		const choose = (arr, salt) => arr[seededIndex(arr.length, salt)];
		if (group === 1) return choose(preferUnseen(group1Keys), 'task-g1');
		if (group === 2) return choose(preferUnseen(group2Keys), 'task-g2');
		return choose(preferUnseen(group3Keys), 'task-g3');
	}, [seededIndex, options, getTaskGroup]);

	const computedTask = useMemo(() => {
		if (isTutorialOpen) {
			return 'FloorSplatter';
		}
		if (taskOverrideKey) {
			return taskOverrideKey;
		}
		return autoSelectedTask;
	}, [taskOverrideKey, autoSelectedTask, isTutorialOpen]);

	const [selectedTask, setSelectedTask] = useState(computedTask);
	const computedTaskRef = useRef(computedTask);

	useEffect(() => {
		computedTaskRef.current = computedTask;
	}, [computedTask]);

	useEffect(() => {
		setSelectedTask(computedTaskRef.current);
	}, [roomNumber, isTutorialOpen]);

	const detectionZonePosition = useMemo(() => {
		if (selectedTask && specialTransforms[selectedTask]) {
			const conf = specialTransforms[selectedTask];
			return conf.detectionPosition || conf.position || visiblePosition;
		}
		return detectionPositions[selectedTask] ?? visiblePosition;
	}, [selectedTask, specialTransforms, detectionPositions]);

	const detectionZoneScale = useMemo(() => {
		const s = specialTransforms?.[selectedTask]?.detectionScale;
		if (Array.isArray(s) && s.length === 3) return s;
		return DEFAULT_DETECTION_SCALE;
	}, [selectedTask, specialTransforms]);

	const bathroomDoors = useDoor((state) => state.bathroomDoors);
	const bathroomCurtains = useDoor((state) => state.bathroomCurtains);
	const isPlayerHidden = useHiding((state) => state.isPlayerHidden);
	const ropeDropYRef = useRef(null);
	const ropeHasDroppedRef = useRef(false);
	const ropeDropRafRef = useRef(null);
	const ropeLogCounterRef = useRef(0);

	const fliesSoundRef = useRef();
	const faucetSoundRef = useRef();
	const fliesFadingRef = useRef(false);
	const faucetFadingRef = useRef(false);

	const AUDIO_FADE_DURATION_MS = 1000;
	const AUDIO_FADE_INTERVAL_MS = 30;
	const AUDIO_FADE_STEPS = AUDIO_FADE_DURATION_MS / AUDIO_FADE_INTERVAL_MS;
	const AUDIO_FADE_STEP_SIZE = 1 / AUDIO_FADE_STEPS;

	// Non-positional HTML audio refs
	const cleaningHtmlRef = useRef(null);
	const closingFaucetHtmlRef = useRef(null);

	const fliesSound = usePositionalSound('flies');
	const faucetSound = usePositionalSound('faucet');

	useEffect(() => {
		const setup = () => {
			if (areSoundsLoaded()) {
				try {
					const cleaning = getAudioInstance('cleaning');
					if (cleaning) {
						cleaningHtmlRef.current = cleaning;
					}
					const closing = getAudioInstance('closingFaucet');
					if (closing) {
						closingFaucetHtmlRef.current = closing;
					}
				} catch (e) {}
			} else {
				setTimeout(setup, 100);
			}
		};
		setup();
		return () => {};
	}, []);

	useEffect(() => {
		if (selectedTask === 'Rope' && !isHidden) {
			const baseY = specialTransforms?.Rope?.position?.[1] ?? 0;
			ropeDropYRef.current = baseY + ROPE_DROP_OFFSET;
			ropeHasDroppedRef.current = false;
			ropeLogCounterRef.current = 0;
			if (movingGroupRef.current && movingGroupRef.current.position) {
				const p = specialTransforms?.Rope?.position ?? [0, 0, 0];
				movingGroupRef.current.position.set(p[0], ropeDropYRef.current, p[2]);
			}
		}
		return () => {
			if (ropeDropRafRef.current) cancelAnimationFrame(ropeDropRafRef.current);
			ropeDropRafRef.current = null;
		};
	}, [selectedTask, isHidden, specialTransforms, roomNumber]);

	useEffect(() => {
		if (selectedTask !== 'Rope') return;
		const isOpen = !!bathroomDoors?.[roomNumber];
		if (isOpen && !ropeHasDroppedRef.current && ropeDropYRef.current != null) {
			const baseY = specialTransforms?.Rope?.position?.[1] ?? 0;
			const dropStep = () => {
				const currentY = ropeDropYRef.current;
				const nextY = Math.max(baseY, currentY - ROPE_DROP_SPEED);
				ropeDropYRef.current = nextY;
				if (movingGroupRef.current && movingGroupRef.current.position) {
					movingGroupRef.current.position.y = nextY;
				}
				if (nextY > baseY) {
					ropeDropRafRef.current = requestAnimationFrame(dropStep);
				} else {
					ropeHasDroppedRef.current = true;
					ropeDropRafRef.current = null;
				}
			};
			ropeDropRafRef.current = requestAnimationFrame(dropStep);
		}
		return () => {
			if (ropeDropRafRef.current) cancelAnimationFrame(ropeDropRafRef.current);
			ropeDropRafRef.current = null;
		};
	}, [bathroomDoors, roomNumber, selectedTask, specialTransforms]);

	useEffect(() => {
		let interval;
		const updateAudioGating = () => {
			const isBottomRow = roomNumber >= (roomCount || 0) / 2;
			const CORRIDOR_LENGTH = 5.95;
			const idxInRow = isBottomRow
				? roomNumber - Math.floor((roomCount || 0) / 2)
				: roomNumber;
			const OFFSET_X = 7.5;
			const splitX = isBottomRow
				? OFFSET_X - CORRIDOR_LENGTH - idxInRow * CORRIDOR_LENGTH
				: -(OFFSET_X - 5.91 + idxInRow * CORRIDOR_LENGTH);
			const wallX = splitX;
			const camX = camera.position.x;
			const camZ = camera.position.z;
			const inRoomZ = Math.abs(camZ) <= 4.5 && Math.abs(camZ) > 2;
			const playerInBathroomX = isBottomRow ? camX > wallX : camX < wallX;
			const playerInRoomCorridor = Math.abs(camZ) > 1.4 && Math.abs(camZ) < 4.4;
			const curtainOpen = !!bathroomCurtains?.[roomNumber];
			const doorOpen = !!bathroomDoors?.[roomNumber];

			const bathCondition =
				inRoomZ && playerInBathroomX && (curtainOpen || isPlayerHidden);
			const sinkLikeCondition = inRoomZ && playerInBathroomX;

			const faucetAllowed =
				!isHidden &&
				!isFading &&
				((selectedTask === 'BathWater' && bathCondition) ||
					(selectedTask === 'SinkWater' && sinkLikeCondition));
			if (faucetSoundRef.current) {
				const a = faucetSoundRef.current;
				a.loop = true;
				if (faucetAllowed) {
					faucetFadingRef.current = false;
					if (!a.isPlaying && a.play) {
						a.play();
						if (a.setRefDistance) {
							a.setRefDistance(0.01);
							let dist = 0.01;
							const fadeIn = setInterval(() => {
								dist += AUDIO_FADE_STEP_SIZE;
								if (dist >= 1) {
									dist = 1;
									clearInterval(fadeIn);
								}
								if (a.setRefDistance) a.setRefDistance(dist);
							}, AUDIO_FADE_INTERVAL_MS);
						}
					}
				} else if (a.isPlaying && a.stop && !faucetFadingRef.current) {
					faucetFadingRef.current = true;
					if (a.setRefDistance) {
						let dist = 1;
						const fadeOut = setInterval(() => {
							dist -= AUDIO_FADE_STEP_SIZE;
							if (dist <= 0.01) {
								dist = 0.01;
								clearInterval(fadeOut);
								if (a.stop) a.stop();
								faucetFadingRef.current = false;
							}
							if (a.setRefDistance) a.setRefDistance(dist);
						}, AUDIO_FADE_INTERVAL_MS);
					} else {
						a.stop();
					}
				}
			}

			const fliesAllowed =
				!isHidden &&
				!isFading &&
				((selectedTask === 'Bath' && bathCondition) ||
					((selectedTask === 'Sink' || selectedTask === 'Toilets') &&
						sinkLikeCondition));
			if (fliesSoundRef.current) {
				const a = fliesSoundRef.current;
				a.loop = true;
				if (fliesAllowed) {
					fliesFadingRef.current = false;
					if (!a.isPlaying && a.play) {
						a.play();
						if (a.setRefDistance) {
							a.setRefDistance(0.01);
							let dist = 0.01;
							const fadeIn = setInterval(() => {
								dist += AUDIO_FADE_STEP_SIZE;
								if (dist >= 1) {
									dist = 1;
									clearInterval(fadeIn);
								}
								if (a.setRefDistance) a.setRefDistance(dist);
							}, AUDIO_FADE_INTERVAL_MS);
						}
					}
				} else if (a.isPlaying && a.stop && !fliesFadingRef.current) {
					fliesFadingRef.current = true;
					if (a.setRefDistance) {
						let dist = 1;
						const fadeOut = setInterval(() => {
							dist -= AUDIO_FADE_STEP_SIZE;
							if (dist <= 0.01) {
								dist = 0.01;
								clearInterval(fadeOut);
								if (a.stop) a.stop();
								fliesFadingRef.current = false;
							}
							if (a.setRefDistance) a.setRefDistance(dist);
						}, AUDIO_FADE_INTERVAL_MS);
					} else {
						a.stop();
					}
				}
			}
		};

		interval = setInterval(updateAudioGating, 100);
		return () => {
			clearInterval(interval);
		};
	}, [
		selectedTask,
		isHidden,
		isFading,
		roomNumber,
		roomCount,
		camera,
		bathroomCurtains,
		bathroomDoors,
		isPlayerHidden,
	]);

	useEffect(() => {
		try {
			if (!isHidden && selectedTask === 'MannequinSkull') {
				useGame.getState().setMannequinTaskStatus('skull_selected');
			} else if (!isHidden && selectedTask === 'Hangman') {
				useGame.getState().setMannequinTaskStatus('hangman_selected');
			}
		} catch (e) {}
	}, [selectedTask, isHidden]);

	const movingGroupRef = useRef();
	const setShakeIntensity = useGame((state) => state.setShakeIntensity);
	const shakeIntensity = useGame((state) => state.shakeIntensity);

	const progressiveItems = useMemo(
		() => [
			{
				name: 'tasks',
				label: 'Tasks Model',
				path: '/models/objectives/tasks.glb',
			},
		],
		[]
	);

	const { isLoading } = useProgressiveLoad(progressiveItems, 'Tasks');

	const originalMaterialPropsRef = useRef(new WeakMap());

	useEffect(() => {
		groups.forEach(({ items }) => {
			items.forEach((item) => {
				const m = item.material;
				if (m && !originalMaterialPropsRef.current.has(m)) {
					const isWater = m === materials?.Water;
					originalMaterialPropsRef.current.set(m, {
						opacity:
							isWater && typeof m.opacity === 'number' ? m.opacity : undefined,
						transparent: m.transparent,
					});
				}
			});
		});
	}, [groups]);

	useEffect(() => {
		const shouldBeHidden =
			(cleanedTaskRooms?.[roomNumber] && !isTutorialOpen) ||
			(isTutorialOpen && tutorialObjectives[4] === true);

		if (shouldBeHidden) {
			setIsHidden(true);
			setIsFading(false);
		} else {
			setIsHidden(false);
			setIsFading(false);
			groups.forEach(({ items }) => {
				items.forEach((item) => {
					const m = item.material;
					if (m) {
						const original = originalMaterialPropsRef.current.get(m);
						if (original) {
							if (typeof original.opacity === 'number') {
								m.opacity = original.opacity;
							} else {
								m.opacity = 1;
							}
							m.transparent = original.transparent;
						} else {
							m.opacity = 1;
						}
						m.needsUpdate = true;
					}
				});
			});
		}
	}, [
		cleanedTaskRooms,
		roomNumber,
		groups,
		isTutorialOpen,
		// tutorialObjectives,
	]);

	useEffect(() => {
		if (isHidden) {
			if (fliesSoundRef.current) {
				try {
					const a = fliesSoundRef.current;
					if (a.isPlaying && a.stop) {
						a.stop();
					}
					if (a.gain && a.gain.gain) {
						a.gain.gain.value = 0;
					}
				} catch (e) {}
			}

			if (faucetSoundRef.current) {
				try {
					const a = faucetSoundRef.current;
					if (a.isPlaying && a.stop) {
						a.stop();
					}
					if (a.gain && a.gain.gain) {
						a.gain.gain.value = 0;
					}
				} catch (e) {}
			}
		}
	}, [isHidden]);

	useEffect(() => {
		return () => {
			if (fliesSoundRef.current) {
				try {
					const a = fliesSoundRef.current;
					if (a.isPlaying && a.stop) {
						a.stop();
					}
				} catch (e) {}
			}

			if (faucetSoundRef.current) {
				try {
					const a = faucetSoundRef.current;
					if (a.isPlaying && a.stop) {
						a.stop();
					}
				} catch (e) {}
			}
		};
	}, [selectedTask, roomNumber]);

	useEffect(() => {
		if (tutorialObjectives[4] === false && isTutorialOpen) {
			setIsHidden(false);
			setIsFading(false);
		}
	}, [tutorialObjectives, isTutorialOpen]);

	const handleDetection = useCallback(() => {
		if (isHidden || isFading) return;
		const cursorType = selectedTask?.startsWith('Spider')
			? 'clean-spider'
			: 'clean-task';
		setCursor(cursorType);
		setIsDetected(true);
		progressConditionsRef.current = { isDetected: true };
		progressCursorRef.current = cursorType;
	}, [setCursor, isHidden, isFading, selectedTask]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	useEffect(() => {
		return () => {
			try {
				const c = useInterface.getState().cursor;
				if (typeof c === 'string' && c.startsWith('clean')) {
					setCursor(null);
				}
			} catch (e) {}
		};
	}, [setCursor]);

	useEffect(() => {
		const handleProgressComplete = () => {
			const saved = progressConditionsRef.current;
			const currentCursor = useInterface.getState().cursor;
			if (
				saved &&
				typeof currentCursor === 'string' &&
				currentCursor.startsWith('clean') &&
				currentCursor === progressCursorRef.current
			) {
				const isCleaningAudioTask = [
					'FloorSplatter',
					'BathSplatter',
					'MirrorSplatter',
					'Handprint',
					'Footprints',
				].includes(selectedTask);
				if (isCleaningAudioTask) {
					try {
						if (cleaningHtmlRef.current && cleaningHtmlRef.current.play) {
							cleaningHtmlRef.current.currentTime = 0;
							cleaningHtmlRef.current.play();
						}
					} catch (e) {}
				}

				// try {
				// 	const isSpider = selectedTask?.startsWith('Spider');
				// 	const hasFinishAudio =
				// 		isCleaningAudioTask ||
				// 		selectedTask === 'BathWater' ||
				// 		selectedTask === 'SinkWater';
				// 	if (!isSpider && !hasFinishAudio && areSoundsLoaded()) {
				// 		const a = getAudioInstance('pop');
				// 		if (a) {
				// 			a.currentTime = 0;
				// 			a.play && a.play();
				// 		}
				// 	}
				// } catch (e) {}

				if (selectedTask === 'BathWater' || selectedTask === 'SinkWater') {
					try {
						if (faucetSoundRef.current) {
							const a = faucetSoundRef.current;
							if (a.isPlaying && a.stop) {
								a.stop();
							}
						}
						closingFaucetHtmlRef.current && closingFaucetHtmlRef.current.play();
					} catch (e) {}
				}

				setCursor(null);
				setIsDetected(false);
				setIsFading(true);
				progressConditionsRef.current = null;

				setInterfaceObjectives(4, roomNumber);

				if (tutorialObjectives[4] === false && !recentlyChangedObjectives[4]) {
					setTutorialObjectives([
						tutorialObjectives[0],
						tutorialObjectives[1],
						tutorialObjectives[2],
						tutorialObjectives[3],
						true,
					]);
				}

				const currentRoom = Object.values(useGame.getState().seedData)[
					roomNumber
				];
				if (currentRoom?.hideObjective === 'task') {
					useGame
						.getState()
						.checkObjectiveCompletion('task', roomNumber, camera);
				}

				try {
					useGame.getState().addSeenTask(selectedTask);
				} catch (e) {}
			}
		};

		document.addEventListener('progressComplete', handleProgressComplete);
		return () => {
			document.removeEventListener('progressComplete', handleProgressComplete);
		};
	}, [
		setCursor,
		tutorialObjectives,
		recentlyChangedObjectives,
		setTutorialObjectives,
		setInterfaceObjectives,
		roomNumber,
		selectedTask,
		camera,
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
		if (!isFading) return;

		const isSpider = selectedTask?.startsWith('Spider');
		if (isSpider) {
			let raf;
			const obj = movingGroupRef.current;
			if (!obj || !obj.parent || !camera || !camera.getWorldPosition) return;
			const previousShake = shakeIntensity;
			setShakeIntensity(Math.max(previousShake, 2));

			const step = () => {
				if (!camera || !camera.getWorldPosition) {
					return;
				}
				const currentWorld = new THREE.Vector3();
				obj.getWorldPosition(currentWorld);
				const cameraWorld = new THREE.Vector3();
				camera.getWorldPosition(cameraWorld);

				const distance = currentWorld.distanceTo(cameraWorld);
				if (distance <= 0.3) {
					setShakeIntensity(previousShake);
					setCleanedTaskRoom(roomNumber, true);
					setIsFading(false);
					setIsHidden(true);
					return;
				}

				const targetLocal = obj.parent.worldToLocal(cameraWorld.clone());
				const currentLocal = obj.position.clone();
				const direction = targetLocal.clone().sub(currentLocal);
				const stepSize = Math.min(0.1, direction.length());
				if (stepSize > 0) {
					obj.position.copy(
						currentLocal.add(direction.normalize().multiplyScalar(stepSize))
					);
				}
				raf = requestAnimationFrame(step);
			};

			raw: raf = requestAnimationFrame(step);
			return () => {
				setShakeIntensity(previousShake);
				raf && cancelAnimationFrame(raf);
			};
		}

		const mats = new Set();
		groups.forEach(({ key, items }) => {
			if (key === selectedTask) {
				items.forEach((item) => {
					if (!item.material) return;
					const m = item.material;
					const original = originalMaterialPropsRef.current.get(m);
					if (original && typeof original.opacity === 'number') {
						m.opacity = original.opacity;
					}
					m.transparent = true;
					mats.add(m);
				});
			}
		});

		let raf;
		const step = () => {
			mats.forEach((m) => {
				const original = originalMaterialPropsRef.current.get(m);
				const startOpacity =
					typeof original?.opacity === 'number' ? original.opacity : 1;
				m.opacity = Math.max((m.opacity ?? startOpacity) - 0.05, 0);
				m.needsUpdate = true;
			});
			const done = Array.from(mats).every((m) => (m.opacity ?? 0) <= 0);
			if (!done) {
				raf = requestAnimationFrame(step);
			} else {
				setCleanedTaskRoom(roomNumber, true);
				setIsFading(false);
				setIsHidden(true);
				try {
					if (selectedTask === 'MannequinSkull') {
						useGame.getState().setMannequinTaskStatus('skull_cleaned');
					} else if (selectedTask === 'Hangman') {
						useGame.getState().setMannequinTaskStatus('hangman_cleaned');
					}
				} catch (e) {}
			}
		};
		raf = requestAnimationFrame(step);
		return () => raf && cancelAnimationFrame(raf);
	}, [isFading, selectedTask, groups, roomNumber, setCleanedTaskRoom, camera]);

	const isInitialLoad = camera.position.x > 8;

	if (isHidden) {
		return null;
	}

	return (
		<group ref={group} {...props} dispose={null}>
			{!isFading && !isHidden && !isInitialLoad && (
				<DetectionZone
					// visible={true}
					position={detectionZonePosition}
					scale={detectionZoneScale}
					distance={DETECTION_DISTANCE}
					onDetect={handleDetection}
					onDetectEnd={handleDetectionEnd}
					type="clean"
					name="task"
				/>
			)}
			{!isLoading &&
				groups.map(({ key, items }) => {
					const isSelected = selectedTask === key;
					const specialPos =
						specialTransforms[key]?.position ?? visiblePosition;
					const specialRot = specialTransforms[key]?.rotation;
					const specialScale = specialTransforms[key]?.scale;

					let groupPosition;
					if (isInitialLoad) {
						groupPosition = initialLoadPosition;
					} else if (isSelected) {
						if (specialTransforms[key]) {
							if (key === 'Rope' && ropeDropYRef.current != null) {
								groupPosition = [
									specialTransforms.Rope.position[0],
									ropeDropYRef.current,
									specialTransforms.Rope.position[2],
								];
							} else {
								groupPosition = specialPos;
							}
						} else {
							groupPosition = visiblePosition;
						}
					} else {
						groupPosition = hiddenPosition;
					}

					return (
						<group
							key={key}
							ref={isSelected ? movingGroupRef : null}
							position={groupPosition}
							rotation={
								isSelected && !isFading && !isInitialLoad && specialRot
									? specialRot
									: undefined
							}
							scale={
								isSelected && !isInitialLoad && specialScale
									? specialScale
									: undefined
							}
						>
							{items.map((item, idx) => (
								<mesh
									key={`${key}_${idx}`}
									name={key}
									geometry={item.geometry}
									material={item.material}
								/>
							))}
							{isSelected && !isInitialLoad && (
								<>
									<group position={detectionZonePosition}>
										{(key === 'Bath' ||
											key === 'Sink' ||
											key === 'Toilets') && (
											<VolumeAwarePositionalAudio
												ref={fliesSoundRef}
												{...fliesSound}
												loop={true}
												distance={1}
											/>
										)}
										{(key === 'BathWater' || key === 'SinkWater') && (
											<VolumeAwarePositionalAudio
												ref={faucetSoundRef}
												{...faucetSound}
												loop={true}
												distance={1}
											/>
										)}
									</group>
								</>
							)}
						</group>
					);
				})}
		</group>
	);
}
