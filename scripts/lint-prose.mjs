#!/usr/bin/env node
// Prose linter for the zh-TW writing standard.
// Rules: /handbook/zh-tw/contributing/writing-guide/ (src/content/docs/zh-tw/contributing/writing-guide.mdx).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const isCjk = (ch) => ch !== undefined && new RegExp(`[${CJK}]`).test(ch);
const isAlnum = (ch) => ch !== undefined && /[A-Za-z0-9]/.test(ch);
// Full-width marks that may stay full-width.
const FW_ALLOWED = '，。';
// Characters that must not appear in prose.
const FORBIDDEN = /[（）：；！？「」『』《》〈〉、【】〔〕～“”‘’…⋯—–\u3000\uff01-\uff0b\uff0d-\uff5e]/g;
// Half-width symbols that need a space when they touch a CJK character.
const SPACED_SYMBOLS = '-+=&@$#\\\\<>%';
// Neutral placeholder for removed HTML/JSX tags.
const NUL = '\u0000';

/** Attribute and frontmatter keys whose values are visible text. */
const TEXT_KEYS = ['title', 'description', 'tagline', 'text', 'label'];

/**
 * Lint one line of visible prose. Returns a list of messages.
 * @param {string} raw
 * @returns {string[]}
 */
export function lintProse(raw) {
	const errors = [];
	let t = raw;
	// Inline code, autolinks and bare URLs count as one half-width word.
	// A code span ends at the next backtick run of the same length.
	t = t.replace(/(?<!`)(`+)(?!`)(.+?)(?<!`)\1(?!`)/g, 'x');
	t = t.replace(/<https?:\/\/[^>]*>/g, 'x');
	t = t.replace(/https?:\/\/[^\s)\]>"']+/g, 'x');
	// Links and images: keep [text], drop (target). Images become plain links.
	t = t.replace(/!\[/g, '[');
	t = t.replace(/\]\([^)]*\)/g, ']');
	// HTML/JSX tags are neutral.
	t = t.replace(/<\/?[A-Za-z][^>]*>/g, NUL);

	for (const m of t.matchAll(FORBIDDEN)) {
		errors.push(`forbidden full-width or typographic character "${m[0]}"`);
	}

	const chars = [...t];
	let quoteOpen = false;
	let boldOpen = false;
	const emOpen = { '*': false, _: false };
	for (let i = 0; i < chars.length; i++) {
		const c = chars[i];
		const prev = chars[i - 1];
		const next = chars[i + 1];

		if (isCjk(c) && isAlnum(next)) errors.push(`missing space between "${c}" and "${next}"`);
		if (isAlnum(c) && isCjk(next)) errors.push(`missing space between "${c}" and "${next}"`);

		if (c === '*' && next === '*') {
			// "**" works like a bracket pair: space outside, none inside.
			const after = chars[i + 2];
			if (!boldOpen && isCjk(prev)) errors.push('missing space before "**"');
			if (!boldOpen && after === ' ') errors.push('space inside "**"');
			if (boldOpen && isCjk(after)) errors.push('missing space after "**"');
			if (boldOpen && prev === ' ') errors.push('space inside "**"');
			boldOpen = !boldOpen;
			i++;
			continue;
		}
		if ((c === '*' || c === '_') && !(isAlnum(prev) && isAlnum(next))) {
			// Single emphasis markers also take spaces outside only. Intraword "_" is not a marker.
			const open = emOpen[c];
			if (!open && isCjk(prev)) errors.push(`missing space before "${c}"`);
			if (!open && next === ' ') errors.push(`space inside "${c}"`);
			if (open && isCjk(next)) errors.push(`missing space after "${c}"`);
			if (open && prev === ' ') errors.push(`space inside "${c}"`);
			emOpen[c] = !open;
			continue;
		}
		if (c === '(' || c === '[') {
			if (isCjk(prev) || (c === '(' && isAlnum(prev))) errors.push(`missing space before "${c}"`);
			if (next === ' ') errors.push(`space inside "${c}"`);
		} else if (c === ')' || c === ']') {
			if (isCjk(next) || (c === ')' && isAlnum(next))) errors.push(`missing space after "${c}"`);
			if (prev === ' ') errors.push(`space inside "${c}"`);
		} else if (c === '"') {
			if (!quoteOpen && isCjk(prev)) errors.push('missing space before opening quote');
			if (!quoteOpen && next === ' ') errors.push('space inside quotes');
			if (quoteOpen && isCjk(next)) errors.push('missing space after closing quote');
			if (quoteOpen && prev === ' ') errors.push('space inside quotes');
			quoteOpen = !quoteOpen;
		} else if (':;?!'.includes(c)) {
			if (prev === ' ' && isCjk(chars[i - 2])) errors.push(`space before "${c}"`);
			if (isCjk(next) || (isCjk(prev) && isAlnum(next))) errors.push(`missing space after "${c}"`);
		} else if (c === '/') {
			if (prev === ' ' && next === ' ') errors.push('space around "/"');
		} else if (c === ',' || c === '.') {
			if (isCjk(prev)) errors.push(`half-width "${c}" after CJK; use "${c === ',' ? '，' : '。'}"`);
		} else if (c === '%' && prev === ' ' && /[0-9]/.test(chars[i - 2] ?? '')) {
			errors.push('space between number and "%"');
		} else if (SPACED_SYMBOLS.includes(c)) {
			if (isCjk(prev) || isCjk(next)) errors.push(`missing space between CJK and "${c}"`);
		} else if (FW_ALLOWED.includes(c)) {
			if (prev === ' ') errors.push(`space before "${c}"`);
			if (next === ' ') errors.push(`space after "${c}"`);
		}
	}
	return errors;
}

const stripQuotes = (v) => v.trim().replace(/^(['"])(.*)\1$/, '$2');
const isFence = (line) => /^\s*(```|~~~)/.test(line);
const isTableDivider = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
const isBlockStart = (line) =>
	/^\s*([-*+]\s|\d+\.\s|#|>|\||<|:::|import\s|export\s)/.test(line) || isFence(line);
const firstChar = (s) => [...s.trim()][0];
const lastChar = (s) => [...s.trim()].at(-1);
const isWide = (ch) => isCjk(ch) || (ch !== undefined && FW_ALLOWED.includes(ch));

/** Lint string values of visible-text attributes, e.g. title="...". */
function lintAttributes(line, report) {
	const re = new RegExp(`\\b(${TEXT_KEYS.join('|')})=(?:"([^"]*)"|'([^']*)'|\\{["'\`]([^"'\`]*)["'\`]\\})`, 'g');
	for (const m of line.matchAll(re)) {
		for (const e of lintProse(m[2] ?? m[3] ?? m[4] ?? '')) report(`${m[1]} attribute: ${e}`);
	}
}

/**
 * Lint a Markdown or MDX document.
 * @param {string} text
 * @returns {{line: number, message: string}[]}
 */
export function lintMarkdown(text) {
	const out = [];
	const lines = text.split(/\r?\n/);
	let i = 0;

	if (lines[0] === '---') {
		for (i = 1; i < lines.length && lines[i] !== '---'; i++) {
			const m = lines[i].match(new RegExp(`^\\s*(?:-\\s+)?(${TEXT_KEYS.join('|')}):\\s*(.+)$`));
			if (!m) continue;
			for (const e of lintProse(stripQuotes(m[2]))) out.push({ line: i + 1, message: `frontmatter ${m[1]}: ${e}` });
		}
		i++;
	}

	let inFence = false;
	let fenceMarker = '';
	let inComment = false;
	let prevProse = null;
	for (; i < lines.length; i++) {
		const line = lines[i];
		const n = i + 1;
		const report = (message) => out.push({ line: n, message });

		if (inFence) {
			if (line.trim().startsWith(fenceMarker)) inFence = false;
			prevProse = null;
			continue;
		}
		if (isFence(line)) {
			inFence = true;
			fenceMarker = line.trim().slice(0, 3);
			const title = line.match(/title=(?:"([^"]*)"|'([^']*)')/);
			if (title) for (const e of lintProse(title[1] ?? title[2])) report(`code block title: ${e}`);
			prevProse = null;
			continue;
		}
		let body = line;
		if (inComment) {
			const end = body.indexOf('-->');
			if (end === -1) continue;
			body = body.slice(end + 3);
			inComment = false;
		}
		body = body.replace(/<!--.*?-->/g, '').replace(/\{\/\*.*?\*\/\}/g, '');
		if (body.includes('<!--')) {
			body = body.slice(0, body.indexOf('<!--'));
			inComment = true;
		}
		if (body.trim() === '' || /^\s*(import|export)\s/.test(body) || isTableDivider(body)) {
			prevProse = null;
			continue;
		}

		const aside = body.match(/^\s*:::\w*(?:\[(.*)\])?\s*$/);
		if (aside) {
			if (aside[1]) for (const e of lintProse(aside[1])) report(`aside title: ${e}`);
			prevProse = null;
			continue;
		}

		lintAttributes(body, report);
		const prose = body.replace(/^\s*(#{1,6}\s|>\s?|[-*+]\s|\d+\.\s)/, '');
		// Table cell delimiters and their padding are syntax, not prose.
		const cells = /^\s*\|/.test(prose) ? prose.replace(/\s*(?<!\\)\|\s*/g, NUL) : prose;
		for (const e of lintProse(cells)) report(e);

		// A soft line break between wide characters renders as a stray space.
		if (prevProse !== null && !isBlockStart(body) && isWide(lastChar(prevProse)) && isWide(firstChar(body))) {
			report('paragraph continues on a new line; keep each paragraph on one line');
		}
		// Table rows and headings end a paragraph.
		prevProse = /^\s*(\||#)/.test(body) ? null : body;
	}
	return out;
}

/** Lint every string value of a JSON document. */
export function lintJson(text) {
	const out = [];
	const walk = (v, path) => {
		if (typeof v === 'string') for (const e of lintProse(v)) out.push({ line: 0, message: `${path}: ${e}` });
		else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
	};
	walk(JSON.parse(text), '');
	return out;
}

/** Lint string literals that contain CJK in a JavaScript config file. */
export function lintConfig(text) {
	const out = [];
	text.split(/\r?\n/).forEach((line, idx) => {
		if (/^\s*\/\//.test(line)) return;
		for (const m of line.matchAll(/'([^'\\]*)'|"([^"\\]*)"/g)) {
			const s = m[1] ?? m[2];
			if (!new RegExp(`[${CJK}]`).test(s)) continue;
			for (const e of lintProse(s)) out.push({ line: idx + 1, message: e });
		}
	});
	return out;
}

/** Lint one file by its extension. */
export function lintFile(path) {
	const text = readFileSync(path, 'utf8');
	const ext = extname(path);
	if (ext === '.md' || ext === '.mdx') return lintMarkdown(text);
	if (ext === '.json') return lintJson(text);
	if (ext === '.mjs' || ext === '.js' || ext === '.ts') return lintConfig(text);
	return [];
}

function collect(path) {
	if (statSync(path).isDirectory()) return readdirSync(path).flatMap((f) => collect(join(path, f)));
	return ['.md', '.mdx', '.json', '.mjs', '.js', '.ts'].includes(extname(path)) ? [path] : [];
}

const DEFAULT_TARGETS = ['src/content/docs/zh-tw', 'src/content/docs/404.md', 'src/content/i18n/zh-TW.json', 'astro.config.mjs'];

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const targets = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_TARGETS;
	let count = 0;
	for (const file of targets.flatMap(collect)) {
		for (const { line, message } of lintFile(file)) {
			console.log(`${relative(process.cwd(), file)}:${line}: ${message}`);
			count++;
		}
	}
	if (count > 0) {
		console.error(`\n${count} prose problem(s) found.`);
		process.exit(1);
	}
	console.log('Prose lint passed.');
}
