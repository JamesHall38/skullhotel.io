import { useMemo, useRef, useState, useCallback } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useInterface from '../../hooks/useInterface';
import DetectionZone from '../DetectionZone';
import { ReactComponent as LeftJoystickIcon } from './icons/left.svg';
import { ReactComponent as RightJoystickIcon } from './icons/right.svg';
import { ReactComponent as AButtonIcon } from './icons/a_filled.svg';
import { ReactComponent as BButtonIcon } from './icons/b_filled.svg';
import { ReactComponent as XButtonIcon } from './icons/x_filled.svg';
import { ReactComponent as YButtonIcon } from './icons/y_filled.svg';
import { ReactComponent as LeftPressButtonIcon } from './icons/left_press.svg';
import { ReactComponent as MouseClickIcon } from './icons/mouse_click.svg';
import '../Interface/Interface.css';

const Controls = () => {
	return (
		<div className="controls">
			<div className="main-controls">
				<div className="keyboard-controls">
					<div className="row">
						<div className="key">W</div>
					</div>
					<div className="row">
						<div className="key">A</div>
						<div className="key">S</div>
						<div className="key">D</div>
					</div>
				</div>
				<div className="gamepad-controls">
					<LeftJoystickIcon />
					<RightJoystickIcon />
				</div>
			</div>
			<div className="keys">
				<div className="bind">
					Jump
					<div className="row">
						<AButtonIcon /> / <div className="key">Space</div>
					</div>
				</div>
				<div className="bind">
					Crouch
					<div className="row">
						<BButtonIcon /> / <div className="key">Ctrl</div>
					</div>
				</div>
				<div className="bind">
					Interact
					<div className="row">
						<XButtonIcon /> / <YButtonIcon /> /{' '}
						<div className="mouse-click-icon">
							<MouseClickIcon />
						</div>
					</div>
				</div>
				{/* <div className="bind">

					<YButtonIcon /> / <div className="key">Crouch</div>
				</div> */}
				<div className="bind">
					Run
					<div className="row">
						<LeftPressButtonIcon /> / <div className="key">Shift</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const Receptionist = () => {
	const group = useRef();
	const { nodes } = useGLTF('/models/reception/receptionist.glb');
	const isMad = false;
	const [showPanel, setShowPanel] = useState(false);
	const [isDetected, setIsDetected] = useState(false);
	const setCursor = useInterface((state) => state.setCursor);

	const eyesMaterial = useMemo(() => {
		return isMad
			? new THREE.MeshBasicMaterial({ color: '#ff0000' })
			: new THREE.MeshBasicMaterial({ color: '#ffffff' });
	}, [isMad]);

	useFrame((state) => {
		const { x, z } = state.camera.position;
		group.current.lookAt(x, 0, z);

		if (state.camera.position.x < 8) {
			setShowPanel(false);
		}
	});

	const handleClick = () => {
		if (isDetected) {
			setShowPanel(true);
			setTimeout(() => setShowPanel(false), 20000);
		}
	};

	const handleDetection = useCallback(() => {
		setCursor('help');
		setIsDetected(true);
	}, [setCursor]);

	const handleDetectionEnd = useCallback(() => {
		setCursor(null);
		setIsDetected(false);
	}, [setCursor]);

	return (
		<>
			<group ref={group} position={[-2.5, 0, 0.95]} scale={0.9} dispose={null}>
				<DetectionZone
					position={[0, 1, 0]}
					scale={[1, 2, 1]}
					distance={3}
					onDetect={handleDetection}
					onDetectEnd={handleDetectionEnd}
					onCick={handleClick}
					onPointerDown={handleClick}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Eyes.geometry}
					material={eyesMaterial}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Skeleton.geometry}
					material={nodes.Skeleton.material}
				/>
				<mesh
					castShadow
					receiveShadow
					geometry={nodes.Skull.geometry}
					material={nodes.Skull.material}
				/>
			</group>
			{showPanel && (
				<Html
					position={[-2.5, 1.5, 0.95]}
					center
					distanceFactor={4}
					onPointerDown={(e) => e.stopPropagation()}
				>
					<div className="reception-panel">
						<Controls />
						<p>
							Welcome to the Skull Hotel!
							<br />
							<br />
							You must be the new housekeeper.
							<br />
							Tonight, half of our rooms are occupied, so you have 10 rooms to
							tidy up.
							<br />
							<br />
							Unfortunately, our door security system is malfunctioning, so we
							can no longer tell which rooms are occupied. You'll need to take a
							look into each room before entering to check if a guest is inside.
							If someone is there, you won't need to clean that room.
							<br /> <br />
							Start by cleaning the tutorial room; it's located to your right.
							You can track your remaining objectives at the top right of your
							screen.
							<br /> <br /> Good luck!
						</p>
					</div>
				</Html>
			)}
		</>
	);
};

useGLTF.preload('/models/reception/receptionist.glb');

export default Receptionist;
