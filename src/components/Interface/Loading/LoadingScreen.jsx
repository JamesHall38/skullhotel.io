import { useState, useEffect, useRef } from 'react';
import SkullHotelLogo from '../Logo';
import AnimatedTitle from './AnimatedTitle';
import useGame from '../../../hooks/useGame';
import { preloadSounds } from '../../../utils/audio';
import { useProgress } from '@react-three/drei';
import useTextureQueue from '../../../hooks/useTextureQueue';
import TrianglePattern from './TrianglePattern';
import useInterface from '../../../hooks/useInterface';
import useLocalization from '../../../hooks/useLocalization';
import './LoadingScreen.css';

const LoadingScreen = ({ onStart }) => {
	const { progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);
	const [animationsComplete, setAnimationsComplete] = useState(false);
	const [animationProgress, setAnimationProgress] = useState(0);
	const setShouldRenderThreeJs = useGame(
		(state) => state.setShouldRenderThreeJs
	);
	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const setGameStartTime = useGame((state) => state.setGameStartTime);
	const setIsGameplayActive = useGame((state) => state.setIsGameplayActive);
	const [loadedTextureNumber, setLoadedTextureNumber] = useState(0);
	const [loadedSoundsCounter, setLoadedSoundsCounter] = useState(0);
	const queue = useTextureQueue((state) => state.queues);
	const oldQueue = useRef(queue);
	const containerRef = useRef(null);
	const trianglesContainerRef = useRef(null);
	const setIsAnyPopupOpen = useInterface((state) => state.setIsAnyPopupOpen);
	const setIsSettingsOpen = useInterface((state) => state.setIsSettingsOpen);
	const audioInitialized = useRef(false);
	const animationTimerRef = useRef(null);
	const { t } = useLocalization();

	const completedAnimations = useInterface(
		(state) => state.completedAnimations
	);
	const incrementCompletedAnimations = useInterface(
		(state) => state.incrementCompletedAnimations
	);
	const resetAnimationsCount = useInterface(
		(state) => state.resetAnimationsCount
	);
	const isAllAnimationsComplete = useInterface(
		(state) => state.isAllAnimationsComplete
	);

	useEffect(() => {
		resetAnimationsCount();
	}, [resetAnimationsCount]);

	useEffect(() => {
		if (isAllAnimationsComplete()) {
			setAnimationsComplete(true);
			setShouldRenderThreeJs(true);

			if (!animationTimerRef.current) {
				animationTimerRef.current = setInterval(() => {
					setAnimationProgress((prev) => {
						const newValue = Math.min(prev + 0.01, 1);
						if (newValue >= 1) {
							clearInterval(animationTimerRef.current);
							animationTimerRef.current = null;
						}
						return newValue;
					});
				}, 50);
			}
		}
	}, [completedAnimations, isAllAnimationsComplete, setShouldRenderThreeJs]);

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
		if (!audioInitialized.current) {
			audioInitialized.current = true;
			const initAudio = async () => {
				try {
					await preloadSounds(() => {
						setLoadedSoundsCounter((prev) => prev + 1);
					});
				} catch (error) {
					console.error('Erreur de chargement des sons:', error);
				}
			};
			initAudio();
		}

		const texturePartsTotal = 39;
		const audiosPartsTotal = 40;

		const progressPart = (Math.min(progress, 100) / 100) * 0.1;
		const animationPart = animationProgress * 0.1;
		const audiosPart =
			(Math.min(loadedSoundsCounter, audiosPartsTotal) / audiosPartsTotal) *
			0.1;

		const texturesPart =
			(Math.min(loadedTextureNumber, texturePartsTotal) / texturePartsTotal) *
			0.7;

		const totalProgress =
			Math.min(progressPart + animationPart + audiosPart + texturesPart, 1) *
			100;

		// Map the 20-100% range to 0-100%
		const adjustedProgress =
			totalProgress <= 20 ? 0 : ((totalProgress - 20) / 80) * 100;

		setDisplayProgress(Math.max(adjustedProgress, displayProgress));
	}, [
		loadedTextureNumber,
		progress,
		displayProgress,
		loadedSoundsCounter,
		setShouldRenderThreeJs,
		animationsComplete,
		animationProgress,
	]);

	useEffect(() => {
		return () => {
			if (animationTimerRef.current) {
				clearInterval(animationTimerRef.current);
			}
		};
	}, []);

	const handleStartClick = (e) => {
		if (displayProgress !== 100 || !animationsComplete) {
			e.stopPropagation();
			return;
		}

		if (!document.fullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				document.documentElement.msRequestFullscreen();
			}
		}

		setIsGameplayActive(true);
		setPlayIntro(true);
		setGameStartTime();
		if (onStart) onStart();
	};

	const handleSettingsClick = (e) => {
		e.stopPropagation();
		setIsSettingsOpen(true);
		setIsAnyPopupOpen(true);
	};

	return (
		<>
			<div className="triangle-patterns-container" ref={trianglesContainerRef}>
				<div className="column">
					<TrianglePattern onComplete={incrementCompletedAnimations} />
					<TrianglePattern onComplete={incrementCompletedAnimations} />
					<TrianglePattern onComplete={incrementCompletedAnimations} />
				</div>
				<div className="column">
					<TrianglePattern
						position="right"
						onComplete={incrementCompletedAnimations}
					/>
					<TrianglePattern
						position="right"
						onComplete={incrementCompletedAnimations}
					/>
					<TrianglePattern
						position="right"
						onComplete={incrementCompletedAnimations}
					/>
				</div>
			</div>

			<div
				className={`loading-page ${
					displayProgress === 100 && animationsComplete ? 'ready' : ''
				}`}
				onClick={handleStartClick}
				ref={containerRef}
			>
				<>
					<SkullHotelLogo />
					<div className="flex">
						<div className="title-container">
							<AnimatedTitle onComplete={incrementCompletedAnimations} />
						</div>
					</div>
				</>
				<div className="buttons-container">
					<div
						className={`${
							displayProgress !== 100 ? 'loading' : 'start'
						} lincoln-regular`}
					>
						{displayProgress !== 100
							? `${t('ui.loading.loading')}: ${displayProgress.toFixed(0)}%`
							: t('ui.loading.clickToStart')}
					</div>
					<div
						className="settings lincoln-regular"
						onClick={handleSettingsClick}
					>
						{t('ui.loading.settings')}
					</div>
				</div>
			</div>
		</>
	);
};

export default LoadingScreen;
