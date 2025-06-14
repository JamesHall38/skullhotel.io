import { useRef, useEffect, useCallback, useState } from 'react';
import useGridStore from './useGrid';
import PathfindingWorker from '../workers/pathfinding-worker.js?worker';

let workerInstance = null;
let messageId = 0;
const pendingRequests = new Map();

const usePathfindingWorker = () => {
	const workerRef = useRef(null);
	const [isWorkerReady, setIsWorkerReady] = useState(false);
	const gridState = useGridStore((state) => state);

	useEffect(() => {
		if (!workerInstance) {
			try {
				workerInstance = new PathfindingWorker();

				workerInstance.onmessage = (e) => {
					const { type, data, id, error } = e.data;

					if (pendingRequests.has(id)) {
						const { resolve, reject } = pendingRequests.get(id);
						pendingRequests.delete(id);

						switch (type) {
							case 'PATH_FOUND':
								resolve(data);
								break;
							case 'GRID_UPDATED':
								resolve();
								break;
							case 'CACHE_CLEARED':
								resolve();
								break;
							case 'ERROR':
								reject(new Error(error));
								break;
							default:
								reject(new Error(`Unknown response type: ${type}`));
						}
					}
				};

				workerInstance.onerror = (error) => {
					console.error('Pathfinding worker error:', error);
					// Reject all pending requests
					for (const [id, { reject }] of pendingRequests) {
						reject(new Error('Worker error'));
					}
					pendingRequests.clear();
				};

				setIsWorkerReady(true);
			} catch (error) {
				console.error('Failed to create pathfinding worker:', error);
				setIsWorkerReady(false);
			}
		}

		workerRef.current = workerInstance;

		return () => {
			// Don't terminate the worker on component unmount
			// Keep it alive for other components
		};
	}, []);

	// Update grid data in worker when it changes
	useEffect(() => {
		if (
			isWorkerReady &&
			workerRef.current &&
			gridState &&
			gridState.isInitialized
		) {
			const gridData = {
				cells: gridState.grid || {},
				debugMode: window.location.hash.includes('#debug'),
			};

			updateGridInWorker(gridData);
		}
	}, [isWorkerReady, gridState.grid, gridState.isInitialized]);

	const sendMessage = useCallback(
		(type, data) => {
			return new Promise((resolve, reject) => {
				if (!workerRef.current || !isWorkerReady) {
					reject(new Error('Worker not ready'));
					return;
				}

				const id = ++messageId;
				pendingRequests.set(id, { resolve, reject });

				setTimeout(() => {
					if (pendingRequests.has(id)) {
						pendingRequests.delete(id);
						reject(new Error('Worker request timeout'));
					}
				}, 5000); // 5 second timeout

				workerRef.current.postMessage({ type, data, id });
			});
		},
		[isWorkerReady]
	);

	const updateGridInWorker = useCallback(
		async (gridData) => {
			try {
				await sendMessage('UPDATE_GRID', gridData);
			} catch (error) {
				console.error('Failed to update grid in worker:', error);
			}
		},
		[sendMessage]
	);

	const findPath = useCallback(
		async (startX, startZ, targetX, targetZ) => {
			try {
				const path = await sendMessage('FIND_PATH', {
					startX,
					startZ,
					targetX,
					targetZ,
				});
				return path;
			} catch (error) {
				console.error('Pathfinding worker error:', error);
				return createFallbackPath(startX, startZ, targetX, targetZ);
			}
		},
		[sendMessage]
	);

	const clearCache = useCallback(async () => {
		try {
			await sendMessage('CLEAR_CACHE');
		} catch (error) {
			console.error('Failed to clear pathfinding cache:', error);
		}
	}, [sendMessage]);

	return {
		findPath,
		clearCache,
		updateGridInWorker,
		isWorkerReady,
	};
};

// Fallback function if worker fails
const createFallbackPath = (startX, startZ, targetX, targetZ) => {
	const dx = targetX - startX;
	const dz = targetZ - startZ;
	const distance = Math.sqrt(dx * dx + dz * dz);

	const dirX = dx / distance;
	const dirZ = dz / distance;

	const directPath = [];
	directPath.push({ x: startX, z: startZ, cost: 1, weight: 1 });

	const numPoints = 3;
	for (let i = 1; i < numPoints; i++) {
		const ratio = i / numPoints;
		const intermediateX = startX + dirX * distance * ratio;
		const intermediateZ = startZ + dirZ * distance * ratio;
		directPath.push({
			x: intermediateX,
			z: intermediateZ,
			cost: 1,
			weight: 1,
			forcedPath: true,
		});
	}

	directPath.push({
		x: targetX,
		z: targetZ,
		cost: 1,
		weight: 1,
		forcedPath: true,
	});

	return directPath;
};

export default usePathfindingWorker;
