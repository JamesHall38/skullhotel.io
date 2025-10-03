import './utils/consoleLogger';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import BugReport from './components/Interface/BugReport/BugReport';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, showBugReport: false };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		console.error('[REACT_ERROR]', error);
		console.error('[REACT_ERROR_INFO]', errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
					<h1>Something went wrong</h1>
					<p>Please refresh the page or report this issue.</p>
					<button
						onClick={() => this.setState({ showBugReport: true })}
						style={{
							marginTop: '12px',
							padding: '8px 16px',
							backgroundColor: '#4a4a4a',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Report bug
					</button>
					{this.state.showBugReport && (
						<BugReport
							onClose={() => this.setState({ showBugReport: false })}
						/>
					)}
				</div>
			);
		}

		return this.props.children;
	}
}

const root = createRoot(document.querySelector('#root'));
root.render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>
);
