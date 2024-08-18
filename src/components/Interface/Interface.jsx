import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useProgress } from '@react-three/drei';
import dialogues from '../../data/dialogues';
import useInterface from '../../hooks/useInterface';
import './Interface.css';

const SPEED = 50;

const Dialogue = memo(({ id, text, index, onRemove }) => {
	const [displayedText, setDisplayedText] = useState('');
	const [isFadingOut, setIsFadingOut] = useState(false);

	useEffect(() => {
		let isCancelled = false;
		setDisplayedText('');

		const displayText = async () => {
			if (!isCancelled) {
				setTimeout(() => {
					setIsFadingOut(true);
					setTimeout(() => onRemove(id), 250);
				}, 3000);
			}
			for (let i = 0; i < text?.length; i++) {
				if (isCancelled) break;
				setDisplayedText((prev) => prev + text[i]);
				await new Promise((resolve) => setTimeout(resolve, SPEED));
			}
		};

		displayText();

		return () => {
			isCancelled = true;
		};
	}, [text, onRemove, id]);

	return (
		<div
			className={`dialogue-popup ${isFadingOut ? 'fade-out' : ''}`}
			style={{ transform: `translateY(-${index * 60}px)` }}
		>
			<p>{displayedText}</p>
		</div>
	);
});

export default function Interface() {
	const currentDialogueIndex = useInterface(
		(state) => state.currentDialogueIndex
	);
	const objectives = useInterface((state) => state.interfaceObjectives);
	const interfaceAction = useInterface((state) => state.interfaceAction);
	const [activeDialogues, setActiveDialogues] = useState([]);
	const { active, progress } = useProgress();
	const [displayProgress, setDisplayProgress] = useState(0);

	const doneObjectives = useMemo(() => {
		return objectives.filter((subArray) =>
			subArray.every((value) => value === true)
		).length;
	}, [objectives]);

	const handleRemove = useCallback((id) => {
		setActiveDialogues((prev) => prev.filter((dialogue) => dialogue.id !== id));
	}, []);

	useEffect(() => {
		if (
			currentDialogueIndex !== null &&
			currentDialogueIndex < dialogues.length
		) {
			const newDialogue = {
				text: dialogues[currentDialogueIndex],
				id: Date.now() + Math.random(),
			};
			setActiveDialogues((prev) => [...prev, newDialogue]);
		}
	}, [currentDialogueIndex]);

	useEffect(() => {
		let rafId;

		const updateProgress = () => {
			if (displayProgress < progress) {
				const increment = Math.max(0.1, (100 - displayProgress) / 200);
				setDisplayProgress((prev) => Math.min(progress, prev + increment));
				rafId = requestAnimationFrame(updateProgress);
			} else {
				cancelAnimationFrame(rafId);
				if (progress === 100 && displayProgress < 100) {
					setDisplayProgress(100);
				}
			}
		};

		rafId = requestAnimationFrame(updateProgress);

		return () => cancelAnimationFrame(rafId);
	}, [displayProgress, progress, active]);

	return (
		<div className="interface">
			{displayProgress !== 100 ? (
				<div className="objectives">Loading: {displayProgress.toFixed(0)}%</div>
			) : (
				<div className="objectives">{doneObjectives} / 10 </div>
			)}
			<div className="action">{interfaceAction}</div>
			<div className="dialogue-container">
				{activeDialogues.map((dialogue, index) => (
					<Dialogue
						key={dialogue.id}
						id={dialogue.id}
						text={dialogue.text}
						index={index}
						onRemove={handleRemove}
					/>
				))}
			</div>
		</div>
	);
}
