import eventsData from '../data/eventsData';

export default function generateEvents() {
	const events = [];
	for (let i = 0; i < 20; i++) {
		events.push(eventsData[i] || { roomNumber: i });
		events[i].roomNumber = i;
	}

	return events;
}
