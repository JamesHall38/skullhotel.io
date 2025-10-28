import './utils/consoleLogger';

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import BugReport from './components/Interface/BugReport/BugReport';
import UnsupportedGPU from './components/Interface/UnsupportedGPU';
import { checkGPUSupport, isWebGLError } from './utils/gpuDetection';
import { getConsoleMessages } from './utils/consoleLogger';

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			showBugReport: false,
			isGPUError: false,
			gpuInfo: null,
		};
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		console.error('[REACT_ERROR]', error);
		console.error('[REACT_ERROR_INFO]', errorInfo);

		const consoleLogs = getConsoleMessages();
		const hasWebGLError = consoleLogs.some(
			(log) =>
				log.includes('WebGL') ||
				log.includes('context could not be created') ||
				log.includes('Failed to create')
		);

		const isErrorWebGL = isWebGLError(error);

		if (hasWebGLError || isErrorWebGL) {
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
