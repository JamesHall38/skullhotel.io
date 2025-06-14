import { useMemo, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Animations from './Animations';
import useMonsterLogic from '../../hooks/useMonsterLogic';
import useMonster from '../../hooks/useMonster';
import useGame from '../../hooks/useGame';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const MONSTER_CLOTHING = {
	jean: { clothing: 'teeshirt', color: 'gray' },
	terra: { clothing: 'sweat', color: 'white' },
	hugo: { clothing: 'teeshirt', color: 'black' },
	grim: { clothing: 'sweat', color: 'black' },
	theo: { clothing: 'sweat', color: 'gray' },
	pota: { clothing: 'teeshirt', color: 'white' },
};

const Monster = (props) => {
	const { gl } = useThree();

	const monsterLogic = useMonsterLogic(true);

	const {
		group,
		setupHeadTracking,
		useHeadTracking,
		useEndAnimationLookAt,
		useMonsterBehavior,
		useDeathVibration,
	} = monsterLogic;

	const { nodes, materials, animations } = useGLTF(
		'/models/monsterccb-opt.glb',
		undefined,
		undefined,
		(loader) => {
			const ktxLoader = new KTX2Loader();
			ktxLoader.setTranscoderPath(
				'https://cdn.jsdelivr.net/gh/pmndrs/drei-assets/basis/'
			);
			ktxLoader.detectSupport(gl);
			loader.setKTX2Loader(ktxLoader);
		}
	);

	const clothingMaterials = useMemo(() => {
		if (!materials.Sweat) return {};

		return {
			sweatWhite: materials.Sweat.clone(),
			sweatBlack: materials.Sweat.clone(),
			sweatGray: materials.Sweat.clone(),
			teeshirtWhite: materials.Sweat.clone(),
			teeshirtBlack: materials.Sweat.clone(),
			teeshirtGray: materials.Sweat.clone(),
		};
	}, [materials]);

	useMemo(() => {
		if (clothingMaterials.sweatWhite) {
			clothingMaterials.sweatWhite.color.setHex(0xffffff);
			clothingMaterials.sweatBlack.color.setHex(0x000000);
			clothingMaterials.sweatGray.color.setHex(0x808080);
			clothingMaterials.teeshirtWhite.color.setHex(0xffffff);
			clothingMaterials.teeshirtBlack.color.setHex(0x000000);
			clothingMaterials.teeshirtGray.color.setHex(0x808080);
		}
	}, [clothingMaterials]);

	const selectedMonster = useMonster((state) => state.selectedMonster);
	const getMonsterForRoom = useGame((state) => state.getMonsterForRoom);
	const generateMonsterAssignments = useGame(
		(state) => state.generateMonsterAssignments
	);
	const roomMonsterAssignments = useGame(
		(state) => state.roomMonsterAssignments
	);
	const playerPositionRoom = useGame((state) => state.playerPositionRoom);

	const currentMonster = useMemo(() => {
		if (playerPositionRoom !== null) {
			return getMonsterForRoom(playerPositionRoom);
		}
		return selectedMonster;
	}, [
		playerPositionRoom,
		getMonsterForRoom,
		selectedMonster,
		roomMonsterAssignments,
	]);

	const monsterParts = useMemo(
		() => [
			{ name: 'skeleton', label: 'Base structure' },
			{ name: 'legs', label: 'Lower body' },
			{ name: 'body', label: 'Main body' },
			{ name: 'arms', label: 'Upper limbs' },
			{ name: 'head', label: 'Head' },
			{ name: 'details', label: 'Final details' },
		],
		[]
	);

	const { loadedItems, isLoading } = useProgressiveLoad(
		monsterParts,
		'Monster'
	);

	const visibleParts = useMemo(() => {
		return monsterParts.reduce((acc, part) => {
			acc[part.name] = loadedItems.some((item) => item.name === part.name);
			return acc;
		}, {});
	}, [loadedItems, monsterParts]);

	const visibilityStates = useMemo(() => {
		const states = {
			theo: currentMonster === 'theo',
			terra: currentMonster === 'terra',
			pota: currentMonster === 'pota',
			jean: currentMonster === 'jean',
			hugo: currentMonster === 'hugo',
			grim: currentMonster === 'grim',
			sweat:
				currentMonster === 'terra' ||
				currentMonster === 'grim' ||
				currentMonster === 'theo',
			teeshirt:
				currentMonster === 'hugo' ||
				currentMonster === 'pota' ||
				currentMonster === 'jean',
		};

		return states;
	}, [currentMonster]);

	const getClothingMaterial = useCallback(
		(clothingType) => {
			const config = MONSTER_CLOTHING[currentMonster];

			if (!config) {
				return materials.Sweat;
			}

			if (clothingType === 'Teeshirt' && config.clothing === 'teeshirt') {
				const materialKey = `teeshirt${
					config.color.charAt(0).toUpperCase() + config.color.slice(1)
				}`;
				const material = clothingMaterials[materialKey] || materials.Sweat;
				return material;
			}

			if (clothingType === 'Sweat' && config.clothing === 'sweat') {
				const materialKey = `sweat${
					config.color.charAt(0).toUpperCase() + config.color.slice(1)
				}`;
				const material = clothingMaterials[materialKey] || materials.Sweat;
				return material;
			}

			return materials.Sweat;
		},
		[currentMonster, clothingMaterials, materials]
	);

	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);

	setupHeadTracking(nodes);

	useHeadTracking();
	useEndAnimationLookAt();
	useMonsterBehavior();
	useDeathVibration();

	useMemo(() => {
		if (Object.keys(roomMonsterAssignments).length === 0) {
			generateMonsterAssignments();
		}
	}, [generateMonsterAssignments, roomMonsterAssignments]);

	return (
		<group>
			<group
				position={monsterPosition}
				rotation={monsterRotation}
				scale={1.1}
				ref={group}
				{...props}
				dispose={null}
			>
				{!isLoading && <Animations group={group} animations={animations} />}
				<group name="Scene">
					<group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
						<group name="Ch30" rotation={[Math.PI / 2, 0, 0]}>
							{visibleParts.skeleton && (
								<>
									{/* Theo */}
									{nodes.Ch30_primitive0 && (
										<skinnedMesh
											name="Ch30_primitive0"
											geometry={nodes.Ch30_primitive0.geometry}
											material={materials.Theo}
											skeleton={nodes.Ch30_primitive0.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.theo}
										/>
									)}
									{/* Terra */}
									{nodes.Ch30_primitive1 && (
										<skinnedMesh
											name="Ch30_primitive1"
											geometry={nodes.Ch30_primitive1.geometry}
											material={materials.Terra}
											skeleton={nodes.Ch30_primitive1.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.terra}
										/>
									)}
									{/* Pota */}
									{nodes.Ch30_primitive2 && (
										<skinnedMesh
											name="Ch30_primitive2"
											geometry={nodes.Ch30_primitive2.geometry}
											material={materials.Pota}
											skeleton={nodes.Ch30_primitive2.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.pota}
										/>
									)}
									{/* Jean */}
									{nodes.Ch30_primitive3 && (
										<skinnedMesh
											name="Ch30_primitive3"
											geometry={nodes.Ch30_primitive3.geometry}
											material={materials.Jean}
											skeleton={nodes.Ch30_primitive3.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.jean}
										/>
									)}
									{/* Hugo */}
									{nodes.Ch30_primitive5 && (
										<skinnedMesh
											name="Ch30_primitive5"
											geometry={nodes.Ch30_primitive5.geometry}
											material={materials.Hugo}
											skeleton={nodes.Ch30_primitive5.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.hugo}
										/>
									)}
									{/* Grim */}
									{nodes.Ch30_primitive6 && (
										<skinnedMesh
											name="Ch30_primitive6"
											geometry={nodes.Ch30_primitive6.geometry}
											material={materials.Grim}
											skeleton={nodes.Ch30_primitive6.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.grim}
										/>
									)}
									{/* Human */}
									{nodes.Ch30_primitive4 && (
										<skinnedMesh
											name="Ch30_primitive4"
											geometry={nodes.Ch30_primitive4.geometry}
											material={materials.Hugo}
											skeleton={nodes.Ch30_primitive4.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
										/>
									)}
									{/* Shoes */}
									{nodes.Ch30_primitive7 && (
										<skinnedMesh
											name="Ch30_primitive7"
											geometry={nodes.Ch30_primitive7.geometry}
											material={materials.Shoes}
											skeleton={nodes.Ch30_primitive7.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
										/>
									)}
									{/* Pants */}
									{nodes.Ch30_primitive8 && (
										<skinnedMesh
											name="Ch30_primitive8"
											geometry={nodes.Ch30_primitive8.geometry}
											material={materials.Pants}
											skeleton={nodes.Ch30_primitive8.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
										/>
									)}
									{nodes.Ch30_primitive11 && (
										<skinnedMesh
											name="Ch30_primitive11"
											geometry={nodes.Ch30_primitive11.geometry}
											material={materials.Shoes}
											skeleton={nodes.Ch30_primitive11.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
										/>
									)}

									{/* Sweat - Terra, Grim, Theo */}
									{nodes.Ch30_primitive9 && (
										<skinnedMesh
											name="Ch30_primitive9"
											geometry={nodes.Ch30_primitive9.geometry}
											material={getClothingMaterial('Sweat')}
											skeleton={nodes.Ch30_primitive9.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.sweat}
										/>
									)}
									{/* Teeshirt - Hugo, Pota, Jean */}
									{nodes.Ch30_primitive10 && (
										<skinnedMesh
											name="Ch30_primitive10"
											geometry={nodes.Ch30_primitive10.geometry}
											material={getClothingMaterial('Teeshirt')}
											skeleton={nodes.Ch30_primitive10.skeleton}
											castShadow
											receiveShadow
											frustumCulled={false}
											visible={visibilityStates.teeshirt}
										/>
									)}
								</>
							)}
						</group>
						<primitive object={nodes.mixamorigHips} />
						<primitive object={nodes.neutral_bone} />
					</group>
				</group>
			</group>
		</group>
	);
};

export default Monster;
