const deathReasonMap = {
	'It was hiding under the bed': 'game.deathReasons.underBed',
	'It was hiding in the bathroom vent': 'game.deathReasons.bathroomVent',
	'It was hiding in the room vent': 'game.deathReasons.roomVent',
	'It was hiding in the laundry basket near the bed':
		'game.deathReasons.bedBasket',
	'It was hiding in the TV stand compartment': 'game.deathReasons.windowBasket',
	'If you see it in the mirror, run away immediately':
		'game.deathReasons.hideoutMirror',
	'It was hiding behind the door': 'game.deathReasons.behindDoor',
	'Its feet were visible under the curtain': 'game.deathReasons.footWindow',
	'It was hiding in the mirror': 'game.deathReasons.landmineMirror',
	'It was hiding next to the couch': 'game.deathReasons.nearWindow',
	'It was on the ceiling above the couch':
		'game.deathReasons.ceilingCornerCouch',
	'It was hiding behind the couch': 'game.deathReasons.behindCouch',
	'It was hiding behind the desk': 'game.deathReasons.behindDesk',
	'It was hiding under the desk': 'game.deathReasons.insideDesk',
	'It was on the ceiling at the entrance': 'game.deathReasons.ceilingCenter',
	'Do not open the bathroom door if you hear sounds coming from inside':
		'game.deathReasons.sonarBathroom',
	'Close the door quickly before it attacks you': 'game.deathReasons.claymore',
	'If you see it, run away and close the door behind you':
		'game.deathReasons.hunter',
	'If you hear knocking, hide': 'game.deathReasons.raidKnocking',
	'If the TV turns on by itself, hide': 'game.deathReasons.raidTV',
	'If the radio turns on by itself, hide': 'game.deathReasons.raidRadio',
	'If you see blood inscriptions on the walls, hide':
		'game.deathReasons.raidInscriptions',
};

export const getDeathReasonTranslationKey = (deathReason) => {
	return deathReasonMap[deathReason] || deathReason;
};

export default deathReasonMap;
