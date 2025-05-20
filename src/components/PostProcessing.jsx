import { useMemo, useEffect, useState, useRef } from 'react';
import {
	EffectComposer,
	// ChromaticAberration,
	Vignette,
	// Noise,
	Glitch,
} from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';
import { Uniform } from 'three';
// import useMonster from '../hooks/useMonster';
import useLight from '../hooks/useLight';
import { useFrame } from '@react-three/fiber';
// import { useControls } from 'leva';
import useGame from '../hooks/useGame';
import useInterface from '../hooks/useInterface';
import * as THREE from 'three';
import { getAudioInstance, areSoundsLoaded } from '../utils/audio';
import { vibrateControllers } from '../hooks/useGamepadControls';

const DISTORTION_SPEED = 5;

const createFOVEffect = () => {
	return new Effect(
		'FOVEffect',
		/* glsl */ `
		uniform float strength;

		void mainUv(inout vec2 uv) {
			vec2 centerPoint = vec2(0.5);
			
			// Convert to polar coordinates
			vec2 coords = uv - centerPoint;
			float distance = length(coords);
			float angle = atan(coords.y, coords.x);
			
			// Apply FOV distortion
			float distortedDistance = distance * (1.0 + strength * distance);
			
			// Convert back to cartesian coordinates
			uv = centerPoint + vec2(
				cos(angle) * distortedDistance,
				sin(angle) * distortedDistance
			);
		}

		void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
			outputColor = inputColor;
		}
	`,
		{
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([['strength', new Uniform(0.0)]]),
		}
	);
};

// const createBlurEffect = () => {
// 	return new Effect(
// 		'CustomBlurEffect',
// 		/* glsl */ `
// 		uniform float intensity;
// 		uniform float vignetteRadius;
// 		uniform float vignetteSoftness;
// 		uniform float vignetteStrength;

// 		void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
// 			vec2 center = vec2(0.5);
// 			float dist = distance(uv, center);

// 			float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
// 			float vignetteBlur = vignetteFactor * vignetteStrength;
// 			float finalIntensity = mix(intensity, max(intensity, vignetteBlur), vignetteFactor);

// 			vec2 offset1 = vec2(1.0, 1.0) * finalIntensity * 0.01;
// 			vec2 offset2 = vec2(-1.0, 1.0) * finalIntensity * 0.01;

// 			vec4 color1 = texture2D(inputBuffer, uv + offset1);
// 			vec4 color2 = texture2D(inputBuffer, uv - offset1);
// 			vec4 color3 = texture2D(inputBuffer, uv + offset2);
// 			vec4 color4 = texture2D(inputBuffer, uv - offset2);

// 			outputColor = (inputColor + color1 + color2 + color3 + color4) / 5.0;
// 		}
// 	`,
// 		{
// 			blendFunction: BlendFunction.NORMAL,
// 			uniforms: new Map([
// 				['intensity', new Uniform(0.0)],
// 				['vignetteRadius', new Uniform(0.5)],
// 				['vignetteSoftness', new Uniform(0.5)],
// 				['vignetteStrength', new Uniform(0.0)],
// 			]),
// 		}
// 	);
// };

const createSaturationEffect = () => {
	return new Effect(
		'SaturationEffect',
		/* glsl */ `
		uniform float saturation;
		uniform float time;

		float random(vec2 st) {
			return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
		}

		void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
			vec3 luminance = vec3(0.2126, 0.7152, 0.0722);
			float grey = dot(inputColor.rgb, luminance);
			
			float noise = (random(uv + time) - 0.5) * 0.1;
			float noiseIntensity = (1.0 - saturation) * noise;
			
			vec3 result = vec3(
				mix(grey, inputColor.r, saturation) + noiseIntensity,
				mix(grey, inputColor.g, saturation) + noiseIntensity,
				mix(grey, inputColor.b, saturation) + noiseIntensity
			);
			
			outputColor = vec4(result, inputColor.a);
		}
	`,
		{
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([
				['saturation', new Uniform(1.0)],
				['time', new Uniform(0.0)],
			]),
		}
	);
};

const FOVDistortion = ({ playIntro }) => {
	const [isAnimating, setIsAnimating] = useState(false);
	const [targetStrength, setTargetStrength] = useState(0);
	const effect = useMemo(() => createFOVEffect(), []);

	useEffect(() => {
		if (playIntro) {
			setIsAnimating(true);
			setTargetStrength(0);
			effect.uniforms.get('strength').value = -4;
		}
	}, [playIntro, effect]);

	useFrame((_, delta) => {
		if (isAnimating) {
			const currentStrength = effect.uniforms.get('strength').value;
			const newStrength = Math.min(
				targetStrength,
				currentStrength + delta * DISTORTION_SPEED
			);
			effect.uniforms.get('strength').value = newStrength;

			if (newStrength >= targetStrength) {
				setIsAnimating(false);
			}
		}
	});

	return <primitive object={effect} />;
};

