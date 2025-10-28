import { useState } from 'react';
import './UnsupportedGPU.css';

export default function UnsupportedGPU({ reason, gpuInfo }) {
	const [showDetails, setShowDetails] = useState(false);

	const getTitle = () => {
		switch (reason) {
			case 'noWebGL':
				return 'WebGL Not Supported';
			case 'noWebGL2':
				return 'WebGL 2 Not Supported';
			case 'tooOld':
				return 'Graphics Card Below Minimum Requirements';
			default:
				return 'Graphics Card Not Supported';
		}
	};

	const getMessage = () => {
		switch (reason) {
			case 'noWebGL':
				return 'Your browser or system does not support WebGL, which is required to run this game.';
			case 'noWebGL2':
				return 'Your graphics card only supports WebGL 1.0. This game requires WebGL 2.0 or higher.';
			case 'tooOld':
				return 'Your graphics card is below the minimum requirements needed to run this game.';
			default:
				return 'Your graphics card does not meet the requirements to run this game.';
		}
	};

	const getRecommendation = () => {
		switch (reason) {
			case 'noWebGL':
				return (
					<>
						<p>Please try:</p>
						<ul>
							<li>Using a modern browser (Chrome, Firefox, Edge)</li>
							<li>Updating your graphics drivers</li>
							<li>Enabling hardware acceleration in your browser settings</li>
						</ul>
					</>
				);
			case 'noWebGL2':
				return (
					<>
						<p>To fix this:</p>
						<ul>
							<li>Update your graphics drivers to the latest version</li>
							<li>
								Visit your GPU manufacturer's website:
								<br />
								<a
									href="https://www.intel.com/content/www/us/en/download-center/home.html"
									target="_blank"
									rel="noopener noreferrer"
								>
									Intel
								</a>
								{' | '}
								<a
									href="https://www.nvidia.com/Download/index.aspx"
									target="_blank"
									rel="noopener noreferrer"
								>
									NVIDIA
								</a>
								{' | '}
								<a
									href="https://www.amd.com/en/support"
									target="_blank"
									rel="noopener noreferrer"
								>
									AMD
								</a>
							</li>
							<li>If drivers are up to date, your GPU may be too old</li>
						</ul>
					</>
				);
			case 'tooOld':
				return (
					<>
						<p>Your graphics card is too old to run modern 3D games.</p>
						<p>
							<strong>Minimum Requirements:</strong>
						</p>
						<ul>
							<li>Intel HD Graphics 5000 or newer</li>
							<li>NVIDIA GeForce GTX 600 series or newer</li>
							<li>AMD Radeon HD 7000 series or newer</li>
							<li>WebGL 2.0 support</li>
						</ul>
						<p>Consider upgrading your hardware to play this game.</p>
					</>
				);
			default:
				return (
					<>
						<p>
							Please update your graphics drivers or try a different device.
						</p>
					</>
				);
		}
	};

	return (
		<div className="unsupported-gpu-overlay">
			<div className="unsupported-gpu-container">
				<h1>{getTitle()}</h1>
				<p className="unsupported-gpu-message">{getMessage()}</p>

				<div className="unsupported-gpu-recommendations">
					{getRecommendation()}
				</div>

				<button
					className="unsupported-gpu-details-toggle"
					onClick={() => setShowDetails(!showDetails)}
				>
					{showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
				</button>

				{showDetails && (
					<div className="unsupported-gpu-details">
						<p>
							<strong>Detected GPU:</strong> {gpuInfo}
						</p>
						<p>
							<strong>Browser:</strong> {navigator.userAgent}
						</p>
						<p>
							<strong>WebGL 2 Support:</strong>{' '}
							{reason === 'noWebGL2' || reason === 'noWebGL'
								? '❌ No'
								: '✅ Yes'}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
