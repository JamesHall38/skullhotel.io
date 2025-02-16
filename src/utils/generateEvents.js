import eventsData from '../data/eventsData';
import useGameplaySettings from '../hooks/useGameplaySettings';

export default function generateEvents() {
	const roomCount = useGameplaySettings.getState().roomCount;
	const events = [];
	for (let i = 0; i < roomCount; i++) {
		events.push(eventsData[i] || { roomNumber: i });
		events[i].roomNumber = i;
	}

	return events;
}
