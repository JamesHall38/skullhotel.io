import { db } from './config';
import {
	collection,
	addDoc,
	query,
	orderBy,
	limit,
	startAfter,
	startAt,
	getDocs,
	serverTimestamp,
	getCountFromServer,
} from 'firebase/firestore';

const COLLECTION_NAME = 'guestbook';
const DEBUG_COLLECTION_NAME = 'guestbook_debug';
export const PAGE_SIZE = 10;
const MIN_VALID_GAME_DURATION = 0;
const MAX_VALID_GAME_DURATION = 604800;

export const NAME_VALIDATION_RULES = {
	minLength: 2,
	maxLength: 30,
	pattern: /^[a-zA-Z0-9\s._-]+$/,
	patternMessage: 'Use only letters, numbers, spaces, and common symbols (._-)',
};

export const isValidPlayerName = (name) => {
	if (!name || typeof name !== 'string') return false;
	const trimmed = name.trim();
	return (
		trimmed.length >= NAME_VALIDATION_RULES.minLength &&
		trimmed.length <= NAME_VALIDATION_RULES.maxLength &&
		NAME_VALIDATION_RULES.pattern.test(trimmed)
	);
};

const isValidGameTime = (startTime, endTime) => {
	if (
		!startTime ||
		!endTime ||
		typeof startTime !== 'number' ||
		typeof endTime !== 'number'
	)
		return false;

	const duration = Math.floor((endTime - startTime) / 1000);
	return (
		duration >= MIN_VALID_GAME_DURATION && duration <= MAX_VALID_GAME_DURATION
	);
};

export const addGuestBookEntry = async (
	playerName,
	startTime,
	endTime,
	deaths = 0
) => {
	console.log('deaths', deaths);
	if (!isValidPlayerName(playerName)) {
		throw new Error(
			`Invalid player name. ${NAME_VALIDATION_RULES.patternMessage} (${NAME_VALIDATION_RULES.minLength}-${NAME_VALIDATION_RULES.maxLength} characters)`
		);
	}

	if (!isValidGameTime(startTime, endTime)) {
		throw new Error('Invalid game duration');
	}

	try {
		const isDebugMode = window.location.hash === '#debug';
		const collectionToUse = isDebugMode
			? DEBUG_COLLECTION_NAME
			: COLLECTION_NAME;

		const docRef = await addDoc(collection(db, collectionToUse), {
			playerName: playerName.trim(),
			startTime: startTime,
			endTime: endTime,
			deaths: deaths,
			createdAt: serverTimestamp(),
		});

		return docRef.id;
	} catch (error) {
		console.error('Error adding guestbook entry: ', error);
		throw error;
	}
};

export const getTotalEntries = async () => {
	try {
		const isDebugMode = window.location.hash === '#debug';
		const collectionToUse = isDebugMode
			? DEBUG_COLLECTION_NAME
			: COLLECTION_NAME;

		const coll = collection(db, collectionToUse);
		const snapshot = await getCountFromServer(coll);
		return snapshot.data().count;
	} catch (error) {
		console.error('Error getting total entries count:', error);
		throw error;
	}
};

export const getTotalPages = async () => {
	const total = await getTotalEntries();
	return Math.ceil(total / PAGE_SIZE);
};

export const getFirstGuestBookPage = async () => {
	try {
		const isDebugMode = window.location.hash === '#debug';
		const collectionToUse = isDebugMode
			? DEBUG_COLLECTION_NAME
			: COLLECTION_NAME;

		const q = query(
			collection(db, collectionToUse),
			orderBy('createdAt', 'asc'),
			limit(PAGE_SIZE)
		);

		const querySnapshot = await getDocs(q);
		const entries = processQuerySnapshot(querySnapshot);
		const lastVisible =
			entries.length > 0
				? querySnapshot.docs[querySnapshot.docs.length - 1]
				: null;

		const totalEntries = await getTotalEntries();
		const totalPages = Math.ceil(totalEntries / PAGE_SIZE);

		return {
			entries,
			lastVisible,
			currentPage: 1,
			totalPages,
		};
	} catch (error) {
		console.error('Error getting first guestbook page:', error);
		throw error;
	}
};

export const getNextGuestBookPage = async (lastVisible, currentPage) => {
	if (!lastVisible) {
		return {
			entries: [],
			lastVisible: null,
			currentPage,
			totalPages: currentPage,
		};
	}

	try {
		const isDebugMode = window.location.hash === '#debug';
		const collectionToUse = isDebugMode
			? DEBUG_COLLECTION_NAME
			: COLLECTION_NAME;

		const q = query(
			collection(db, collectionToUse),
			orderBy('createdAt', 'asc'),
			startAfter(lastVisible),
			limit(PAGE_SIZE)
		);

		const querySnapshot = await getDocs(q);
		const entries = processQuerySnapshot(querySnapshot);
		const newLastVisible =
			entries.length > 0
				? querySnapshot.docs[querySnapshot.docs.length - 1]
				: null;
		const newCurrentPage = currentPage + 1;

		const totalPages = await getTotalPages();

		return {
			entries,
			lastVisible: newLastVisible,
			currentPage: newCurrentPage,
			totalPages,
		};
	} catch (error) {
		console.error('Error getting next guestbook page:', error);
		throw error;
	}
};

let paginationCache = {};

export const getSpecificPage = async (pageNumber) => {
	if (pageNumber < 1) pageNumber = 1;

	try {
		if (pageNumber === 1) {
			return await getFirstGuestBookPage();
		}

		const isDebugMode = window.location.hash === '#debug';
		const cacheKey = isDebugMode ? `debug_${pageNumber}` : pageNumber;

		if (paginationCache[cacheKey]) {
			const collectionToUse = isDebugMode
				? DEBUG_COLLECTION_NAME
				: COLLECTION_NAME;

			const q = query(
				collection(db, collectionToUse),
				orderBy('createdAt', 'asc'),
				startAt(paginationCache[cacheKey]),
				limit(PAGE_SIZE)
			);

			const querySnapshot = await getDocs(q);
			const entries = processQuerySnapshot(querySnapshot);
			const lastVisible =
				entries.length > 0
					? querySnapshot.docs[querySnapshot.docs.length - 1]
					: null;
			const totalPages = await getTotalPages();

			return { entries, lastVisible, currentPage: pageNumber, totalPages };
		}

		let result = await getFirstGuestBookPage();
		let currentPage = 1;

		if (result.lastVisible) {
			const cacheKey = isDebugMode ? `debug_${currentPage}` : currentPage;
			paginationCache[cacheKey] = result.lastVisible;
		}

		while (currentPage < pageNumber && result.lastVisible) {
			result = await getNextGuestBookPage(result.lastVisible, currentPage);
			currentPage++;

			if (result.lastVisible) {
				const cacheKey = isDebugMode ? `debug_${currentPage}` : currentPage;
				paginationCache[cacheKey] = result.lastVisible;
			}
		}

		return result;
	} catch (error) {
		console.error(`Error getting page ${pageNumber}:`, error);
		throw error;
	}
};

function processQuerySnapshot(querySnapshot) {
	const entries = [];

	querySnapshot.forEach((doc) => {
		const data = doc.data();
		const completionTimeSeconds =
			data.endTime && data.startTime
				? Math.floor((data.endTime - data.startTime) / 1000)
				: 0;

		entries.push({
			id: doc.id,
			...data,
			completionTimeSeconds,
			formattedTime: formatTime(completionTimeSeconds),
		});
	});

	return entries;
}

export const formatTime = (timeInSeconds) => {
	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = Math.floor(timeInSeconds % 60);
	return `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`;
};
