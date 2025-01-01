import { useMemo, useEffect, useState } from 'react';
import {
	EffectComposer,
	ChromaticAberration,
	Vignette,
	Noise,
	Glitch,
} from '@react-three/postprocessing';
import { Effect, BlendFunction } from 'postprocessing';
import { Uniform } from 'three';
import useMonster from '../../hooks/useMonster';
import useLight from '../../hooks/useLight';
import { useFrame } from '@react-three/fiber';
import { useControls, button } from 'leva';
import useGame from '../../hooks/useGame';
import useInterface from '../../hooks/useInterface';

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

const createBlurEffect = () => {
	return new Effect(
		'CustomBlurEffect',
		/* glsl */ `
		uniform float intensity;
		uniform float vignetteRadius;
		uniform float vignetteSoftness;
		uniform float vignetteStrength;

		void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
			vec2 center = vec2(0.5);
			float dist = distance(uv, center);
			
			float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
			float vignetteBlur = vignetteFactor * vignetteStrength;
			float finalIntensity = mix(intensity, max(intensity, vignetteBlur), vignetteFactor);
			
			vec2 offset1 = vec2(1.0, 1.0) * finalIntensity * 0.01;
			vec2 offset2 = vec2(-1.0, 1.0) * finalIntensity * 0.01;
			
			vec4 color1 = texture2D(inputBuffer, uv + offset1);
			vec4 color2 = texture2D(inputBuffer, uv - offset1);
			vec4 color3 = texture2D(inputBuffer, uv + offset2);
			vec4 color4 = texture2D(inputBuffer, uv - offset2);
			
			outputColor = (inputColor + color1 + color2 + color3 + color4) / 5.0;
		}
	`,
		{
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([
				['intensity', new Uniform(0.0)],
				['vignetteRadius', new Uniform(0.5)],
				['vignetteSoftness', new Uniform(0.5)],
				['vignetteStrength', new Uniform(0.0)],
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

const CustomBlur = () => {
	const { intensity, vignetteRadius, vignetteSoftness, vignetteStrength } =
		useControls('Blur Effect', {
			intensity: {
				value: 0,
				min: 0,
				max: 5,
				step: 0.1,
				label: 'Base Blur',
			},
			vignetteRadius: {
				value: 0.3,
				min: 0,
				max: 1,
				step: 0.01,
				label: 'Vignette Radius',
			},
			vignetteSoftness: {
				value: 0.15,
				min: 0,
				max: 1,
				step: 0.01,
				label: 'Vignette Softness',
			},
			vignetteStrength: {
				value: 0.5,
				min: 0,
				max: 5,
				step: 0.1,
				label: 'Vignette Strength',
			},
		});

	const effect = useMemo(() => createBlurEffect(), []);

	useEffect(() => {
		effect.uniforms.get('intensity').value = intensity;
		effect.uniforms.get('vignetteRadius').value = vignetteRadius;
		effect.uniforms.get('vignetteSoftness').value = vignetteSoftness;
		effect.uniforms.get('vignetteStrength').value = vignetteStrength;
	}, [effect, intensity, vignetteRadius, vignetteSoftness, vignetteStrength]);

	return <primitive object={effect} />;
};

const PostProcessing = () => {
	const monsterState = useMonster((state) => state.monsterState);
	const { playIntro } = useGame();
	const [isNeonFlickering, setIsNeonFlickering] = useState(false);
	const [isDistorting, setIsDistorting] = useState(false);
	const setReceptionLight1 = useLight((state) => state.setReceptionLight1);
	const setFlashlightEnabled = useLight((state) => state.setFlashlightEnabled);
	const receptionLight1 = useLight((state) => state.receptionLight1);
	const setCursor = useInterface((state) => state.setCursor);
	const setPlayIntro = useGame((state) => state.setPlayIntro);

	useControls({
		'Play Intro Animation': button(() => {
			setPlayIntro(true);
		}),
	});

	useEffect(() => {
		if (playIntro) {
			// Animation sequence
			const sequence = async () => {
				// Start with lights off and cursor hidden
				setReceptionLight1(receptionLight1.color, 0);
				setFlashlightEnabled(false);
				setIsDistorting(true);
				setCursor('hidden'); // Hide cursor

				// Wait
				await new Promise((resolve) => setTimeout(resolve, 200));
				setIsDistorting(false);

				// Neon flicker effect
				setIsNeonFlickering(true);
				const startTime = Date.now();
				const flickerInterval = setInterval(() => {
					const intensity = Math.random() < 0.5 ? 0 : Math.random() * 0.8 + 0.2;
					setReceptionLight1(receptionLight1.color, intensity);

					if (Date.now() - startTime > 1000) {
						clearInterval(flickerInterval);
						setReceptionLight1(receptionLight1.color, 1);
						setIsNeonFlickering(false);
						setCursor(null); // Show help cursor once neon is fully on
					}
				}, 50);

				// Wait
				await new Promise((resolve) => setTimeout(resolve, 2000));

				// Flashlight flicker effect
				const flashlightStartTime = Date.now();
				const flashlightFlickerInterval = setInterval(() => {
					setFlashlightEnabled(Math.random() < 0.5);

					if (Date.now() - flashlightStartTime > 500) {
						clearInterval(flashlightFlickerInterval);
						setFlashlightEnabled(true);
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
	]);

	return (
		<EffectComposer multisampling={0} stencilBuffer={false} autoClear={true}>
			<ChromaticAberration offset={[0.001, 0.001]} />
			<FOVDistortion playIntro={playIntro} />
			<CustomBlur />
			<Noise opacity={0.1} />
			<Glitch
				strength={
					isDistorting || isNeonFlickering
						? 0.2
						: monsterState === 'run' || monsterState === 'chase'
						? 0.2
						: 0
				}
				columns={monsterState === 'run' || monsterState === 'chase' ? 0.2 : 0}
			/>
			<Vignette />
		</EffectComposer>
	);
};

export default PostProcessing;
