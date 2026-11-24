// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// While the site lives at sandschi.github.io/Boopli the base is '/Boopli'.
// With a custom (sub)domain: set `site` to that address and `base` to '/', and change the
// '/Boopli/' prefix of the two hero links in src/content/docs/index.mdx.
export default defineConfig({
	site: 'https://sandschi.github.io',
	base: '/Boopli',
	integrations: [
		starlight({
			title: 'Boopli',
			description: 'An ADHD-friendly chore and task companion that lives inside Home Assistant.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/sandschi/Boopli' }],
			editLink: { baseUrl: 'https://github.com/sandschi/Boopli/edit/main/docs-site/' },
			// English lives at the root. Another language is added here later, with its pages
			// in a folder named after it (src/content/docs/de/...).
			defaultLocale: 'root',
			locales: { root: { label: 'English', lang: 'en' } },
			sidebar: [
				{ label: 'Start here', items: ['install', 'setup', 'today'] },
				{ label: 'Everyday use', items: ['chores', 'ai-help', 'ask-claude', 'my-home', 'away-mode', 'pet'] },
				{ label: 'Nudges and the wall', items: ['nudges', 'wall-board'] },
				{ label: 'More', items: ['automations', 'data-and-backups', 'troubleshooting', 'roadmap', 'development'] },
			],
		}),
	],
});
