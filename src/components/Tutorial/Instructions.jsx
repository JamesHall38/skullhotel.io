import { useMemo, useRef } from 'react';
import { Text, Svg } from '@react-three/drei';
import * as THREE from 'three';
import useInterfaceStore from '../../hooks/useInterface';
import useDoorStore from '../../hooks/useDoor';
import useLocalization from '../../hooks/useLocalization';
import { useFrame } from '@react-three/fiber';
// import { CgController } from 'react-icons/cg';
// import { PiMouseLeftClickFill, PiMouseRightClickFill } from 'react-icons/pi';
// import { MdSpaceBar } from 'react-icons/md';
// import { HiArrowTurnDownRight } from 'react-icons/hi2';
// import { FaArrowDownLong } from 'react-icons/fa6';
// import { TbXboxAFilled } from 'react-icons/tb';
// import { TbXboxBFilled } from 'react-icons/tb';
// import { TbXboxXFilled } from 'react-icons/tb';
// import { TbXboxYFilled } from 'react-icons/tb';

// const getIconPath = (icon) => {
// 	const iconElement = icon({});
// 	const path = iconElement.props.children;
// 	if (Array.isArray(path)) {
// 		return path
// 			.map((p) => p.props?.d)
// 			.filter(Boolean)
// 			.join(' ');
// 	}
// 	return path.props?.d;
// };

// console.log('Controller:', getIconPath(CgController));
// console.log('Mouse Left Click:', getIconPath(PiMouseLeftClickFill));
// console.log('Mouse Right Click:', getIconPath(PiMouseRightClickFill));
// console.log('Space Bar:', getIconPath(MdSpaceBar));
// console.log('Arrow Turn Down:', getIconPath(HiArrowTurnDownRight));
// console.log('Arrow Down:', getIconPath(FaArrowDownLong));
// console.log(getIconPath(TbXboxAFilled));
// console.log(getIconPath(TbXboxBFilled));
// console.log(getIconPath(TbXboxXFilled));
// console.log(getIconPath(TbXboxYFilled));

