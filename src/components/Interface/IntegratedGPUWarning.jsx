import { useState, useEffect } from 'react';
import './IntegratedGPUWarning.css';

export default function IntegratedGPUWarning({ gpuInfo, onDismiss }) {
	const [showInstructions, setShowInstructions] = useState(false);

	return (
		<div className="integrated-gpu-warning-overlay">
			<div className="integrated-gpu-warning-container">
				<div className="warning-header">
					<span className="warning-icon">⚠️</span>
					<h2>Performance Warning</h2>
				</div>

				<p className="warning-message">
					Your computer is using an{' '}
					<strong>integrated Intel graphics card</strong> instead of your
					dedicated GPU. This may cause lag and poor performance.
				</p>

				<div className="gpu-detected-info">
					<strong>Detected:</strong> {gpuInfo.renderer}
				</div>

				<button
					className="warning-toggle-instructions"
					onClick={() => setShowInstructions(!showInstructions)}
				>
					{showInstructions ? '▼ Hide Instructions' : '▶ Show How to Fix'}
				</button>

				{showInstructions && (
					<div className="warning-instructions">
						<h3>📝 How to Force Your Dedicated GPU</h3>

						<div className="instruction-method">
							<h4>Method 1: Windows Settings (Recommended)</h4>
							<ol>
								<li>
									Right-click on your desktop and select{' '}
									<strong>Display settings</strong>
								</li>
								<li>
									Scroll down and click <strong>Graphics settings</strong>
								</li>
								<li>
									Click <strong>Browse</strong> and find{' '}
									<code>Skull Hotel.exe</code>
								</li>
								<li>
									Click <strong>Options</strong> next to Skull Hotel
								</li>
								<li>
									Select <strong>High performance</strong>
								</li>
								<li>
									Click <strong>Save</strong>
								</li>
								<li>
									<strong>Restart the game</strong>
								</li>
							</ol>
						</div>

						<div className="instruction-method">
							<h4>Method 2: NVIDIA Control Panel (NVIDIA cards only)</h4>
							<ol>
								<li>
									Right-click on your desktop and select{' '}
									<strong>NVIDIA Control Panel</strong>
								</li>
								<li>
									Go to <strong>Manage 3D Settings</strong>
								</li>
								<li>
									Click the <strong>Program Settings</strong> tab
								</li>
								<li>
									Click <strong>Add</strong> and select{' '}
									<code>Skull Hotel.exe</code>
								</li>
								<li>
									Set <strong>Preferred graphics processor</strong> to{' '}
									<strong>High-performance NVIDIA processor</strong>
								</li>
								<li>
									Click <strong>Apply</strong>
								</li>
								<li>
									<strong>Restart the game</strong>
								</li>
							</ol>
						</div>

						<div className="instruction-method">
							<h4>Method 3: AMD Radeon Settings (AMD cards only)</h4>
							<ol>
								<li>
									Right-click on your desktop and select{' '}
									<strong>AMD Radeon Software</strong>
								</li>
								<li>
									Go to <strong>Gaming</strong> →{' '}
									<strong>Global Graphics</strong>
								</li>
								<li>
									Add <code>Skull Hotel.exe</code> to the list
								</li>
								<li>
									Set GPU to <strong>High Performance</strong>
								</li>
								<li>
									<strong>Restart the game</strong>
								</li>
							</ol>
						</div>
					</div>
				)}

				<div className="warning-actions">
					<button className="warning-dismiss-button" onClick={onDismiss}>
						I Understand, Continue Anyway
					</button>
				</div>

				<p className="warning-note">
					💡 Tip: Configuring your dedicated GPU will significantly improve
					performance!
				</p>
			</div>
		</div>
	);
}
