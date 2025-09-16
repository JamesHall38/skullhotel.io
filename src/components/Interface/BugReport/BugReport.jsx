import { useState, useRef } from 'react';
import { addBugReport } from '../../../firebase/bugReportService';
import useLocalization from '../../../hooks/useLocalization';
import { getAudioInstance } from '../../../utils/audio';
import { getConsoleMessages } from '../../../utils/consoleLogger';
import './BugReport.css';

export default function BugReport({ onClose }) {
	const [description, setDescription] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);
	const [error, setError] = useState(null);
	const lastMenuSoundTime = useRef(0);
	const { t } = useLocalization();

	const playMenuSound = () => {
		const now = Date.now();
		if (now - lastMenuSoundTime.current < 150) {
			return;
		}

		const menuSound = getAudioInstance('menu');
		if (menuSound) {
			menuSound.play().catch(() => {});
			lastMenuSoundTime.current = now;
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const platformInfo = getPlatformInfo();
			const deviceInfo = {
				...platformInfo,
				screenResolution: `${window.screen.width}x${window.screen.height}`,
				windowResolution: `${window.innerWidth}x${window.innerHeight}`,
				devicePixelRatio: window.devicePixelRatio,
				gpu: getGPUInfo(),
				language: navigator.language,
				isMobile: /Mobi|Android|iPhone/i.test(navigator.userAgent),
			};

			await addBugReport(description, getConsoleMessages(), deviceInfo);
			setSubmitSuccess(true);
			playMenuSound();

			setTimeout(() => {
				onClose();
			}, 2000);
		} catch (err) {
			setError(t('ui.bugReport.submitError'));
			console.error('Error submitting bug report:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMouseDown = (e) => {
		if (e.target.className === 'bug-report-overlay') {
			onClose();
			playMenuSound();
		}
	};

	const getPlatformInfo = () => {
		if (window.electron) {
			return {
				type: 'Desktop',
				environment: 'Electron',
				version: window.electron.versions.electron,
				chrome: window.electron.versions.chrome,
				platform: window.electron.platform,
				arch: window.electron.arch,
			};
		}

		const userAgent = window.navigator.userAgent.toLowerCase();
		const platform = window.navigator.platform;
		let browser = 'Unknown Browser';

		if (userAgent.includes('firefox/')) {
			browser = 'Firefox';
		} else if (userAgent.includes('chrome/')) {
			if (userAgent.includes('edg/')) {
				browser = 'Edge';
			} else if (userAgent.includes('opr/')) {
				browser = 'Opera';
			} else {
				browser = 'Chrome';
			}
		} else if (
			userAgent.includes('safari/') &&
			!userAgent.includes('chrome/')
		) {
			browser = 'Safari';
		}

		let os = 'Unknown OS';
		if (userAgent.includes('win')) os = 'Windows';
		else if (userAgent.includes('mac')) os = 'MacOS';
		else if (userAgent.includes('linux')) os = 'Linux';
		else if (userAgent.includes('android')) os = 'Android';
		else if (userAgent.includes('ios') || /iPad|iPhone|iPod/.test(platform))
			os = 'iOS';

		return {
			type: 'Browser',
			browser,
			os,
			platform,
		};
	};

	const getGPUInfo = () => {
		const canvas = document.createElement('canvas');
		const gl =
			canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (!gl) return 'WebGL not supported';

		const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
		if (!debugInfo) return 'GPU info not available';

		return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
	};

	return (
		<div className="bug-report-overlay" onMouseDown={handleMouseDown}>
			<div className="bug-report-container">
				<h2>{t('ui.bugReport.title')}</h2>
				{!submitSuccess ? (
					<form onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="description">
								{t('ui.bugReport.description')}
							</label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								required
								rows="4"
								placeholder={t('ui.bugReport.placeholder')}
							/>
						</div>
						{error && <div className="error-message">{error}</div>}
						<div className="button-group">
							<button
								type="button"
								onClick={() => {
									onClose();
									playMenuSound();
								}}
								className="cancel-button"
							>
								{t('ui.bugReport.cancel')}
							</button>
							<button
								type="submit"
								disabled={isSubmitting || !description.trim()}
								className="submit-button"
							>
								{isSubmitting
									? t('ui.bugReport.submitting')
									: t('ui.bugReport.submit')}
							</button>
						</div>
					</form>
				) : (
					<div className="success-message">{t('ui.bugReport.success')}</div>
				)}
			</div>
		</div>
	);
}
