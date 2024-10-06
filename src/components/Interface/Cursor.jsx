import React from 'react';
import { ReactComponent as BellIcon } from './cursors/bell.svg';
import { ReactComponent as CleanIcon } from './cursors/clean.svg';
import { ReactComponent as DoorIcon } from './cursors/door.svg';
import { ReactComponent as HelpIcon } from './cursors/help.svg';
import { ReactComponent as LightIcon } from './cursors/light.svg';
import { ReactComponent as PowerIcon } from './cursors/power.svg';
import useInterface from '../../hooks/useInterface';
import './Interface.css';

export default function Cursor() {
	const cursor = useInterface((state) => state.cursor);

	const cursorIcons = {
		bell: <BellIcon />,
		clean: <CleanIcon />,
		door: <DoorIcon />,
		help: <HelpIcon className="help-cursor" />,
		light: <LightIcon />,
		power: <PowerIcon />,
	};

	return (
		<div className={'cursor-container'}>
			{cursor ? cursorIcons[cursor] : <div className="simple-cursor" />}
		</div>
	);
}
