import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'bug_reports';

export const addBugReport = async (description, consoleLogs, deviceInfo) => {
	try {
		const docRef = await addDoc(collection(db, COLLECTION_NAME), {
			description,
			consoleLogs,
			deviceInfo,
			createdAt: serverTimestamp(),
		});
		return docRef.id;
	} catch (error) {
		console.error('Error adding bug report: ', error);
		throw error;
	}
};
