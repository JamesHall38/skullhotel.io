import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{ files: ['**/*.{js,mjs,cjs,jsx}'] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	pluginReact.configs.flat.recommended,
	{
		plugins: {
			'react-hooks': pluginReactHooks,
		},
		rules: {
			// React configuration
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/no-unknown-property': 'off',
			'react/display-name': 'off',

			// Hooks rules
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': [
				'warn',
				{
					additionalHooks: '(useAsync|useAsyncFn)',
				},
			],

			// Potential error prevention
			'no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
				},
			],

			// Performance and best practices
			'react/jsx-no-duplicate-props': 'error',
			'react/self-closing-comp': 'warn',
			'react/jsx-key': 'error',
		},
	},
];
