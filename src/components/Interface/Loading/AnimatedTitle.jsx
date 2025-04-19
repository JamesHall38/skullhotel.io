import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import './AnimatedTitle.css';

const AnimatedTitle = ({ onComplete }) => {
	const titleRef = useRef(null);

	useGSAP(
		() => {
			if (!titleRef.current) return;

			const paths = gsap.utils.toArray(
				titleRef.current.querySelectorAll('path')
			);

			gsap.set(paths, {
				strokeDasharray: 1500,
				strokeDashoffset: 1500,
			});

			const tl = gsap.timeline({
				delay: 0.2,
				onComplete: () => {
					if (onComplete && typeof onComplete === 'function') {
						onComplete();
					}
				},
			});

			const shuffledPaths = [...paths].sort(() => Math.random() - 0.5);

			const randomGroupCount = Math.floor(Math.random() * 2) + 3;
			const pathGroups = [];

			for (let i = 0; i < randomGroupCount; i++) {
				pathGroups.push([]);
			}

			shuffledPaths.forEach((path) => {
				const randomGroupIndex = Math.floor(Math.random() * randomGroupCount);
				pathGroups[randomGroupIndex].push(path);
			});

			const filteredGroups = pathGroups.filter((group) => group.length > 0);

			filteredGroups.sort(() => Math.random() - 0.5);

			filteredGroups.forEach((group, groupIndex) => {
				const groupDelay = groupIndex * 0.75 + Math.random() * 0.3;

				tl.to(
					group,
					{
						strokeDashoffset: 0,
						duration: 4,
						stagger: {
							amount: 1.2,
							from: 'random',
						},
						ease: 'power2.inOut',
					},
					groupDelay
				);
			});

			return tl;
		},
		{ scope: titleRef }
	);

	return (
		<svg
			ref={titleRef}
			className="animated-title"
			xmlns="http://www.w3.org/2000/svg"
			width="732"
			height="81"
			viewBox="0 0 732 81"
			fill="none"
		>
			<path
				d="M 47.475342,12.361791 C 44.987338,5.0336391 14.309299,-4.010436 7.0200537,15.367756 -5.4295772,48.464646 49.920829,46.625127 41.639535,68.695728 38.042849,78.281309 11.204169,81.430395 3.784338,64.779692"
				strokeWidth={6.5}
			/>
			<path
				d="M 47.444881,12.564863 C 42.281611,1.762284 6.8230933,0.18492894 10.587028,18.859517 c 3.92545,19.475942 43.597234,17.542847 40.756113,40.598419 -2.819892,22.883298 -40.91402,22.447958 -47.62702,5.232906"
				strokeWidth={6.5}
			/>
			<path d="m 73.63288,2.2523095 0.0368,76.6099355" strokeWidth={6.5} />
			<path d="M 85.849979,2.2751761 86.001658,79.024451" strokeWidth={6.5} />
			<path d="M 126.42395,4.3228346 85.77414,50.281393" strokeWidth={6.5} />
			<path d="M 127.24832,76.827599 95.776779,40.005307" strokeWidth={6.5} />
			<path
				d="M 146.97541,2.1006311 C 145.98324,51.310802 142.815,77.770139 174.71486,77.114786 204.27957,76.507405 199.82063,49.831469 199.91927,2.1450567"
				strokeWidth={6.5}
			/>
			<path d="M 158.84144,2.3595623 159.05595,71.96665" strokeWidth={6.5} />
			<path d="m 226.45586,2.2751761 0.30336,76.5217569" strokeWidth={6.5} />
			<path d="M 238.96933,78.872772 238.74182,2.1993369" strokeWidth={6.5} />
			<path d="m 274.23456,75.687526 -38.52631,-0.07584" strokeWidth={6.5} />
			<path d="m 289.47824,2.1993369 0.22752,76.5217571" strokeWidth={6.5} />
			<path d="m 301.68836,2.2751761 0.22751,76.5975969" strokeWidth={6.5} />
			<path d="m 337.33278,75.839204 -37.9196,-0.303356" strokeWidth={6.5} />
			<path d="m 379.42354,2.2751761 0.15168,76.5975969" strokeWidth={6.5} />
			<path d="M 392.08869,78.948612 391.93701,2.1234977" strokeWidth={6.5} />
			<path d="m 433.04186,2.1993369 0.22751,76.6734361" strokeWidth={6.5} />
			<path d="m 391.78533,40.0431 h 41.71156" strokeWidth={6.5} />
			<path d="M 471.79569,10.162453 V 70.075425" strokeWidth={6.5} />
			<path
				d="m 467.31136,13.717584 c 14.8239,-16.4199278 43.86109,-11.1544817 54.66754,3.53172 15.54227,21.122284 7.34921,38.421383 -4.59124,50.641739 -12.49656,12.789495 -35.10006,12.252872 -46.81967,1.501539 -27.78256,-25.487169 -8.42161,-50.631294 -3.25663,-55.674998 z"
				strokeWidth={6.5}
			/>
			<path d="m 536.58592,5.1481359 63.38642,0.2145057" strokeWidth={6.5} />
			<path d="M 561.89758,79.045337 561.57583,2.7885736" strokeWidth={6.5} />
			<path d="M 574.33891,79.045337 574.01715,2.8958264" strokeWidth={6.5} />
			<path d="m 664.53854,5.4698944 -51.14882,0.196104" strokeWidth={6.5} />
			<path d="M 616.80025,78.872773 616.57273,2.4268545" strokeWidth={6.5} />
			<path d="M 664.57895,75.915044 613.615,75.763366" strokeWidth={6.5} />
			<path d="m 629.4654,2.5026937 0.0758,76.4459183" strokeWidth={6.5} />
			<path d="M 654.79569,40.194778 626.50767,40.0431" strokeWidth={6.5} />
			<path d="m 683.53875,2.1993369 0.0758,76.5217571" strokeWidth={6.5} />
			<path d="m 695.67302,2.1234977 0.30336,76.6734353" strokeWidth={6.5} />
			<path d="M 731.16577,76.066722 692.71529,75.460008" strokeWidth={6.5} />
		</svg>
	);
};

export default AnimatedTitle;
