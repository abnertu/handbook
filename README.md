# AbnerTu Handbook

Technical handbooks in Traditional Chinese, built with Astro and Starlight and published at <https://abnertu.github.io/handbook/>.

[![Deploy Pages](https://github.com/abnertu/handbook/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/abnertu/handbook/actions/workflows/deploy-pages.yml?query=branch%3Amain)
[![Node.js](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fabnertu%2Fhandbook%2Fmain%2Fpackage.json&query=%24.engines.node&label=Node.js&logo=nodedotjs&logoColor=white&color=5FA04E)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fabnertu%2Fhandbook%2Fmain%2Fpackage.json&query=%24.dependencies.astro&label=Astro&logo=astro&logoColor=white&color=BC52EE)](https://astro.build/)

## Handbooks

| Domain | Handbook | Start page |
| --- | --- | --- |
| CI | GitLab Runner and Executor | <https://abnertu.github.io/handbook/zh-tw/ci/gitlab-runner/> |

## Install

Install [Node.js](https://nodejs.org/) 24. The `.nvmrc` file pins the major version.

```sh
git clone https://github.com/abnertu/handbook.git
cd handbook
npm ci
```

## Usage

Start the local preview server:

```sh
npm run dev
```

Open <http://localhost:4321/handbook/zh-tw/> in a browser.

Run the checks that CI runs:

```sh
npm test
npm run lint:prose
npm run build
```

## Content

Pages are Markdown and MDX files under `src/content/docs/zh-tw/`. Each file path maps to a URL under `/handbook/zh-tw/`.

Read the [writing guide](https://abnertu.github.io/handbook/zh-tw/contributing/writing-guide/) before you write a page. Read the [content structure guide](https://abnertu.github.io/handbook/zh-tw/contributing/structure/) before you add a handbook or a language.

## Deployment

Each push to `main` runs the checks and deploys the site to GitHub Pages with the official Astro GitHub Action.
