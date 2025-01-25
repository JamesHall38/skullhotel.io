import { useState, useEffect, useRef } from 'react';
import useTextureQueue from './useTextureQueue';

const FPS_THRESHOLD = 30; // Consider system stable if FPS is above this
const STABILITY_FRAMES = 4; // Number of stable frames needed

export default function useProgressiveLoad(items, componentName = '') {
	const [loadedItems, setLoadedItems] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const [isStable, setIsStable] = useState(false);
	const frameCount = useRef(0);
	const lastTime = useRef(performance.now());
	const currentItemIndex = useRef(0);
	const itemsRef = useRef(items);
	const hasAddedToQueue = useRef(false);

	const addToQueue = useTextureQueue((state) => state.addToQueue);
	const getCurrentItem = useTextureQueue((state) => state.getCurrentItem);
	const completeCurrentItem = useTextureQueue(
		(state) => state.completeCurrentItem
	);
	const addComponent = useTextureQueue((state) => state.addComponent);
	const currentComponent = useTextureQueue((state) => state.currentComponent);

	// Add component to queue when component mounts
	useEffect(() => {
		addComponent(componentName);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty dependency array as we want this only on mount

	// Monitor FPS and system stability
	useEffect(() => {
		let animationFrameId;
		let isCheckingStability = true;

		const checkStability = () => {
			if (!isCheckingStability) return;

			const currentTime = performance.now();
			const deltaTime = currentTime - lastTime.current;
			const currentFPS = 1000 / deltaTime;

			if (currentFPS >= FPS_THRESHOLD) {
				frameCount.current++;
			} else {
				frameCount.current = Math.max(0, frameCount.current - 2);
			}

			if (frameCount.current >= STABILITY_FRAMES) {
				setIsStable(true);
				// Reset frame count for next stability check
				frameCount.current = 0;
			}

			lastTime.current = currentTime;
			animationFrameId = requestAnimationFrame(checkStability);
		};

		checkStability();

		return () => {
			isCheckingStability = false;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, []);

	// Add items to queue when component becomes current and system is stable
	useEffect(() => {
		if (
			currentComponent === componentName &&
			// isStable &&
			!hasAddedToQueue.current
		) {
			const formattedItems = items.map((item) => ({
				...item,
				componentName,
				label: `${componentName} - ${item.label || item.name}`,
			}));
			addToQueue(formattedItems, componentName);
			itemsRef.current = formattedItems;
			hasAddedToQueue.current = true;
			// Reset currentItemIndex when adding new items
			currentItemIndex.current = 0;
		}
	}, [currentComponent, isStable, componentName, items, addToQueue]);

	// Reset when component changes
	useEffect(() => {
		if (currentComponent === componentName) {
			setIsStable(false);
			frameCount.current = 0;
			hasAddedToQueue.current = false;
			// Reset progress and loaded items when component changes
			setProgress(0);
			setLoadedItems([]);
			currentItemIndex.current = 0;
		}
	}, [currentComponent, componentName]);

	// Process items when system is stable
	useEffect(() => {
		if (!isStable || componentName !== currentComponent) {
			return;
		}

		const currentItem = getCurrentItem(componentName);
		if (!currentItem) {
			return;
		}

		// Only process items that belong to this component
		if (currentItem.componentName === componentName) {
			const texture = currentItem.texture;

			if (texture) {
				// Check if texture is actually loaded
				if (!texture.image) {
					// If texture is not loaded yet, wait for it
					const checkTextureLoaded = () => {
						if (texture.image) {
							// Texture is loaded
							setLoadedItems((prev) => [...prev, currentItem]);

							// Update progress
							const newProgress =
								((currentItemIndex.current + 1) / itemsRef.current.length) *
								100;
							setProgress(Math.round(newProgress));

							currentItemIndex.current++;

							// Check if we're done loading
							if (currentItemIndex.current >= itemsRef.current.length) {
								setIsLoading(false);
							}

							// Reset stability check for next item
							setIsStable(false);
							frameCount.current = 0;

							// Mark item as complete in queue
							completeCurrentItem(componentName);
						} else {
							// Check again in the next frame
							requestAnimationFrame(checkTextureLoaded);
						}
					};

					checkTextureLoaded();
				} else {
					// Texture is already loaded
					setLoadedItems((prev) => [...prev, currentItem]);

					// Update progress
					const newProgress =
						((currentItemIndex.current + 1) / itemsRef.current.length) * 100;
					setProgress(Math.round(newProgress));

					currentItemIndex.current++;

					// Check if we're done loading
					// if (currentItemIndex.current >= itemsRef.current.length) {
					setIsLoading(false);
					// }

					// Reset stability check for next item
					setIsStable(false);
					frameCount.current = 0;

					// Mark item as complete in queue
					completeCurrentItem(componentName);
				}
			} else {
				// If there's no texture (like for components), just process it
				setLoadedItems((prev) => [...prev, currentItem]);

				// Update progress
				const newProgress =
					((currentItemIndex.current + 1) / itemsRef.current.length) * 100;
				setProgress(Math.round(newProgress));

				currentItemIndex.current++;

				// Check if we're done loading
				// if (currentItemIndex.current >= itemsRef.current.length) {
				setIsLoading(false);
				// }

				// Reset stability check for next item
				setIsStable(false);
				frameCount.current = 0;

				// Mark item as complete in queue
				completeCurrentItem(componentName);
			}
		}
	}, [
		isStable,
		componentName,
		getCurrentItem,
		completeCurrentItem,
		currentComponent,
	]);

	return {
		loadedItems,
		isLoading,
		progress,
		isStable,
	};
}
