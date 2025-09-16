const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
	const exists = fs.existsSync(src);
	const stats = exists && fs.statSync(src);
	const isDirectory = exists && stats.isDirectory();

	if (isDirectory) {
		if (!fs.existsSync(dest)) {
			fs.mkdirSync(dest, { recursive: true });
		}
		fs.readdirSync(src).forEach(function (childItemName) {
			copyRecursiveSync(
				path.join(src, childItemName),
				path.join(dest, childItemName)
			);
		});
	} else {
		fs.copyFileSync(src, dest);
	}
}

function cleanDirectory(dir) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
	fs.mkdirSync(dir, { recursive: true });
}

const sourceDir = './dist/win-unpacked';
const targetDir = './steamcontent/app/3739730';

cleanDirectory(targetDir);

copyRecursiveSync(sourceDir, targetDir);

const buildInfo = {
	buildTime: new Date().toISOString(),
	buildId: Math.random().toString(36).substring(2, 15),
};
fs.writeFileSync(
	path.join(targetDir, 'build-info.json'),
	JSON.stringify(buildInfo, null, 2)
);

console.log('✅ Files copied!');