const instructions = [
	// Move
	{
		type: 'text',
		content: 'WASD   / ',
		position: [108.5, 5.5, 13],
		rotation: [0, Math.PI, 0],
		scale: 0.1,
		isTutorial: true,
		category: 'movement',
	},
	{
		type: 'svg',
		content:
			'M14.8284 6.34313L16.2426 4.92892L12 0.686279L7.75735 4.92892L9.17156 6.34313L12 3.51471L14.8284 6.34313Z M4.92892 16.2426L6.34313 14.8284L3.51471 12L6.34313 9.17156L4.92892 7.75735L0.686279 12L4.92892 16.2426Z M7.75735 19.0711L12 23.3137L16.2426 19.0711L14.8284 17.6568L12 20.4853L9.17156 17.6568L7.75735 19.0711Z M17.6568 9.17156L20.4853 12L17.6568 14.8284L19.0711 16.2426L23.3137 12L19.0711 7.75735L17.6568 9.17156Z M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8ZM12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z',
		position: [10.58, 0.6, 1.3],
		rotation: [0, Math.PI, 0],
		scale: 0.006,
		isTutorial: true,
		category: 'movement',
	},
	{
		type: 'text',
		content: 'ui.tutorial.toMove',
		position: [107.5, 3.5, 13],
		rotation: [0, Math.PI, 0],
		scale: 0.1,
		isTutorial: true,
		category: 'movement',
		isTranslatable: true,
	},

	// Interact
	{
		type: 'svg',
		content:
			'M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16ZM112,32h16v72H64V80A48.05,48.05,0,0,1,112,32Zm32,192H112a48.05,48.05,0,0,1-48-48V120H192v56A48.05,48.05,0,0,1,144,224Z',
		position: [5.99, 1.456, 3.15],
		rotation: [0, 0, 0],
		scale: 0.0003,
		isTutorial: true,
		category: 'interaction',
	}, // mouse left click
	{
		type: 'text',
		content: ' / ',
		position: [118.7, 28.4, 63],
		rotation: [0, Math.PI, 0],
		scale: 0.05,
		isTutorial: true,
		category: 'interaction',
	},
	{
		type: 'svg',
		content:
			'M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m3.6 5.2a1 1 0 0 0 -1.4 .2l-2.2 2.933l-2.2 -2.933a1 1 0 1 0 -1.6 1.2l2.55 3.4l-2.55 3.4a1 1 0 1 0 1.6 1.2l2.2 -2.933l2.2 2.933a1 1 0 0 0 1.6 -1.2l-2.55 -3.4l2.55 -3.4a1 1 0 0 0 -.2 -1.4',
		position: [5.8, 1.45, 3.15],
		rotation: [0, 0, 0],
		scale: 0.003,
		isTutorial: true,
		category: 'interaction',
	}, // xbox x
	{
		type: 'text',
		content: 'ui.tutorial.toInteract',
		position: [118.5, 26.5, 63],
		rotation: [0, Math.PI, 0],
		scale: 0.05,
		isTutorial: true,
		category: 'interaction',
		isTranslatable: true,
	},

	// bathroom hiding
	// {
	// 	type: 'text',
	// 	content: 'hiding',
	// 	position: [22, 17.5, 42.15],
	// 	rotation: [0, 0, 0],
	// 	scale: 0.1,
	// 	isBathroom: true,
	// 	category: 'bathroomHiding',
	// },
	// {
	// 	type: 'text',
	// 	content: 'spot',
	// 	position: [22, 16.25, 42.15],
	// 	rotation: [0, 0, 0],
	// 	scale: 0.1,
	// 	isBathroom: true,
	// 	category: 'bathroomHiding',
	// },
	{
		type: 'svg',
		content:
			'M0 3C0 1.34315 1.34315 0 3 0C4.65685 0 6 1.34315 6 3L6 101.551H84.9609L104.217 82.293L126.843 104.922L104.217 127.551L84.2188 107.551H3C1.39489 107.551 0.0842144 106.29 0.00390625 104.705L0 104.551L0 3ZM104.217 118.759L118.052 104.922L104.217 91.0859L90.3818 104.922L104.217 118.759ZM104.076 96.5801L112.562 105.065L104.076 113.551L95.5908 105.065L104.076 96.5801Z',
		position: [2.1, 1.55, 4.215],
		rotation: [0, 0, 0],
		scale: 0.002,
		isBathroom: true,
		category: 'bathroomHiding',
	}, // arrow turn

	// room curtain hiding
	// {
	// 	type: 'text',
	// 	content: 'hiding',
	// 	position: [50, 15.5, 130],
	// 	rotation: [0, Math.PI, 0],
	// 	scale: 0.1,
	// 	isRoom: true,
	// 	category: 'roomHiding',
	// },
	// {
	// 	type: 'text',
	// 	content: 'spot',
	// 	position: [50, 14.25, 130],
	// 	rotation: [0, Math.PI, 0],
	// 	scale: 0.1,
	// 	isRoom: true,
	// 	category: 'roomHiding',
	// },
	{
		type: 'svg',
		content:
			'M3.74 3.749a.75.75 0 0 1 .75.75V15h13.938l-2.47-2.47a.75.75 0 0 1 1.061-1.06l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 0 1-1.06-1.06l2.47-2.47H3.738a.75.75 0 0 1-.75-.75V4.5a.75.75 0 0 1 .75-.751Z',
		position: [5.1, 1.35, 13.0],
		rotation: [0, Math.PI, 0],
		scale: 0.01,
		isRoom: true,
		category: 'roomHiding',
	}, // arrow turn

	// desk hiding
	// {
	// 	type: 'text',
	// 	content: 'hiding',
	// 	position: [68, 15.5, 82.5],
	// 	rotation: [0, -Math.PI / 2, 0],
	// 	scale: 0.1,
	// 	category: 'deskHiding',
	// },
	// {
	// 	type: 'text',
	// 	content: 'spot',
	// 	position: [68, 14.25, 82.5],
	// 	rotation: [0, -Math.PI / 2, 0],
	// 	scale: 0.1,
	// 	category: 'deskHiding',
	// },
	{
		type: 'svg',
		content:
			'M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z',
		position: [6.8, 1.25, 8.19],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.002,
		category: 'deskHiding',
	}, // down arrow

	// nightstand hiding
	// {
	// 	type: 'text',
	// 	content: 'hiding ',
	// 	position: [20, 15.5, 66.25],
	// 	rotation: [0, Math.PI / 2, 0],
	// 	scale: 0.1,
	// 	category: 'nightstandHiding',
	// },
	// {
	// 	type: 'text',
	// 	content: 'spot',
	// 	position: [20, 14.25, 66.25],
	// 	rotation: [0, Math.PI / 2, 0],
	// 	scale: 0.1,
	// 	category: 'nightstandHiding',
	// },
	{
		type: 'svg',
		content:
			'M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z',
		position: [2, 1.25, 6.7],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.002,
		category: 'nightstandHiding',
	}, // down arrow

	// Jump
	{
		type: 'svg',
		content: 'M0 0h24v24H0V0z M18 9v4H6V9H4v6h16V9z',
		position: [1.98, 0.3, 4.05],
		rotation: [0, Math.PI, 0],
		scale: 0.006,
		category: 'jump',
	}, // space bar
	{
		type: 'text',
		content: ' / ',
		position: [21, 2.3, 40.5],
		rotation: [0, 0, 0],
		scale: 0.1,
		category: 'jump',
	},
	{
		type: 'svg',
		content:
			'M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m.936 5.649c-.324 -.865 -1.548 -.865 -1.872 0l-3 8a1 1 0 0 0 .585 1.287l.111 .035a1 1 0 0 0 1.176 -.62l.507 -1.351h3.114l.507 1.351a1 1 0 1 0 1.872 -.702zm-.936 3.199l.807 2.152h-1.614z',
		position: [2.35, 0.3, 4.05],
		rotation: [0, Math.PI, 0],
		scale: 0.006,
		category: 'jump',
	}, // xbox A
	{
		type: 'text',
		content: 'ui.tutorial.toJump',
		position: [27.5, 2.3, 40.5],
		rotation: [0, 0, 0],
		scale: 0.1,
		category: 'jump',
		isTranslatable: true,
	},

	// Crouch (desk)
	{
		type: 'text',
		content: 'Ctrl  / ',
		position: [65, 0.1, 81.9],
		rotation: [-Math.PI / 2, 0, -Math.PI / 2],
		scale: 0.1,
		category: 'crouch',
	},
	{
		type: 'svg',
		content:
			'M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m1 5h-3a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h3a3 3 0 0 0 2.235 -5a3 3 0 0 0 -2.235 -5m0 6a1 1 0 0 1 1 1l-.007 .117a1 1 0 0 1 -.993 .883h-2v-2zm0 -4a1 1 0 0 1 0 2h-2v-2z',
		position: [6.42, 0.01, 8.38],
		rotation: [Math.PI / 2, 0, Math.PI / 2],
		scale: 0.006,
		category: 'crouch',
	}, // xbox B
	{
		type: 'text',
		content: 'ui.tutorial.toCrouch',
		position: [63.5, 0.1, 82.75],
		rotation: [-Math.PI / 2, 0, -Math.PI / 2],
		scale: 0.1,
		category: 'crouch',
		isTranslatable: true,
	},

	// Crouch (nightstand)
	{
		type: 'text',
		content: 'Ctrl  / ',
		position: [23, 0.1, 67],
		rotation: [-Math.PI / 2, 0, Math.PI / 2],
		scale: 0.1,
		category: 'crouch2',
	},
	{
		type: 'svg',
		content:
			'M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m1 5h-3a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h3a3 3 0 0 0 2.235 -5a3 3 0 0 0 -2.235 -5m0 6a1 1 0 0 1 1 1l-.007 .117a1 1 0 0 1 -.993 .883h-2v-2zm0 -4a1 1 0 0 1 0 2h-2v-2z',
		position: [2.37, 0.01, 6.5],
		rotation: [Math.PI / 2, 0, -Math.PI / 2],
		scale: 0.006,
		category: 'crouch2',
	}, // xbox B
	{
		type: 'text',
		content: 'ui.tutorial.toCrouch',
		position: [24.55, 0.1, 66],
		rotation: [-Math.PI / 2, 0, Math.PI / 2],
		scale: 0.1,
		category: 'crouch2',
		isTranslatable: true,
	},

	// Listen
	{
		type: 'svg',
		content:
			'M144,16H112A64.07,64.07,0,0,0,48,80v96a64.07,64.07,0,0,0,64,64h32a64.07,64.07,0,0,0,64-64V80A64.07,64.07,0,0,0,144,16Zm48,64v24H128V32h16A48.05,48.05,0,0,1,192,80ZM144,224H112a48.05,48.05,0,0,1-48-48V120H192v56A48.05,48.05,0,0,1,144,224Z',
		position: [4.58, 1.3, 4.13],
		rotation: [0, -Math.PI / 2, 0],
		scale: 0.00055,
		category: 'listening',
	}, // mouse right click
	{
		type: 'text',
		content: ' / ',
		position: [46, 12.5, 40.3],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.1,
		category: 'listening',
	},
	{
		type: 'svg',
		content:
			'M12 2c5.523 0 10 4.477 10 10s-4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10m3.6 5.2a1 1 0 0 0 -1.4 .2l-2.2 2.933l-2.2 -2.933a1 1 0 1 0 -1.6 1.2l2.81 3.748l-.01 3.649a1 1 0 0 0 .997 1.003l.117 -.006a1 1 0 0 0 .886 -.991l.01 -3.683l2.79 -3.72a1 1 0 0 0 -.2 -1.4',
		position: [4.58, 1.3, 3.9],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.006,
		category: 'listening',
	}, // xbox Y
	{
		type: 'text',
		content: 'ui.tutorial.toListenCarefully',
		position: [46, 10.6, 40],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.1,
		category: 'listening',
		isTranslatable: true,
	},

	// bed arrow
	{
		type: 'svg',
		content:
			'M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z',
		position: [3, 1.5, 8],
		rotation: [0, Math.PI / 2, 0],
		scale: 0.0039,
		isArrow: true,
		objectiveIndex: 1,
		category: 'arrows',
	},
	// window arrow
	{
		type: 'svg',
		content:
			'M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z',
		position: [4.3, 1.6, 13.55],
		rotation: [0, 0, 0],
		scale: 0.0039,
		isArrow: true,
		objectiveIndex: 2,
		category: 'arrows',
	},
	// bathroom arrow
	{
		type: 'svg',
		content:
			'M23.3711 0C25.0279 0 26.3711 1.34315 26.3711 3V84.9609L45.6289 104.217L23 126.843L0.371094 104.217L20.3711 84.2188V3C20.3711 1.34315 21.7142 0 23.3711 0ZM9.16309 104.217L23 118.052L36.8359 104.217L23 90.3818L9.16309 104.217ZM31.3418 104.076L22.8564 112.562L14.3711 104.076L22.8564 95.5908L31.3418 104.076Z',
		position: [2.2, 1.6, 3.3],
		rotation: [0, 0, 0],
		scale: 0.0039,
		isArrow: true,
		objectiveIndex: 0,
		category: 'arrows',
	},
];

