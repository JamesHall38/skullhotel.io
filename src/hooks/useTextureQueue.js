import { create } from 'zustand';

const useTextureQueue = create((set, get) => ({
	queues: {},
	componentQueue: [],
	currentComponent: null,
	componentTimeout: null,

	addComponent: (componentName) => {
		set((state) => ({
			componentQueue: [...state.componentQueue, componentName],
		}));
		get().processComponentQueue();
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

		// Trigger processing for the new component
		get().processQueue(nextComponent);
	},

	completeComponent: () => {
		// Clear any existing timeout
		if (get().componentTimeout) {
			clearTimeout(get().componentTimeout);
		}

		// Use rAF as a fallback for requestIdleCallback
		const timeout = requestAnimationFrame(() => {
			set({ currentComponent: null, componentTimeout: null });
			get().processComponentQueue();
		});

		set({ componentTimeout: timeout });
	},

	addToQueue: (items, queueId) => {
		set((state) => {
			const queue = state.queues[queueId] || {
				queue: [],
				currentlyLoading: null,
				isProcessing: false,
			};
			return {
				queues: {
					...state.queues,
					[queueId]: {
						...queue,
						queue: [...queue.queue, ...items],
					},
				},
			};
		});

		// Only process if this is the current component
		if (queueId === get().currentComponent) {
			get().processQueue(queueId);
		}
	},

	processQueue: (queueId) => {
		const state = get();
		const queue = state.queues[queueId];

		// Only process if this is the current component
		if (queueId !== state.currentComponent) {
			return;
		}
		if (!queue || queue.isProcessing || queue.queue.length === 0) {
			return;
		}

		set((state) => ({
			queues: {
				...state.queues,
				[queueId]: {
					...queue,
					isProcessing: true,
					currentlyLoading: queue.queue[0],
				},
			},
		}));
	},

	completeCurrentItem: (queueId) => {
		const state = get();
		const queue = state.queues[queueId];

		if (!queue) return;

		// if (queue.currentlyLoading) {
		// 	console.log(
		// 		`✅ Loaded texture: ${queue.currentlyLoading.label} (${queue.currentlyLoading.name})`
		// 	);
		// }

		const remainingItems = queue.queue.length - 1;

		set((state) => ({
			queues: {
				...state.queues,
				[queueId]: {
					...queue,
					queue: queue.queue.slice(1),
					currentlyLoading: null,
					isProcessing: false,
				},
			},
		}));

		// If the queue is empty, complete the component
		if (remainingItems === 0) {
			get().completeComponent();
		} else {
			get().processQueue(queueId);
		}
	},

	getCurrentItem: (queueId) => {
		const state = get();
		return state.queues[queueId]?.currentlyLoading;
	},
}));

export default useTextureQueue;
