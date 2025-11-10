import './utils/consoleLogger';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import BugReport from './components/Interface/BugReport/BugReport';
import UnsupportedGPU from './components/Interface/UnsupportedGPU';
import { checkGPUSupport, isWebGLError } from './utils/gpuDetection';
import { getConsoleMessages } from './utils/consoleLogger';

function tryAutoCompatOnce() {
	try {
		const compat = window.compat;
		const mode =
			compat && typeof compat.getMode === 'function'
				? compat.getMode()
				: 'default';
		if (!compat || typeof compat.relaunchGL !== 'function') return;
		if (mode === 'gl') return; // already in compat
		if (localStorage.getItem('compatAutoTried') === '1') return;
		localStorage.setItem('compatAutoTried', '1');
		compat.relaunchGL();
	} catch (_e) {}
}

window.addEventListener(
	'webglcontextlost',
	() => {
		tryAutoCompatOnce();
	},
	true
);

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			showBugReport: false,
			isGPUError: false,
			gpuInfo: null,
			lastErrorMessage: null,
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		console.error('[REACT_ERROR]', error);
		console.error('[REACT_ERROR_INFO]', errorInfo);
		this.setState({ lastErrorMessage: error?.message || String(error) });

		const consoleLogs = getConsoleMessages();
		const hasWebGLError = consoleLogs.some(
			(log) =>
				log.includes('WebGL') ||
				log.includes('context could not be created') ||
				log.includes('Failed to create')
		);

		const isErrorWebGL = isWebGLError(error);

		if (hasWebGLError || isErrorWebGL) {
			tryAutoCompatOnce();
			const gpuCheck = checkGPUSupport();
			if (!gpuCheck.isSupported) {
				this.setState({
					isGPUError: true,
					gpuInfo: gpuCheck,
				});
			}
		}
	}

	render() {
		if (this.state.hasError) {
			if (this.state.isGPUError && this.state.gpuInfo) {
				return (
					<UnsupportedGPU
						reason={this.state.gpuInfo.reason}
						gpuInfo={this.state.gpuInfo.gpuInfo}
					/>
				);
			}

			return (
				<div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
					<h1>Something went wrong</h1>
					{this.state.lastErrorMessage && (
						<p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
							{this.state.lastErrorMessage}
						</p>
					)}
					<p>Please refresh the app or report this issue.</p>
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
