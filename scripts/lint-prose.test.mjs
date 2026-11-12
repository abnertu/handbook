import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { lintConfig, lintJson, lintMarkdown, lintProse } from './lint-prose.mjs';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const flags = (text) => assert.notDeepEqual(lintMarkdown(text), [], `expected a problem in: ${text}`);
const passes = (text) => assert.deepEqual(lintMarkdown(text), [], `expected no problem in: ${text}`);

test('clean fixture with every skipped construct passes', () => {
	assert.deepEqual(lintMarkdown(fixture('clean.mdx')), []);
});

test('forbidden full-width punctuation', () => {
	for (const s of ['使用（容器）。', '注意：這裡。', '真的！', '為什麼？', '設定「值」。', '甲、乙。', '分號；後面。', '參考《手冊》。', '全形\u3000空格。', '等等⋯']) {
		assert.notDeepEqual(lintProse(s), [], s);
	}
});

test('typographic quotes, dashes and ellipsis', () => {
	for (const s of ['設定 “值”。', '範圍 – 結束。', '說明 — 補充。', '等等…']) assert.notDeepEqual(lintProse(s), [], s);
});

test('full-width comma and period are allowed', () => {
	assert.deepEqual(lintProse('第一，第二。'), []);
});

test('space between CJK and letters or digits', () => {
	flags('使用Docker執行。');
	flags('保留10 GB。');
	passes('使用 Docker 執行，保留 10 GB。');
});

test('brackets take spaces outside only', () => {
	flags('使用executor(容器隔離)執行。');
	flags('使用 executor(容器隔離) 執行。');
	flags('使用 executor (容器隔離)執行。');
	flags('使用 executor ( 容器隔離 ) 執行。');
	passes('使用 executor (容器隔離) 執行。');
});

test('quotes take spaces outside only', () => {
	flags('設定"concurrent" 的值。');
	flags('設定 "concurrent"的值。');
	passes('設定 "concurrent"，"limit" 兩個值。');
	passes('稱為 "中文" 的值。');
	flags('設定 " concurrent " 的值。');
});

test('colon, question and exclamation marks attach left and space right', () => {
	flags('注意:這一步。');
	flags('注意 : 這一步。');
	flags('為什麼 ? 因為。');
	flags('注意:Docker 需要 root。');
	flags('問題?Docker 才能執行。');
	passes('注意: 這一步。為什麼? 因為。');
	passes('時間是 10:30，網址 https://x.y/a?b=1。');
});

test('half-width comma or period after CJK', () => {
	flags('第一,第二。');
	flags('結束.');
});

test('no space next to full-width comma and period', () => {
	flags('使用 Docker ，然後執行。');
	flags('使用 Docker， 然後執行。');
	flags('結束 。');
});

test('markup counts as half-width: links, bold and inline code', () => {
	flags('請參考[官方文件](https://docs.gitlab.com/) 的說明。');
	flags('請參考 [官方文件](https://docs.gitlab.com/)的說明。');
	flags('這是**重點** 文字。');
	flags('這是 **重點**文字。');
	flags('這是 ** 重點 ** 文字。');
	flags('這是_重點_文字。');
	flags('這是*重點*文字。');
	passes('這是 _重點_ 文字，變數 foo_bar 不受影響。');
	flags('設定`concurrent` 為 4。');
	flags('設定 `concurrent`為 4。');
	passes('這是 **重點** 文字，設定 `concurrent` 為 4，請參考 [文件](https://x.y/)。');
});

test('percent and other symbols need spaces from CJK', () => {
	flags('使用率 80%時清理。');
	flags('版本 A+B之後。');
	passes('使用率 80% 時清理，shell/docker 都可以。');
	flags('shell / docker executor 都支援。');
	flags('使用率 80 % 時清理。');
});

test('headings, list items, table cells and blockquotes are linted', () => {
	flags('## 安裝Runner');
	flags('- 使用Docker。');
	flags('| 欄位 | 使用Docker |');
	passes('| 欄位 | 說明結尾有句號。 |');
	flags('> 注意：這裡。');
});

test('soft-wrapped CJK paragraph lines are reported', () => {
	flags('這是第一行\n接著第二行。');
	flags('第一句，\n第二句。');
	passes('第一段。\n\n第二段。');
	passes('- 第一項\n- 第二項');
	passes('English line\ncontinues here.');
	passes('## 標題\n第一段。');
});

test('frontmatter values are linted', () => {
	flags('---\ntitle: 安裝Runner\n---\n');
	flags('---\ndescription: 說明（範例）\n---\n');
	flags('---\nhero:\n  tagline: 手冊：入門\n---\n');
	flags('---\nhero:\n  actions:\n    - text: 開始閱讀！\n---\n');
	flags('---\nsidebar:\n  label: 概觀Runner\n---\n');
	passes('---\nslug: 中文Runner\n---\n');
});

test('text inside components and asides is linted', () => {
	flags('<Steps>\n1. 安裝Runner。\n</Steps>');
	flags('<Aside>\n注意：這裡。\n</Aside>');
	flags(':::note\n注意：這裡。\n:::');
	flags(':::note[注意：標題]\n內容。\n:::');
});

test('visible-text attributes and code block titles are linted', () => {
	flags('<Card title="安裝（Linux）" icon="rocket" />');
	flags('<LinkCard title="文件" description="說明：範例" href="/handbook/zh-tw/" />');
	flags('```toml title="範例：config.toml"\nx = 1\n```');
	passes('<Card title="安裝 (Linux)" icon="rocket" />');
});

test('code, URLs, comments and import lines are skipped', () => {
	passes('```\n中文（全形）：\n```');
	passes('執行 `echo 中文（全形）` 指令。');
	passes('寫成 ``設定 `concurrent`為 4。`` 是錯的。');
	passes('<!-- 註解：全形 -->');
	passes('<!--\n註解：全形\n-->');
	passes("import { Aside } from '@astrojs/starlight/components';");
	passes('| :--- | ---: |');
});

test('JSON string values are linted', () => {
	assert.notDeepEqual(lintJson('{"expressiveCode.copyButtonCopied": "複製成功！"}'), []);
	assert.deepEqual(lintJson('{"heading.anchorLabel": "章節: {{title}}"}'), []);
});

test('CJK string literals in config are linted', () => {
	assert.notDeepEqual(lintConfig("label: 'CI 持續整合（入門）',"), []);
	assert.deepEqual(lintConfig("label: 'CI 持續整合', icon: 'github',"), []);
});
