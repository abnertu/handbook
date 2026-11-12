// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';

export default defineConfig({
	site: 'https://abnertu.github.io',
	base: '/handbook',
	trailingSlash: 'always',
	// No root locale: send the site root to the default locale.
	redirects: { '/': '/handbook/zh-tw/' },
	markdown: {
		// Smart punctuation turns half-width quotes and dashes into typographic ones,
		// which the writing guide forbids.
		processor: satteri({ features: { smartPunctuation: false } }),
	},
	integrations: [
		starlight({
			title: 'AbnerTu Handbook',
			defaultLocale: 'zh-tw',
			locales: {
				'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/abnertu/handbook' }],
			plugins: [starlightLinksValidator()],
			sidebar: [
				{
					label: 'CI 持續整合',
					items: [
						{
							label: 'GitLab Runner 與 Executor',
							items: [
								{ slug: 'ci/gitlab-runner' },
								{ label: '概念', items: [{ autogenerate: { directory: 'ci/gitlab-runner/concepts' } }] },
								{ label: '操作指南', items: [{ autogenerate: { directory: 'ci/gitlab-runner/guides' } }] },
								{ label: 'Executor', items: [{ autogenerate: { directory: 'ci/gitlab-runner/executors' } }] },
								{ label: '參考', items: [{ autogenerate: { directory: 'ci/gitlab-runner/reference' } }] },
								{ label: '實作練習', items: [{ autogenerate: { directory: 'ci/gitlab-runner/labs' } }] },
							],
						},
					],
				},
				{
					label: '貢獻指南',
					items: [{ autogenerate: { directory: 'contributing' } }],
				},
			],
		}),
	],
});
