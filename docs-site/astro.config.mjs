// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';

// The words of the menu and the start page, one file per language (src/i18n/<code>.json).
const words = Object.fromEntries(
	['en', 'de', 'nl', 'fr', 'es'].map((code) => [code, JSON.parse(readFileSync(new URL('./src/i18n/' + code + '.json', import.meta.url), 'utf8'))]),
);
// A menu group name with its translations: { label: 'Start here', translations: { de: '...' } }
const group = (key, items) => ({
	label: words.en.sidebar[key],
	translations: Object.fromEntries(['de', 'nl', 'fr', 'es'].map((code) => [code, words[code].sidebar[key]])),
	items,
});

// While the site lives at sandschi.github.io/Boopli the base is '/Boopli'.
// With a custom (sub)domain: set `site` to that address and `base` to '/', and change the
// '/Boopli/' prefix of the two hero links in src/content/docs/index.mdx.
export default defineConfig({
	site: 'https://sandschi.github.io',
	base: '/Boopli',
	integrations: [
		starlight({
			title: 'Boopli',
			logo: { src: './src/assets/slime.png', alt: '' },
			favicon: '/favicon.png',
			customCss: ['./src/styles/boopli.css'],
			components: {
				ThemeProvider: './src/components/AlwaysDark.astro',
				ThemeSelect: './src/components/NoThemeSelect.astro',
			},
			description: 'An ADHD-friendly chore and task companion that lives inside Home Assistant.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/sandschi/Boopli' }],
			editLink: { baseUrl: 'https://github.com/sandschi/Boopli/edit/main/docs-site/' },
			// English lives at the root. Every other language has its pages in a folder named after it
			// (src/content/docs/de/...). A page that is not translated yet shows the English one.
			defaultLocale: 'root',
			locales: {
				root: { label: 'English', lang: 'en' },
				de: { label: 'Deutsch', lang: 'de' },
				nl: { label: 'Nederlands', lang: 'nl' },
				fr: { label: 'Français', lang: 'fr' },
				es: { label: 'Español', lang: 'es' },
			},
			sidebar: [
				group('start_here', ['welcome', 'install', 'setup', 'today']),
				group('everyday_use', ['chores', 'ai-help', 'ask-claude', 'my-home', 'away-mode', 'pet']),
				group('nudges_and_the_wall', ['nudges', 'wall-board']),
				group('more', ['automations', 'data-and-backups', 'troubleshooting', 'roadmap', 'translating', 'development']),
			],
		}),
	],
});