// const CustomBlur = () => {
// 	const { intensity, vignetteRadius, vignetteSoftness, vignetteStrength } =
// 		useControls(
// 			'Blur Effect',
// 			{
// 				intensity: {
// 					value: 0,
// 					min: 0,
// 					max: 5,
// 					step: 0.1,
// 					label: 'Base Blur',
// 				},
// 				vignetteRadius: {
// 					value: 0.3,
// 					min: 0,
// 					max: 1,
// 					step: 0.01,
// 					label: 'Vignette Radius',
// 				},
// 				vignetteSoftness: {
// 					value: 0.15,
// 					min: 0,
// 					max: 1,
// 					step: 0.01,
// 					label: 'Vignette Softness',
// 				},
// 				vignetteStrength: {
// 					value: 0.5,
// 					min: 0,
// 					max: 5,
// 					step: 0.1,
// 					label: 'Vignette Strength',
// 				},
// 			},
// 			{ collapsed: true }
// 		);

// 	const effect = useMemo(() => createBlurEffect(), []);

// 	useEffect(() => {
// 		effect.uniforms.get('intensity').value = intensity;
// 		effect.uniforms.get('vignetteRadius').value = vignetteRadius;
// 		effect.uniforms.get('vignetteSoftness').value = vignetteSoftness;
// 		effect.uniforms.get('vignetteStrength').value = vignetteStrength;
// 	}, [effect, intensity, vignetteRadius, vignetteSoftness, vignetteStrength]);

// 	return <primitive object={effect} />;
// };

const Saturation = ({ isListening }) => {
	const effect = useMemo(() => createSaturationEffect(), []);
	const currentSaturation = useRef(1.0);

	useFrame((_, delta) => {
		const LERP_SPEED = 2.5;
		const targetSaturation = isListening ? 0.0 : 1.0;

		currentSaturation.current +=
			(targetSaturation - currentSaturation.current) *
			Math.min(delta * LERP_SPEED, 1);
		effect.uniforms.get('saturation').value = currentSaturation.current;

		effect.uniforms.get('time').value += delta;
	});

	return <primitive object={effect} />;
};

