/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');

const mainJsPath = path.join(buildDir, 'main.js');
if (fs.existsSync(mainJsPath)) {
	let content = fs.readFileSync(mainJsPath, 'utf8');

	const replacements = [
		{ from: '"/models/', to: '"models/' },
		{ from: "'/models/", to: "'models/" },
		{ from: '"/sounds/', to: '"sounds/' },
		{ from: "'/sounds/", to: "'sounds/" },
		{ from: '"/textures/', to: '"textures/' },
		{ from: "'/textures/", to: "'textures/" },
		{ from: '"/Redrum.otf', to: '"Redrum.otf' },
		{ from: "'/Redrum.otf", to: "'Redrum.otf" },
		{ from: '"/Futura.ttf', to: '"Futura.ttf' },
		{ from: "'/Futura.ttf", to: "'Futura.ttf" },
		{ from: '"/Lincoln-Road-Deco.ttf', to: '"Lincoln-Road-Deco.ttf' },
		{ from: "'/Lincoln-Road-Deco.ttf", to: "'Lincoln-Road-Deco.ttf" },
		{ from: '"/Lincoln-Road-Regular.ttf', to: '"Lincoln-Road-Regular.ttf' },
		{ from: "'/Lincoln-Road-Regular.ttf", to: "'Lincoln-Road-Regular.ttf" },
		{ from: '"/EB_Garamond_Regular.json', to: '"EB_Garamond_Regular.json' },
		{ from: "'/EB_Garamond_Regular.json", to: "'EB_Garamond_Regular.json" },
	];

	for (const { from, to } of replacements) {
		content = content.split(from).join(to);
	}

	fs.writeFileSync(mainJsPath, content);
}

const indexHtmlPath = path.join(buildDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
	let content = fs.readFileSync(indexHtmlPath, 'utf8');

	content = content.split('href="./').join('href="');
	content = content.split('src="./').join('src="');

	fs.writeFileSync(indexHtmlPath, content);
}
