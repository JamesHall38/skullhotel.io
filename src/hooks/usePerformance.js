const TARGET_FPS = 60;
const MEASUREMENT_WINDOW = 500;

export function measurePerformance() {
	return new Promise((resolve) => {
		let frames = 0;
		let lastTime = performance.now();
		let measurements = [];

		const measure = () => {
			const currentTime = performance.now();
			frames++;

			// every 500ms, calculate the fps
			if (currentTime - lastTime >= MEASUREMENT_WINDOW) {
				const fps = (frames * 1000) / (currentTime - lastTime);
				measurements.push(fps);
				frames = 0;
				lastTime = currentTime;

				// after 3 measurements, make a decision
				if (measurements.length >= 3) {
					const avgFPS =
						measurements.reduce((a, b) => a + b) / measurements.length;
					resolve(avgFPS >= TARGET_FPS);
					return;
				}
			}

			requestAnimationFrame(measure);
		};

		requestAnimationFrame(measure);
	});
}
