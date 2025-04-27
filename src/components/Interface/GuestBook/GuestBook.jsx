import { useState, useEffect, useRef } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import headerSvg from '../header.svg';
import useGame from '../../../hooks/useGame';
import PopupWrapper from '../PopupWrapper/PopupWrapper';
import {
	getFirstGuestBookPage,
	getNextGuestBookPage,
	getSpecificPage,
	PAGE_SIZE,
} from '../../../firebase/guestBookService';
import './GuestBook.css';

function GuestBookContent({ onClose }) {
	const [entries, setEntries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [lastVisible, setLastVisible] = useState(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [pageInput, setPageInput] = useState('');
	const deviceMode = useGame((state) => state.deviceMode);
	const guestBookRef = useRef(null);

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
			setError(
				`Error loading guest book entries: ${err.message || 'Unknown error'}`
			);
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

	const loadFirstPage = async () => {
		if (currentPage === 1 || loading) return;
		try {
			setLoading(true);
			await loadInitialData();
		} catch (err) {
			console.error('Error loading first page:', err);
			setError('Error loading first page');
		} finally {
			setLoading(false);
		}
	};

	const loadLastPage = async () => {
		if (currentPage === totalPages || loading) return;
		try {
			setLoading(true);
			const {
				entries: lastPageEntries,
				lastVisible: lastPageDoc,
				currentPage: newPage,
			} = await getSpecificPage(totalPages);

			setEntries(lastPageEntries);
			setLastVisible(lastPageDoc);
			setCurrentPage(newPage);
		} catch (err) {
			console.error('Error loading last page:', err);
			setError('Error loading last page');
		} finally {
			setLoading(false);
		}
	};

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
			setError('Error loading next page');
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
			setError('Error loading previous page');
		} finally {
			setLoading(false);
		}
	};

	const loadSpecificPage = async (pageNumber) => {
		if (
			pageNumber < 1 ||
			pageNumber > totalPages ||
			loading ||
			pageNumber === currentPage
		)
			return;

		try {
			setLoading(true);
			const {
				entries: pageEntries,
				lastVisible: pageLastDoc,
				currentPage: newPage,
			} = await getSpecificPage(pageNumber);

			setEntries(pageEntries);
			setLastVisible(pageLastDoc);
			setCurrentPage(newPage);
		} catch (err) {
			console.error(`Error loading page ${pageNumber}:`, err);
			setError(`Error loading page ${pageNumber}`);
		} finally {
			setLoading(false);
		}
	};

	const handlePageInputChange = (e) => {
		const value = e.target.value.replace(/[^0-9]/g, '');
		setPageInput(value);
	};

	const handlePageInputSubmit = (e) => {
		e.preventDefault();

		const pageNumber = parseInt(pageInput);
		if (pageNumber && pageNumber >= 1 && pageNumber <= totalPages) {
			loadSpecificPage(pageNumber);
			setPageInput('');
		}
	};

	return (
		<div className="guestbook-content" ref={guestBookRef}>
			<img src={headerSvg} alt="Guest Book" />
			<div className="guestbook-header">
				{/* <button onClick={loadInitialData} className="guestbook-refresh">
						Refresh
					</button> */}
				<button onClick={onClose} className="close-button">
					<IoCloseOutline />
				</button>
			</div>

			<h2>Guest Book</h2>

			{error && (
				<div className="guestbook-error">
					<div className="error-icon">⚠️</div>
					<div className="error-content">
						<p>{error}</p>
						<button onClick={loadInitialData} className="guestbook-retry">
							Retry
						</button>
					</div>
				</div>
			)}

			{loading && <div className="guestbook-loading">Loading entries...</div>}

			{entries.length === 0 && !loading ? (
				<div className="guestbook-empty">
					<div className="empty-icon">📝</div>
					<p>No entries yet. Be the first to sign the guest book!</p>
				</div>
			) : (
				<>
					<div className="guestbook-entries">
						<table className="guestbook-table">
							<tbody>
								{entries.map((entry, index) => (
									<tr key={entry.id} className="guestbook-entry">
										<td className="guestbook-rank">
											{(currentPage - 1) * PAGE_SIZE + index + 1}
										</td>
										<td className="guestbook-name">{entry.playerName}</td>
										<td className="guestbook-time">{entry.formattedTime}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="guestbook-pagination">
						<button
							onClick={loadFirstPage}
							className="pagination-button"
							disabled={loading || currentPage <= 1}
						>
							&laquo; &laquo;
						</button>

						<button
							onClick={loadPreviousPage}
							className="pagination-button"
							disabled={loading || currentPage <= 1}
						>
							&laquo;
						</button>

						<div className="page-indicator">
							<form onSubmit={handlePageInputSubmit} className="page-form">
								<input
									min="1"
									max={totalPages}
									value={pageInput}
									onChange={handlePageInputChange}
									placeholder={`${currentPage}/${totalPages}`}
									className="page-input"
									disabled={loading || totalPages <= 1}
									data-gamepad-skip="true"
								/>
							</form>
						</div>

						<button
							onClick={loadNextPage}
							className="pagination-button"
							disabled={loading || currentPage >= totalPages}
						>
							&raquo;
						</button>

						<button
							onClick={loadLastPage}
							className="pagination-button"
							disabled={loading || currentPage >= totalPages}
						>
							&raquo; &raquo;
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default function GuestBook() {
	return (
		<PopupWrapper cursorType="help-guestbook">
			<GuestBookContent />
		</PopupWrapper>
	);
}
