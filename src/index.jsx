import './utils/consoleLogger';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
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
