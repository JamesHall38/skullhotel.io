import { db } from './config';
import {
	collection,
	addDoc,
	query,
	orderBy,
	limit,
	startAfter,
	getDocs,
	serverTimestamp,
	getCountFromServer,
	where,
	startAt,
	endAt,
} from 'firebase/firestore';

const BASE_COLLECTION_NAME = 'guestbook';
const DEBUG_SUFFIX = '_debug';
export const PAGE_SIZE = 20;
const MIN_VALID_GAME_DURATION = 0;
const MAX_VALID_GAME_DURATION = 604800;

const DEFAULT_VALIDATION_RULES = {
	minLength: 2,
	maxLength: 30,
	pattern: /^[a-zA-Z0-9\s._-]+$/,
	patternMessageKey: 'ui.guestbook.invalidName',
};

const ZH_VALIDATION_RULES = {
	minLength: 2,
	maxLength: 30,
	pattern: /^[\p{L}\p{N}\p{P}\p{S}\p{Zs}]+$/u,
	patternMessageKey: 'ui.guestbook.invalidNameZh',
};

export const NAME_VALIDATION_RULES = DEFAULT_VALIDATION_RULES;

export const getValidationRules = (language) => {
	if (language === 'zh') return ZH_VALIDATION_RULES;
	return DEFAULT_VALIDATION_RULES;
};

const getLanguageSuffix = (language) => {
	if (language === 'zh') return '_zh';
	return '';
};