const PostProcessing = () => {
	// const monsterState = useMonster((state) => state.monsterState);
	// const performanceMode = useGame((state) => state.performanceMode);
	const { playIntro } = useGame();
	const [isNeonFlickering, setIsNeonFlickering] = useState(false);
	const [isDistorting, setIsDistorting] = useState(false);
	const [soundsReady, setSoundsReady] = useState(false);
	const jumpScareAmbianceRef = useRef(null);
	const whiteNoiseRef = useRef(null);
	const currentVolumeRef = useRef(0);
	const whiteNoiseVolumeRef = useRef(0);
	const setReceptionLight1 = useLight((state) => state.setReceptionLight1);
	const setFlashlightEnabled = useLight((state) => state.setFlashlightEnabled);
	const receptionLight1 = useLight((state) => state.receptionLight1);
	const setCursor = useInterface((state) => state.setCursor);
	const setPlayIntro = useGame((state) => state.setPlayIntro);
	const jumpScare = useGame((state) => state.jumpScare);
	const shakeIntensity = useGame((state) => state.shakeIntensity);
	const isListening = useGame((state) => state.isListening);
	const setIntroIsPlaying = useGame.getState().setIntroIsPlaying;
	const lerpTimeRef = useRef(0);

	const glitchStrength = useMemo(() => {
		if (isDistorting || isNeonFlickering) return 0.2;
		if (jumpScare) return 0.5;
		// if (['run', 'chase'].includes(monsterState)) return 0.2;
		if (shakeIntensity) return 0.05;
		return 0;
	}, [isDistorting, isNeonFlickering, jumpScare, shakeIntensity]);

	useEffect(() => {
		const checkSounds = () => {
			if (areSoundsLoaded()) {
				jumpScareAmbianceRef.current = getAudioInstance('jumpScareAmbiance');
				whiteNoiseRef.current = getAudioInstance('boomAmbient');

				if (jumpScareAmbianceRef.current && whiteNoiseRef.current) {
					// Configuration initiale
					jumpScareAmbianceRef.current.loop = true;
					jumpScareAmbianceRef.current.volume = 0;
					whiteNoiseRef.current.loop = false;
					whiteNoiseRef.current.volume = 0;
					whiteNoiseRef.current.playbackRate = 0.5;
					setSoundsReady(true);
				}
			} else {
				setTimeout(checkSounds, 100);
			}
		};

		checkSounds();

		return () => {
			if (jumpScareAmbianceRef.current) {
				jumpScareAmbianceRef.current.pause();
				jumpScareAmbianceRef.current.currentTime = 0;
			}
			if (whiteNoiseRef.current) {
				whiteNoiseRef.current.pause();
				whiteNoiseRef.current.currentTime = 0;
			}
		};
	}, []);

	useFrame((_, delta) => {
		if (!soundsReady) return;

		const LERP_FACTOR = 2;
		const targetVolume =
			isDistorting || isNeonFlickering ? 0 : glitchStrength * 2;
		const currentVolume = currentVolumeRef.current;

		const newVolume =
			currentVolume +
			(targetVolume - currentVolume) * Math.min(delta * LERP_FACTOR, 1);

		currentVolumeRef.current = newVolume;
		jumpScareAmbianceRef.current.volume = newVolume;

		// Fade out white noise gradually
		if (whiteNoiseVolumeRef.current > 0) {
			whiteNoiseVolumeRef.current = Math.max(
				0,
				whiteNoiseVolumeRef.current - delta * 0.2
			);
			whiteNoiseRef.current.volume = whiteNoiseVolumeRef.current;
		}

		if (newVolume > 0 && jumpScareAmbianceRef.current.paused) {
			jumpScareAmbianceRef.current.play().catch(() => {});
		}
	});

	useFrame(({ camera }, delta) => {
		if (useGame.getState().isCameraLocked) {
			const targetLookAt = new THREE.Vector3(10.77, 1.5, 100);

			lerpTimeRef.current = Math.min(lerpTimeRef.current + delta, 2);

			const progress = lerpTimeRef.current / 2;
			const easeOutFactor = 1 - Math.pow(1 - progress, 3);

			const currentRotation = camera.quaternion.clone();
			const targetQuaternion = new THREE.Quaternion();

			camera.lookAt(targetLookAt);
			targetQuaternion.copy(camera.quaternion);

			camera.quaternion.copy(currentRotation);
			camera.quaternion.slerp(targetQuaternion, easeOutFactor);
		} else {
			lerpTimeRef.current = 0;
		}
	});

	useEffect(() => {
		if (!soundsReady) return;

		if (playIntro) {
			const sequence = async () => {
				const setCameraLocked = useGame.getState().setCameraLocked;
				setIntroIsPlaying(true);
				setCameraLocked(true);
				setReceptionLight1(receptionLight1.color, 0);
				setFlashlightEnabled(false);
				setIsDistorting(true);
				setCursor('hidden');

				vibrateControllers(0.7, 100);

				// Start white noise with fade in
				whiteNoiseRef.current.play().catch(() => {});
				whiteNoiseRef.current.currentTime = 0.2;
				whiteNoiseVolumeRef.current = 0.5;
				whiteNoiseRef.current.volume = whiteNoiseVolumeRef.current;

				await new Promise((resolve) => setTimeout(resolve, 200));
				setIsDistorting(false);
				setIsNeonFlickering(true);

				vibrateControllers(0.4, 500);

				const startTime = Date.now();
				const flickerInterval = setInterval(() => {
					const intensity = Math.random() < 0.5 ? 0 : Math.random() * 0.8 + 0.2;
					setReceptionLight1(receptionLight1.color, intensity);
					if (Date.now() - startTime > 1000) {
						clearInterval(flickerInterval);
						setReceptionLight1(receptionLight1.color, 1);
						setIsNeonFlickering(false);
					}
				}, 50);
				await new Promise((resolve) => setTimeout(resolve, 2000));
				const flashlightStartTime = Date.now();
				const flashlightFlickerInterval = setInterval(() => {
					setFlashlightEnabled(Math.random() < 0.5);
					if (Date.now() - flashlightStartTime > 500) {
						clearInterval(flashlightFlickerInterval);
						setFlashlightEnabled(true);
						setCameraLocked(false);
						setCursor(null);
						setIntroIsPlaying(false);
					}
				}, 50);
			};
			sequence();
			setPlayIntro(false);
		}
	}, [
		playIntro,
		setReceptionLight1,
		setFlashlightEnabled,
		receptionLight1.color,
		setCursor,
		setPlayIntro,
		soundsReady,
		setIntroIsPlaying,
	]);

	return (
		<EffectComposer multisampling={0} stencilBuffer={false} autoClear={true}>
			{/* <ChromaticAberration offset={[0.001, 0.001]} /> */}
			<FOVDistortion playIntro={playIntro} />
			{/* <CustomBlur /> */}
			<Saturation isListening={isListening} />
			{/* <Noise opacity={performanceMode ? 0.1 : 0.05} /> */}
			<Glitch strength={glitchStrength} columns={jumpScare ? 0.05 : 0} />
			<Vignette />
		</EffectComposer>
	);
};

export default PostProcessing;
