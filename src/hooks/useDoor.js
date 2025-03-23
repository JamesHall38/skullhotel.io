import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { roomNumber } from '../utils/config';

const useDoorStore = create(
	subscribeWithSelector((set) => ({
		tutorial: false,
		setTutorial: (state) =>
			set(() => ({
				tutorial: state,
				corridor: false,
				roomDoor: [...Array(roomNumber)].map(() => false),
				tutorialHandle: false,
				corridorHandle: false,
				roomDoorHandle: [...Array(roomNumber)].map(() => false),
			})),
		exit: false,
		setExit: (state) => set(() => ({ exit: state })),
		corridor: false,
		setCorridor: (state) =>
			set(() => ({
				corridor: state,
				tutorial: false,
				roomDoor: [...Array(roomNumber)].map(() => false),
				tutorialHandle: false,
				corridorHandle: false,
				roomDoorHandle: [...Array(roomNumber)].map(() => false),
			})),

		roomDoor: [...Array(roomNumber)].map(() => false),
		bathroomDoor: false,
		bathroomDoors: [...Array(roomNumber)].map(() => false),
		desk: false,
		desks: [...Array(roomNumber)].map(() => false),
		nightStand: false,
		nightStands: [...Array(roomNumber)].map(() => false),

		setRoomDoor: (number, state) => {
			const roomDoor = [...Array(roomNumber)].map(() => false);
			roomDoor[number] = state;
			set(() => ({
				roomDoor: roomDoor,
				tutorial: false,
				corridor: false,
				tutorialHandle: false,
				corridorHandle: false,
				roomDoorHandle: [...Array(roomNumber)].map(() => false),
			}));
		},
		setBathroomDoor: (state) =>
			set(() => ({
				bathroomDoor: state,
			})),
		setBathroomDoors: (number, state) => {
			set((current) => ({
				bathroomDoors: current.bathroomDoors.map((door, index) =>
					index === number ? state : door
				),
			}));
		},
		setDesk: (state) =>
			set(() => ({
				desk: state,
			})),
		setDesks: (number, state) => {
			set((current) => ({
				desks: current.desks.map((desk, index) =>
					index === number ? state : desk
				),
			}));
		},
		setNightStand: (state) =>
			set(() => ({
				nightStand: state,
			})),
		setNightStands: (number, state) => {
			set((current) => ({
				nightStands: current.nightStands.map((nightStand, index) =>
					index === number ? state : nightStand
				),
			}));
		},

		// CURTAINS
		roomCurtain: false,
		roomCurtains: [...Array(roomNumber)].map(() => false),
		bathroomCurtain: false,
		bathroomCurtains: [...Array(roomNumber)].map(() => false),

		setRoomCurtain: (state) => {
			set(() => ({
				roomCurtain: state,
			}));
		},
		setRoomCurtains: (number, state) => {
			set((current) => ({
				roomCurtains: current.roomCurtains.map((curtain, index) =>
					index === number ? state : curtain
				),
			}));
		},
		setBathroomCurtain: (state) => {
			set(() => ({
				bathroomCurtain: state,
			}));
		},
		setBathroomCurtains: (number, state) => {
			set((current) => ({
				bathroomCurtains: current.bathroomCurtains.map((curtain, index) =>
					index === number ? state : curtain
				),
			}));
		},

		handlePressed: [...Array(roomNumber)].map(() => false),
		setHandlePressed: (number, state) => {
			set((current) => ({
				handlePressed: current.handlePressed.map((handle, index) =>
					index === number ? state : handle
				),
			}));
		},

		tutorialHandle: false,
		setTutorialHandle: (state) =>
			set(() => ({
				tutorialHandle: state,
			})),

		corridorHandle: false,
		setCorridorHandle: (state) =>
			set(() => ({
				corridorHandle: state,
			})),

		exitHandle: false,
		setExitHandle: (state) =>
			set(() => ({
				exitHandle: state,
			})),

		roomDoorHandle: [...Array(roomNumber)].map(() => false),
		setRoomDoorHandle: (number, state) => {
			set((current) => ({
				roomDoorHandle: current.roomDoorHandle.map((handle, index) =>
					index === number ? state : handle
				),
			}));
		},

		bathroomDoorHandle: false,
		setBathroomDoorHandle: (state) =>
			set(() => ({
				bathroomDoorHandle: state,
			})),

		restart: (roomNum) => {
			const numRooms = roomNum !== undefined ? roomNum : roomNumber;

			set(() => ({
				roomDoor: [...Array(numRooms)].map(() => false),
				bathroomDoor: false,
				bathroomDoors: [...Array(numRooms)].map(() => false),
				desk: false,
				desks: [...Array(numRooms)].map(() => false),
				nightStand: false,
				nightStands: [...Array(numRooms)].map(() => false),
				roomCurtain: false,
				roomCurtains: [...Array(numRooms)].map(() => false),
				bathroomCurtain: false,
				bathroomCurtains: [...Array(numRooms)].map(() => false),
				exit: false,
				tutorial: false,
				corridor: false,
				handlePressed: [...Array(numRooms)].map(() => false),
				tutorialHandle: false,
				corridorHandle: false,
				exitHandle: false,
				roomDoorHandle: [...Array(numRooms)].map(() => false),
				bathroomDoorHandle: false,
			}));
		},
	}))
);

export default useDoorStore;