export default function Instructions({ stageInfo = {} }) {
	const tutorialObjectives = useInterfaceStore(
		(state) => state.tutorialObjectives
	);
	const tutorial = useDoorStore((state) => state.tutorial);
	const bathroomCurtain = useDoorStore((state) => state.bathroomCurtain);
	const roomCurtain = useDoorStore((state) => state.roomCurtain);
	const arrowRefs = useRef([null, null, null]);
	const shownInstructions = useRef(new Set());
	const { t } = useLocalization();

	useFrame((state) => {
		const time = state.clock.elapsedTime;
		arrowRefs.current.forEach((ref) => {
			if (ref) {
				ref.position.y = 1.7 + Math.sin(time * 2) * 0.1;
			}
		});
	});

	const textMaterial = useMemo(() => {
		return new THREE.MeshBasicMaterial({ color: '#fff' });
	}, []);

	const renderInstructions = useMemo(
		() => (instruction, index) => {
			const shouldShowCategory =
				stageInfo &&
				stageInfo[
					`show${instruction.category
						?.charAt(0)
						.toUpperCase()}${instruction.category?.slice(1)}`
				];

			if (instruction.category && !shouldShowCategory) {
				return null;
			}

			if (
				instruction.isTutorial &&
				(tutorial || shownInstructions.current.has(index))
			) {
				shownInstructions.current.add(index);
				return null;
			}

			if (
				instruction.isArrow &&
				tutorialObjectives[instruction.objectiveIndex]
			) {
				return null;
			}

			if (instruction.isBathroom && bathroomCurtain) {
				return null;
			}

			if (instruction.isRoom && roomCurtain) {
				return null;
			}

			if (instruction.type === 'text') {
				// Get the text content - either translated or raw
				const textContent = instruction.isTranslatable
					? t(instruction.content)
					: instruction.content;

				return (
					<group key={index} scale={instruction.scale}>
						<Text
							font={'/Futura.ttf'}
							position={instruction.position}
							rotation={instruction.rotation}
							material={textMaterial}
						>
							{textContent}
						</Text>
					</group>
				);
			}

			if (instruction.type === 'svg') {
				let position = [...instruction.position];

				if (instruction.isArrow) {
					return (
						<group
							key={index}
							ref={(el) => (arrowRefs.current[instruction.objectiveIndex] = el)}
							position={position}
						>
							<Svg
								src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="${instruction.content}"/></svg>`}
								rotation={instruction.rotation}
								scale={instruction.scale}
							/>
						</group>
					);
				}

				return (
					<Svg
						key={index}
						src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="white" d="${instruction.content}"/></svg>`}
						position={position}
						rotation={instruction.rotation}
						scale={instruction.scale}
					/>
				);
			}
		},
		[
			tutorial,
			tutorialObjectives,
			bathroomCurtain,
			roomCurtain,
			arrowRefs,
			textMaterial,
			stageInfo,
			t,
		]
	);

	return (
		<group
			onPointerDown={(e) => {
				if (e.button !== 0) {
					e.stopPropagation();
				}
			}}
			onPointerUp={(e) => {
				if (e.button !== 0) {
					e.stopPropagation();
				}
			}}
			onClick={(e) => {
				if (e.button !== 0) {
					e.stopPropagation();
				}
			}}
		>
			{instructions.map(renderInstructions)}
		</group>
	);
}
