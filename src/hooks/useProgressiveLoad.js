import { useState, useEffect, useRef } from 'react';
import useTextureQueue from './useTextureQueue';

const FPS_THRESHOLD = 30; // Consider system stable if FPS is above this
const STABILITY_FRAMES = 4; // Number of stable frames needed
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export default function useProgressiveLoad(items, componentName = '') {
	const [loadedItems, setLoadedItems] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const [isStable, setIsStable] = useState(false);
	const frameCount = useRef(0);
	const lastTime = useRef(performance.now());
	const itemsRef = useRef(items);
	const hasAddedToQueue = useRef(false);
	const retryCount = useRef(0);
	const mountedRef = useRef(true);

	const addToQueue = useTextureQueue((state) => state.addToQueue);
	const currentComponent = useTextureQueue((state) => state.currentComponent);
	const addComponent = useTextureQueue((state) => state.addComponent);
	const completeComponent = useTextureQueue((state) => state.completeComponent);
	const queues = useTextureQueue((state) => state.queues);
	const currentQueue = queues[componentName];

	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
			// Reset state on unmount
			hasAddedToQueue.current = false;
			retryCount.current = 0;
		};
	}, [componentName, items.length]);

	useEffect(() => {
		if (mountedRef.current) {
			addComponent(componentName);
		}
	}, [addComponent, componentName]);

	useEffect(() => {
		const checkStability = (time) => {
			if (!mountedRef.current) return;

			const deltaTime = time - lastTime.current;
			lastTime.current = time;

			const fps = 1000 / deltaTime;

			if (fps >= FPS_THRESHOLD) {
				frameCount.current++;
				if (frameCount.current >= STABILITY_FRAMES) {
					setIsStable(true);
				}
			} else {
				frameCount.current = 0;
				setIsStable(false);
			}

			if (!isStable) {
				requestAnimationFrame(checkStability);
			}
		};

		requestAnimationFrame(checkStability);
	}, [isStable]);

	useEffect(() => {
		const addItemsToQueue = () => {
			if (!mountedRef.current) return;

			if (currentComponent === componentName && !hasAddedToQueue.current) {
				const formattedItems = items.map((item) => ({
					...item,
					componentName,
					label: `${componentName} - ${item.label || item.name}`,
					id: item.path || `${componentName}-${item.name}`,
				}));

				const uniqueItems = formattedItems.filter((item) => {
					const isInQueue = !Object.values(queues).some(
						(queue) =>
							queue.queue.some((qItem) => qItem.id === item.id) ||
							(queue.currentlyLoading && queue.currentlyLoading.id === item.id)
					);
					return isInQueue;
				});

				if (uniqueItems.length > 0) {
					try {
						addToQueue(uniqueItems, componentName);
						itemsRef.current = uniqueItems;
						hasAddedToQueue.current = true;
					} catch (error) {
						console.error(
							`[${componentName}] Failed to add items to queue:`,
							error
						);
						if (retryCount.current < MAX_RETRIES && mountedRef.current) {
							retryCount.current++;
							setTimeout(addItemsToQueue, RETRY_DELAY);
						} else {
							console.error(
								`[${componentName}] Max retries reached or component unmounted`
							);
							if (mountedRef.current) {
								setIsLoading(false);
								setProgress(100);
							}
						}
					}
				} else {
					if (mountedRef.current) {
						setIsLoading(false);
						setProgress(100);
						completeComponent(componentName);
					}
				}
			}
		};

		addItemsToQueue();
	}, [
		currentComponent,
		componentName,
		items,
		addToQueue,
		completeComponent,
		queues,
	]);

	useEffect(() => {
		if (currentQueue && mountedRef.current) {
			const totalItems = itemsRef.current.length;
			const loadedCount = currentQueue.loadedItems?.length || 0;
			const newProgress = Math.round((loadedCount / totalItems) * 100);

			setProgress(newProgress);
			setLoadedItems(currentQueue.loadedItems || []);
			setIsLoading(newProgress < 100);
		}
	}, [currentQueue]);

	return {
		loadedItems,
		isLoading,
		progress,
		isStable,
	};
}
