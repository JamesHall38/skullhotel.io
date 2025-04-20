import { create } from 'zustand';

const useTextureQueue = create((set, get) => ({
	queues: {},
	componentQueue: [],
	currentComponent: null,
	totalItemsToLoad: 0,
	loadedItems: 0,

	addComponent: (componentName) => {
		const state = get();
		if (!state.queues[componentName]) {
			set((state) => ({
				queues: {
					...state.queues,
					[componentName]: {
						queue: [],
						currentlyLoading: null,
						isProcessing: false,
						retryCount: 0,
						loadedItems: [],
					},
				},
				componentQueue: [...state.componentQueue, componentName],
			}));

			if (!state.currentComponent) {
				setTimeout(() => get().processComponentQueue(), 0);
			}
		}
	},

	processComponentQueue: () => {
		const state = get();
		if (state.currentComponent) {
			return;
		}
		if (state.componentQueue.length === 0) {
			return;
		}

		const nextComponent = state.componentQueue[0];

		set((state) => ({
			currentComponent: nextComponent,
			componentQueue: state.componentQueue.slice(1),
		}));

		const componentQueue = get().queues[nextComponent];
		if (!componentQueue?.queue?.length) {
			return;
		}

		get().processQueue(nextComponent);
	},

	addToQueue: (items, componentName) => {
		const state = get();
		const queue = state.queues[componentName];

		if (!queue) {
			console.error(`[TextureQueue] Queue ${componentName} does not exist`);
			return;
		}

		set((state) => {
			const updatedQueue = {
				...state.queues[componentName],
				queue: [...state.queues[componentName].queue, ...items],
			};

			return {
				queues: {
					...state.queues,
					[componentName]: updatedQueue,
				},
				totalItemsToLoad: state.totalItemsToLoad + items.length,
			};
		});

		const updatedState = get();
		const updatedQueue = updatedState.queues[componentName];
		if (
			updatedState.currentComponent === componentName &&
			!updatedQueue.isProcessing
		) {
			get().processQueue(componentName);
		}
	},

	processQueue: async (componentName) => {
		const state = get();
		const queue = state.queues[componentName];

		if (!queue || queue.isProcessing || !queue.queue.length) {
			if (queue && !queue.queue.length && !queue.isProcessing) {
				get().completeComponent(componentName);
			}
			return;
		}

		const nextItem = queue.queue[0];

		set((state) => ({
			queues: {
				...state.queues,
				[componentName]: {
					...state.queues[componentName],
					currentlyLoading: nextItem,
					isProcessing: true,
					queue: state.queues[componentName].queue.slice(1),
				},
			},
		}));

		try {
			await new Promise((resolve) => setTimeout(resolve, 100));

			set((state) => {
				const loadedCount = state.loadedItems + 1;

				return {
					queues: {
						...state.queues,
						[componentName]: {
							...state.queues[componentName],
							currentlyLoading: null,
							isProcessing: false,
							loadedItems: [
								...(state.queues[componentName].loadedItems || []),
								nextItem,
							],
						},
					},
					loadedItems: loadedCount,
				};
			});

			get().processQueue(componentName);
		} catch (error) {
			console.error(
				`[TextureQueue] Error processing item for ${componentName}:`,
				error
			);
			set((state) => ({
				queues: {
					...state.queues,
					[componentName]: {
						...state.queues[componentName],
						isProcessing: false,
						retryCount: state.queues[componentName].retryCount + 1,
					},
				},
			}));
		}
	},

	completeComponent: (componentName) => {
		set((state) => ({
			queues: {
				...state.queues,
				[componentName]: {
					...state.queues[componentName],
					isProcessing: false,
					completed: true,
				},
			},
			currentComponent: null,
		}));

		setTimeout(() => get().processComponentQueue(), 0);
	},
}));

export default useTextureQueue;
