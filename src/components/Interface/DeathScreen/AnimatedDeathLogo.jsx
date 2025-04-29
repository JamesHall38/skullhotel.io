import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './AnimatedDeathLogo.css';

const AnimatedDeathLogo = ({ onComplete }) => {
	const logoRef = useRef(null);

	useGSAP(
		() => {
			if (!logoRef.current) return;

			const paths = gsap.utils.toArray(
				logoRef.current.querySelectorAll('path')
			);

			gsap.set(paths, {
				strokeDasharray: 1500,
				strokeDashoffset: 1500,
			});

			const tl = gsap.timeline({
				delay: 0.7,
				onComplete: () => {
					if (onComplete && typeof onComplete === 'function') {
						onComplete();
					}
				},
			});

			const leftPaths = paths.slice(0, 4);
			const rightPaths = paths.slice(4);

			tl.to([leftPaths, rightPaths], {
				strokeDashoffset: 0,
				opacity: 1,
				duration: 1.5,
				stagger: {
					each: 0.1,
					from: 'start',
				},
				ease: 'power2.inOut',
			});

			tl.to(
				paths,
				{
					duration: 0.8,
					ease: 'power1.inOut',
				},
				'-=0.5'
			);

			return tl;
		},
		{ scope: logoRef }
	);

	return (
		<svg
			ref={logoRef}
			className="animated-death-logo"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 732 85"
		>
			<path
				d="m 316.58999,41.889059 29.71966,29.657553 39.87029,-39.504278 10.17634,10.184203 -9.90064,9.897552 -40.382,-39.804372 -29.63556,29.554102 -299.490852,0.02454 -7.0268995,-7.13963 -7.1020533,7.214784 7.1772078,6.951746 6.932764,-7.028385"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="m 71.285202,32.438524 239.933548,0.09273 28.4375,-27.90625"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="M 71.285202,51.07573 311.21875,50.983 l 28.4375,27.90625"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="m 415.62023,41.889059 -29.71966,29.657553 -39.87029,-39.504278 -10.17634,10.184203 9.90064,9.897552 40.382,-39.804372 29.63556,29.554102 299.49085,0.02454 7.0269,-7.13963 7.10206,7.214784 -7.17721,6.951746 -6.93277,-7.028385"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="m 660.92502,32.438524 -239.93355,0.09273 -28.4375,-27.90625"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="M 660.92502,51.07573 420.99147,50.983 392.55397,78.88925"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="m 365.2636,83.139385 10.57216,-10.972123 -9.3982,-9.817388 -9.69369,9.94997 11.24872,10.706959"
				stroke="#C83534"
				strokeWidth={5}
			/>
			<path
				d="m 365.12344,1.3605467 10.57216,10.9721233 -9.3982,9.817388 -9.69369,-9.94997 11.24872,-10.7069593"
				stroke="#C83534"
				strokeWidth={5}
			/>
		</svg>
	);
};

export default AnimatedDeathLogo;
