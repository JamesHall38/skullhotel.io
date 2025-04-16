import { useState, useEffect, useRef } from 'react';
import SkullHotelLogo from './Logo';
import AnimatedTitle from './AnimatedTitle';
import useGame from '../../hooks/useGame';
import { preloadSounds } from '../../utils/audio';
import { useProgress } from '@react-three/drei';
import useTextureQueue from '../../hooks/useTextureQueue';
import TrianglePattern from './TrianglePattern';
import Settings from './Settings';
import useInterface from '../../hooks/useInterface';
import './LoadingScreen.css';

const TOTAL_ANIMATION_DURATION = 5000;
const PRELOAD_DELAY = 4000;

const LoadingScreen = ({ onStart }) => {
	const { progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);
	const [fontsLoaded, setFontsLoaded] = useState(false);
	const [animationsComplete, setAnimationsComplete] = useState(false);
	const setShouldRenderThreeJs = useGame(
		(state) => state.setShouldRenderThreeJs
	);
	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const setGameStartTime = useGame((state) => state.setGameStartTime);
	const [loadedTextureNumber, setLoadedTextureNumber] = useState(0);
	const queue = useTextureQueue((state) => state.queues);
	const oldQueue = useRef(queue);
	const loadingStarted = useRef(false);
	const containerRef = useRef(null);
	const trianglesContainerRef = useRef(null);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const settingsRef = useRef(null);

	useEffect(() => {
		const titleFont = new FontFace(
			'Lincoln Road Deco',
			'url(/Lincoln-Road-Deco.ttf)'
		);

		const regularFont = new FontFace(
			'Lincoln Road Regular',
			'url(/Lincoln-Road-Regular.ttf)'
		);

		Promise.all([
			titleFont.load().then((font) => document.fonts.add(font)),
			regularFont.load().then((font) => document.fonts.add(font)),
			document.fonts.ready,
		])
			.then(() => {
				setFontsLoaded(true);
				setTimeout(() => {
					setShouldRenderThreeJs(true);
				}, PRELOAD_DELAY);
			})
			.catch((err) => console.error('Erreur de chargement des polices:', err));
	}, [setShouldRenderThreeJs]);

	useEffect(() => {
		if (!fontsLoaded) return;

		const animationTimer = setTimeout(() => {
			setAnimationsComplete(true);
		}, TOTAL_ANIMATION_DURATION);

		return () => clearTimeout(animationTimer);
	}, [fontsLoaded]);

	useEffect(() => {
		const hasQueueChanged = Object.keys(queue).some((key) => {
			return queue[key].queue.length !== oldQueue.current[key]?.queue.length;
		});

		if (hasQueueChanged) {
			oldQueue.current = queue;
			setLoadedTextureNumber((value) => value + 1);
		}
	}, [queue]);

	useEffect(() => {
		if (!loadingStarted.current && fontsLoaded) {
			loadingStarted.current = true;
		}

		if (!loadingStarted.current) return;

		const texturesDrawCalls = (loadedTextureNumber / 38) * 85;
		const modelsLoading =
			(Math.min(progress, 80) / 2 + (Math.max(progress - 80, 0) * 5) / 2) / 10;

		const calculatedProgress = Math.min(
			Math.max(texturesDrawCalls + modelsLoading, displayProgress),
			95
		);

		if (calculatedProgress >= 95) {
			const initAudio = async () => {
				try {
					setDisplayProgress(100);
					await preloadSounds();
				} catch (error) {
					setDisplayProgress(100);
					console.error('Erreur de chargement des sons:', error);
				}
			};

			initAudio();
		} else if (calculatedProgress < 95) {
			setDisplayProgress(calculatedProgress);
		}
	}, [loadedTextureNumber, progress, displayProgress, fontsLoaded]);

	const handleStartClick = (e) => {
		if (displayProgress !== 100 || !animationsComplete) {
			e.stopPropagation();
			return;
		}

		setPlayIntro(true);
		setGameStartTime();
		if (onStart) onStart();
	};

	const handleSettingsClick = (e) => {
		e.stopPropagation();

		const settingsBtn = document.querySelector(
			'.settings-instance .menu-button'
		);
		if (settingsBtn) {
			settingsBtn.click();
			setIsAnyPopupOpen(true);
		}
	};

	if (!fontsLoaded) {
		return <div className="loading-page font-preload" />;
	}

	return (
		<>
			<div className="triangle-patterns-container" ref={trianglesContainerRef}>
				<div className="column">
					<TrianglePattern />
					<TrianglePattern />
					<TrianglePattern />
				</div>
				<div className="column">
					<TrianglePattern position="right" />
					<TrianglePattern position="right" />
					<TrianglePattern position="right" />
				</div>
			</div>

			<div
				className={`loading-page ${
					displayProgress === 100 && animationsComplete ? 'ready' : ''
				}`}
				onClick={handleStartClick}
				ref={containerRef}
			>
				<SkullHotelLogo />
				<div className="flex">
					<div className="title-container">
						<AnimatedTitle />
					</div>
				</div>
				<div className="buttons-container">
					<div
						className={`${
							displayProgress !== 100 ? 'loading' : 'start'
						} lincoln-regular`}
					>
						{displayProgress !== 100
							? `LOADING: ${displayProgress.toFixed(0)}%`
							: `CLICK TO START`}
					</div>
					<div
						className="settings lincoln-regular"
						onClick={handleSettingsClick}
					>
						Settings
					</div>
				</div>
			</div>
			<div className="settings-instance" ref={settingsRef}>
				<Settings />
			</div>
		</>
	);
};

export default LoadingScreen;
