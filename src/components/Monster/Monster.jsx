import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Animations from './Animations';
import useMonsterLogic from '../../hooks/useMonsterLogic';
import useProgressiveLoad from '../../hooks/useProgressiveLoad';
import useMonster from '../../hooks/useMonster';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const Monster = (props) => {
	const { gl } = useThree();

	const monsterLogic = useMonsterLogic();

	const {
		group,
		setupHeadTracking,
		useHeadTracking,
		useEndAnimationLookAt,
		useMonsterBehavior,
		useDeathVibration,
	} = monsterLogic;

	const { nodes, materials, animations } = useGLTF(
		'/models/monster-opt.glb',
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

	const getMaterial = useMemo(() => {
		return (_, material) => {
			return materials[material] || materials[Object.keys(materials)[0]];
		};
	}, [materials]);

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

	const monsterPosition = useMonster((state) => state.monsterPosition);
	const monsterRotation = useMonster((state) => state.monsterRotation);

	setupHeadTracking(nodes);

	useHeadTracking();
	useEndAnimationLookAt();
	useMonsterBehavior();
	useDeathVibration();

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
						<group name="Ch30" rotation={[0, 0, 0]}>
							{visibleParts.skeleton && (
								<primitive object={nodes.mixamorigHips} />
							)}
							{visibleParts.body && (
								<skinnedMesh
									name="Ch30_primitive0"
									geometry={nodes.Ch30_primitive0.geometry}
									material={getMaterial('Ch36_Body', 'Ch30_Body1')}
									skeleton={nodes.Ch30_primitive0.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.arms && (
								<skinnedMesh
									name="Ch30_primitive1"
									geometry={nodes.Ch30_primitive1.geometry}
									material={getMaterial('Material.012', 'Ch30_Body')}
									skeleton={nodes.Ch30_primitive1.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.head && (
								<skinnedMesh
									name="Ch30_primitive2"
									geometry={nodes.Ch30_primitive2.geometry}
									material={getMaterial('Material.017', 'Material.001')}
									skeleton={nodes.Ch30_primitive2.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.legs && (
								<skinnedMesh
									name="Ch30_primitive3"
									geometry={nodes.Ch30_primitive3.geometry}
									material={getMaterial('Bodymat', 'Material')}
									skeleton={nodes.Ch30_primitive3.skeleton}
									castShadow
									receiveShadow
									frustumCulled={false}
								/>
							)}
							{visibleParts.details && (
								<>
									<skinnedMesh
										name="Ch30_primitive4"
										geometry={nodes.Ch30_primitive4.geometry}
										material={getMaterial('Shoesmat', 'Material.002')}
										skeleton={nodes.Ch30_primitive4.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
									<skinnedMesh
										name="Ch30_primitive5"
										geometry={nodes.Ch30_primitive5.geometry}
										material={getMaterial('Bottommat', 'Material.011')}
										skeleton={nodes.Ch30_primitive5.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
									<skinnedMesh
										name="Ch30_primitive6"
										geometry={nodes.Ch30_primitive6.geometry}
										material={getMaterial('Material.018', 'Material.016')}
										skeleton={nodes.Ch30_primitive6.skeleton}
										castShadow
										receiveShadow
										frustumCulled={false}
									/>
								</>
							)}
						</group>
					</group>
				</group>
			</group>
		</group>
	);
};

export default Monster;
