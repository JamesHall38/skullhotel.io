import { useState, useEffect, useRef, useCallback } from 'react';
import PopupWrapper from '../PopupWrapper/PopupWrapper';
import headerSvg from '../header.svg';
import useGame from '../../../hooks/useGame';
import useDebounce from '../../../hooks/useDebounce';
import AnimatedCloseButton from '../AnimatedCloseButton/AnimatedCloseButton';
import useLocalization from '../../../hooks/useLocalization';
import {
	getFirstGuestBookPage,
	getNextGuestBookPage,
	getSpecificPage,
	findPageByPlayerName,
	PAGE_SIZE,
} from '../../../firebase/guestBookService';
import './GuestBook.css';

function GuestBookContent({ onClose }) {
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [lastVisible, setLastVisible] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [searchInput, setSearchInput] = useState('');
	const [selectedEntry, setSelectedEntry] = useState(null);
	const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
	const deviceMode = useGame((state) => state.deviceMode);
	const guestBookRef = useRef(null);
	const isDebugMode = window.location.hash.includes('#debug');

	const STORAGE_KEY = (() => {
		if (isDebugMode) {
			return 'skullhotel_debug_last_player_name';
		} else {
			return 'skullhotel_last_player_name';
		}
	})();

	const { t } = useLocalization();

	const debouncedSearch = useDebounce(searchInput, 300);

	const loadSpecificPage = useCallback(async (pageNumber) => {
		try {
			setLoading(true);
			const result = await getSpecificPage(pageNumber);
			setEntries(result.entries);
			setLastVisible(result.lastVisible);
			setCurrentPage(result.currentPage);
			setTotalPages(result.totalPages);
		} catch (err) {
			console.error(`Error loading page ${pageNumber}:`, err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const savedPlayerName = localStorage.getItem(STORAGE_KEY);
		if (savedPlayerName) {
			setSearchInput(savedPlayerName);
		}
	}, [STORAGE_KEY]);

	useEffect(() => {
		const handleSearch = async () => {
			if (!debouncedSearch.trim()) {
				loadInitialData();
				return;
			}

			try {
				setLoading(true);

				const pageNumber = parseInt(debouncedSearch);
				if (!isNaN(pageNumber) && /^\d+$/.test(debouncedSearch)) {
					if (pageNumber >= 1 && pageNumber <= totalPages) {
						await loadSpecificPage(pageNumber);
					} else {
						await loadInitialData();
					}
				} else {
					const result = await findPageByPlayerName(debouncedSearch);
					if (result) {
						await loadSpecificPage(result.pageNumber);
					} else {
						await loadInitialData();
					}
				}
			} catch (err) {
				console.error('Error searching:', err);
				await loadInitialData();
			} finally {
				setLoading(false);
			}
		};

		handleSearch();
	}, [debouncedSearch, totalPages, loadSpecificPage]);

	const loadInitialData = async () => {
		try {
			setLoading(true);

			const {
				entries: initialEntries,
				lastVisible: lastDoc,
				currentPage: page,
				totalPages: total,
			} = await getFirstGuestBookPage();

			setEntries(initialEntries);
			setLastVisible(lastDoc);
			setCurrentPage(page);
			setTotalPages(total);
		} catch (err) {
			console.error('Error loading guest book entries:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadInitialData();
	}, []);

	useEffect(() => {
		if (deviceMode === 'gamepad' && guestBookRef.current) {
			setTimeout(() => {
				const lastButton = guestBookRef.current.querySelector(
					'.pagination-button:last-child'
				);
				if (lastButton && !lastButton.disabled) {
					const focusedElements = document.querySelectorAll('.gamepad-focus');
					focusedElements.forEach((el) => {
						el.classList.remove('gamepad-focus');
					});

					lastButton.classList.add('gamepad-focus');

					const popupContainer = guestBookRef.current.closest(
						'.popup-content-container'
					);
					if (popupContainer) {
						const allFocusableElements = popupContainer.querySelectorAll(
							'button, a, input, [role="button"], .pagination-button, .restart-button, .submit-button, .guestbook-entry'
						);

						const lastButtonIndex = Array.from(allFocusableElements).findIndex(
							(el) => el === lastButton
						);

						popupContainer.setAttribute(
							'data-current-focus',
							lastButtonIndex.toString()
						);
					}
				}
			}, 100);
		}
	}, [deviceMode]);

	const loadNextPage = async () => {
		if (currentPage >= totalPages || loading) return;

		try {
			setLoading(true);
			const {
				entries: nextEntries,
				lastVisible: newLastDoc,
				currentPage: newPage,
			} = await getNextGuestBookPage(lastVisible, currentPage);

			setEntries(nextEntries);
			setLastVisible(newLastDoc);
			setCurrentPage(newPage);
		} catch (err) {
			console.error('Error loading next page:', err);
		} finally {
			setLoading(false);
		}
	};

	const loadPreviousPage = async () => {
		if (currentPage <= 1 || loading) return;

		try {
			setLoading(true);
			const prevPage = currentPage - 1;
			const {
				entries: prevEntries,
				lastVisible: prevLastDoc,
				currentPage: newPage,
			} = await getSpecificPage(prevPage);

			setEntries(prevEntries);
			setLastVisible(prevLastDoc);
			setCurrentPage(newPage);
		} catch (err) {
			console.error('Error loading previous page:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleEntryClick = (entry, event, isRightColumn = false) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const scrollContainer =
			guestBookRef.current?.querySelector('.guestbook-entries');
		const containerRect = scrollContainer?.getBoundingClientRect() || {
			left: 0,
			top: 0,
		};

		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

		const tooltipWidth = 11.25 * rem; // ~180px (11.25rem)
		const spacing = 0.625 * rem; // ~10px (0.625rem)

		const xPosition = isRightColumn
			? rect.left - tooltipWidth - spacing - containerRect.left
			: rect.right + spacing - containerRect.left;

		setPopupPosition({
			x: xPosition,
			y: rect.top + (scrollContainer?.scrollTop || 0) - containerRect.top,
		});
		setSelectedEntry(entry);
	};

	useEffect(() => {
		if (!selectedEntry) return;

		const handleClickOutside = (event) => {
			if (event.target.closest('.guestbook-entry')) {
				return;
			}
			setSelectedEntry(null);
		};

		const rafId = requestAnimationFrame(() => {
			document.addEventListener('click', handleClickOutside, true);
		});

		return () => {
			cancelAnimationFrame(rafId);
			document.removeEventListener('click', handleClickOutside, true);
		};
	}, [selectedEntry]);

	return (
		<div className="guestbook-content" ref={guestBookRef}>
			<img src={headerSvg} alt={t('ui.reception.guestBook')} />
			<div className="guestbook-header">
				<AnimatedCloseButton onClick={onClose} size={1} />
			</div>

			<div className="guestbook-header-section">
				<div className="guestbook-title-subtitle">
					<h2>{t('ui.reception.guestBook')}</h2>
					<p className="guestbook-subtitle">
						{t('ui.reception.guestBookSubtitle')}
					</p>
				</div>

				<div className="page-indicator">
					<input
						type="text"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder={t('ui.reception.searchPlaceholder')}
						className="page-input"
						data-gamepad-skip="true"
					/>
				</div>
			</div>

			<>
				<div className="guestbook-entries">
					{loading ? (
						<div className="guestbook-loading">
							<div className="loading-spinner"></div>
						</div>
					) : (
						<table className="guestbook-table">
							<tbody>
								{Array.from({ length: Math.ceil(entries.length / 2) }).map(
									(_, rowIndex) => {
										const leftEntry = entries[rowIndex];
										const rightEntry =
											entries[rowIndex + Math.ceil(entries.length / 2)];
										const baseRank = (currentPage - 1) * PAGE_SIZE;

										return (
											<tr
												key={leftEntry?.id || `row-${rowIndex}`}
												className="guestbook-entry-row"
											>
												{leftEntry ? (
													<td
														className="guestbook-entry guestbook-entry-left"
														onClick={(e) =>
															handleEntryClick(leftEntry, e, false)
														}
													>
														<span className="guestbook-rank">
															#{baseRank + rowIndex + 1}
														</span>
														<span className="guestbook-name">
															{leftEntry.playerName}
														</span>
													</td>
												) : (
													<td className="guestbook-entry-empty"></td>
												)}
												{rightEntry ? (
													<td
														className="guestbook-entry guestbook-entry-right"
														onClick={(e) =>
															handleEntryClick(rightEntry, e, true)
														}
													>
														<span className="guestbook-rank">
															#
															{baseRank +
																rowIndex +
																Math.ceil(entries.length / 2) +
																1}
														</span>
														<span className="guestbook-name">
															{rightEntry.playerName}
														</span>
													</td>
												) : (
													<td className="guestbook-entry-empty"></td>
												)}
											</tr>
										);
									}
								)}
							</tbody>
						</table>
					)}

					{selectedEntry && (
						<div
							className="entry-details-tooltip"
							style={{
								left: `${popupPosition.x}px`,
								top: `${popupPosition.y}px`,
							}}
						>
							<div className="tooltip-row">
								<span className="tooltip-label">{t('ui.reception.time')}:</span>
								<span className="tooltip-value">
									{selectedEntry.formattedTime}
								</span>
							</div>
							<div className="tooltip-row">
								<span className="tooltip-label">
									{t('ui.reception.deaths')}:
								</span>
								<span className="tooltip-value">
									{selectedEntry.deaths || 0}
								</span>
							</div>
							<div className="tooltip-row">
								<span className="tooltip-label">{t('ui.reception.date')}:</span>
								<span className="tooltip-value">
									{selectedEntry.createdAt || selectedEntry.timestamp
										? new Date(
												selectedEntry.createdAt?.seconds ||
												selectedEntry.timestamp?.seconds
													? (selectedEntry.createdAt?.seconds ||
															selectedEntry.timestamp?.seconds) * 1000
													: selectedEntry.createdAt || selectedEntry.timestamp
										  ).toLocaleDateString(undefined, {
												year: 'numeric',
												month: 'short',
												day: 'numeric',
										  })
										: 'N/A'}
								</span>
							</div>
						</div>
					)}
				</div>

				<div className="guestbook-pagination">
					<span />
					<div className="pagination-button-container">
						<button
							onClick={loadPreviousPage}
							className="pagination-button"
							disabled={currentPage <= 1}
						>
							<svg
								width="57"
								height="22"
								style={{ transform: 'rotate(180deg)' }}
							>
								<path
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="m 1.0389507,10.982586 34.3607143,0.01914 6.598599,-6.5859935 6.588051,6.5828805 -6.529849,6.59752 -6.700832,-6.638602"
								/>
								<path
									className="hover-visible-path"
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="m 42.001891,8.7266442 -2.250247,2.2561638 2.347328,2.242759 2.235597,-2.22926 -2.331013,-2.273454"
								/>
								<path
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="M 46.003006,20.999675 56.005687,10.988951 45.980124,0.97633252"
									className={currentPage === 1 ? 'invisible-path' : ''}
								/>
							</svg>
						</button>

						<button
							onClick={loadNextPage}
							className="pagination-button"
							disabled={currentPage >= totalPages}
						>
							<svg width="57" height="22">
								<path
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="m 1.0389507,10.982586 34.3607143,0.01914 6.598599,-6.5859935 6.588051,6.5828805 -6.529849,6.59752 -6.700832,-6.638602"
								/>
								<path
									className="hover-visible-path"
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="m 42.001891,8.7266442 -2.250247,2.2561638 2.347328,2.242759 2.235597,-2.22926 -2.331013,-2.273454"
								/>
								<path
									stroke="#efd89b"
									strokeWidth={2}
									fill="none"
									d="M 46.003006,20.999675 56.005687,10.988951 45.980124,0.97633252"
									className={currentPage === totalPages ? 'invisible-path' : ''}
								/>
							</svg>
						</button>
					</div>

					<div className="page-info">
						{currentPage} / {totalPages}
					</div>
				</div>
			</>
		</div>
	);
}

export default function GuestBook() {
	return (
		<PopupWrapper cursorType="book">
			<GuestBookContent />
		</PopupWrapper>
	);
}