export const isValidPlayerName = (name, language) => {
	if (!name || typeof name !== 'string') return false;
	const rules = getValidationRules(language);
	const trimmed = name.trim();
	return (
		trimmed.length >= rules.minLength &&
		trimmed.length <= rules.maxLength &&
		rules.pattern.test(trimmed)
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

const getCollectionName = (language) => {
	const isDebugMode = window.location.hash.includes('#debug');
	const langSuffix = getLanguageSuffix(language);
	return `${BASE_COLLECTION_NAME}${langSuffix}${isDebugMode ? DEBUG_SUFFIX : ''}`;
};

export const addGuestBookEntry = async (
	playerName,
	startTime,
	endTime,
	deaths = 0,
	language
) => {
	if (!isValidPlayerName(playerName, language)) {
		const rules = getValidationRules(language);
		throw new Error(
			`Invalid player name (${rules.minLength}-${rules.maxLength} characters)`
		);
	}

	if (!isValidGameTime(startTime, endTime)) {
		throw new Error('Invalid game duration');
	}

	try {
		const collectionToUse = getCollectionName(language);

		const docRef = await addDoc(collection(db, collectionToUse), {
			playerName: playerName.trim(),
			playerNameLower: playerName.trim().toLowerCase(),
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

export const getTotalEntries = async (language) => {
	try {
		const collectionToUse = getCollectionName(language);

		const coll = collection(db, collectionToUse);
		const snapshot = await getCountFromServer(coll);
		return snapshot.data().count;
	} catch (error) {
		console.error('Error getting total entries count:', error);
		throw error;
	}
};

export const getTotalPages = async (language) => {
	try {
		const collectionToUse = getCollectionName(language);

		const coll = collection(db, collectionToUse);
		const snapshot = await getCountFromServer(coll);
		const totalEntries = snapshot.data().count;

		return Math.ceil(totalEntries / PAGE_SIZE);
	} catch (error) {
		console.error('Error getting total pages:', error);
		throw error;
	}
};

export const getFirstGuestBookPage = async (language) => {
	try {
		const collectionToUse = getCollectionName(language);

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

		const totalEntries = await getTotalEntries(language);
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

export const getNextGuestBookPage = async (lastVisible, currentPage, language) => {
	if (!lastVisible) {
		return {
			entries: [],
			lastVisible: null,
			currentPage,
			totalPages: currentPage,
		};
	}

	try {
		const collectionToUse = getCollectionName(language);

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

		const totalPages = await getTotalPages(language);

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

export const getSpecificPage = async (pageNumber, language) => {
	if (pageNumber < 1) pageNumber = 1;

	try {
		const collectionToUse = getCollectionName(language);

		if (pageNumber === 1) {
			return await getFirstGuestBookPage(language);
		}

		const documentsToSkip = (pageNumber - 1) * PAGE_SIZE;

		const skipQuery = query(
			collection(db, collectionToUse),
			orderBy('createdAt', 'asc'),
			limit(documentsToSkip)
		);

		const skipSnapshot = await getDocs(skipQuery);

		if (skipSnapshot.empty) {
			return await getFirstGuestBookPage(language);
		}

		const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];

		const pageQuery = query(
			collection(db, collectionToUse),
			orderBy('createdAt', 'asc'),
			startAfter(lastDoc),
			limit(PAGE_SIZE)
		);

		const querySnapshot = await getDocs(pageQuery);
		const entries = processQuerySnapshot(querySnapshot);
		const lastVisible =
			entries.length > 0
				? querySnapshot.docs[querySnapshot.docs.length - 1]
				: null;
		const totalPages = await getTotalPages(language);

		return {
			entries,
			lastVisible,
			currentPage: pageNumber,
			totalPages,
		};
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
	const hours = Math.floor(timeInSeconds / 3600);
	const minutes = Math.floor((timeInSeconds % 3600) / 60);
	const seconds = Math.floor(timeInSeconds % 60);

	return `${hours.toString().padStart(2, '0')}:${minutes
		.toString()
		.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const findPageByPlayerName = async (playerName, language) => {
	try {
		const collectionToUse = getCollectionName(language);

		const searchTerm = playerName.toLowerCase();

		const exactMatchQuery = query(
			collection(db, collectionToUse),
			where('playerNameLower', '==', searchTerm),
			limit(1)
		);

		let exactSnapshot = await getDocs(exactMatchQuery);

		if (!exactSnapshot.empty) {
			const matchingDoc = exactSnapshot.docs[0];
			const matchData = matchingDoc.data();

			const countQuery = query(
				collection(db, collectionToUse),
				where('createdAt', '<', matchData.createdAt)
			);

			const countSnapshot = await getCountFromServer(countQuery);
			const position = countSnapshot.data().count;

			const pageNumber = Math.floor(position / PAGE_SIZE) + 1;

			return {
				pageNumber,
				createdAt: matchData.createdAt,
			};
		}

		const prefixQuery = query(
			collection(db, collectionToUse),
			orderBy('playerName'),
			startAt(searchTerm),
			endAt(searchTerm + ''),
			limit(1)
		);

		let querySnapshot = await getDocs(prefixQuery);

		if (querySnapshot.empty) {
			const allNamesQuery = query(
				collection(db, collectionToUse),
				orderBy('playerName'),
				limit(100)
			);

			const allNames = await getDocs(allNamesQuery);

			let matchingDoc = allNames.docs.find((doc) =>
				doc.data().playerName.toLowerCase().includes(searchTerm)
			);

			if (!matchingDoc && /^\d/.test(searchTerm)) {
				matchingDoc = allNames.docs.find((doc) => {
					const name = doc.data().playerName.toLowerCase();
					const searchChars = searchTerm.split('');
					let nameIndex = 0;

					for (let i = 0; i < searchChars.length; i++) {
						const char = searchChars[i];
						nameIndex = name.indexOf(char, nameIndex);
						if (nameIndex === -1) return false;
						nameIndex++;
					}
					return true;
				});
			}

			if (!matchingDoc) {
				console.error('No matching document found');
				return null;
			}

			querySnapshot = {
				docs: [matchingDoc],
				empty: false,
			};
		}

		const matchingDoc = querySnapshot.docs[0];
		const matchData = matchingDoc.data();

		const countQuery = query(
			collection(db, collectionToUse),
			where('createdAt', '<', matchData.createdAt)
		);

		const countSnapshot = await getCountFromServer(countQuery);
		const position = countSnapshot.data().count;

		const pageNumber = Math.floor(position / PAGE_SIZE) + 1;

		return {
			pageNumber,
			createdAt: matchData.createdAt,
		};
	} catch (error) {
		console.error('Error finding page by player name:', error);
		throw error;
	}
};
