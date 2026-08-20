/* eslint-env node */
const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const loadDecorator = require('../helpers/load-decorator.cjs');

const canonicalMarkup = `
  <div class="journal-hero block" data-block-index="4">
    <div>
      <div><p data-prose-index="0"><picture><img data-image-index="0" src="/media/core.webp" alt="Evidence core"></picture></p></div>
      <div><h1 data-prose-index="1">Follow the trace.</h1><p data-prose-index="2">A living field journal.</p><p data-prose-index="3"><a href="/journal/asset-identity"><strong>Read the latest finding</strong></a></p></div>
    </div>
    <div>
      <div><p data-prose-index="4">6 client needs</p></div>
      <div><p data-prose-index="5">2 deep investigations</p></div>
    </div>
  </div>`;

test('journal hero preserves every Canvas identity and authored node', async () => {
  const dom = new JSDOM(canonicalMarkup);
  const { document } = dom.window;
  const block = document.querySelector('.journal-hero');
  const tracked = [...block.querySelectorAll('[data-prose-index], [data-image-index]')];
  const h1 = block.querySelector('h1');
  const image = block.querySelector('img');
  const link = block.querySelector('a');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.equal(block.dataset.blockIndex, '4');
  assert.equal(block.children.length, 2);
  assert.strictEqual(block.querySelector('h1'), h1);
  assert.strictEqual(block.querySelector('img'), image);
  assert.strictEqual(block.querySelector('a'), link);
  tracked.forEach((node) => assert.ok(block.contains(node)));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 6);
  assert.equal(block.querySelectorAll('[data-image-index]').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-media').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-copy').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-fact').length, 2);
  assert.equal(block.querySelectorAll('button').length, 0);
  assert.equal(block.classList.contains('journal-hero-has-media'), true);
});

test('journal hero decoration is idempotent', async () => {
  const dom = new JSDOM(canonicalMarkup);
  const block = dom.window.document.querySelector('.journal-hero');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);
  const htmlBefore = block.innerHTML;

  decorate(block);
  const htmlAfterFirstPass = block.innerHTML;
  decorate(block);

  assert.notEqual(htmlAfterFirstPass, htmlBefore);
  assert.equal(block.innerHTML, htmlAfterFirstPass);
  assert.equal(block.querySelectorAll('.journal-hero-stage').length, 1);

  block.innerHTML = `
    <div>
      <div><div class="prosemirror-editor" data-prose-index="20"><div class="ProseMirror"><h1>Recovered hero</h1></div></div></div>
      <div><p data-prose-index="21"><picture><img data-image-index="5" src="/replacement.webp" alt="Replacement"></picture></p></div>
    </div>
    <div><div><p data-prose-index="22">Fresh fact</p></div></div>`;
  decorate(block);

  assert.equal(block.querySelectorAll('.journal-hero-stage').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-copy').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-media').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-fact').length, 1);
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 3);
  assert.equal(block.querySelectorAll('[data-image-index]').length, 1);
  assert.match(block.textContent, /Recovered hero/);
});

test('journal hero degrades safely when optional media is absent', async () => {
  const dom = new JSDOM('<div class="journal-hero"><div><div><h1 data-prose-index="0">Field journal</h1></div><div><p data-prose-index="1">Extra field</p></div></div></div>');
  const block = dom.window.document.querySelector('.journal-hero');
  const h1 = block.querySelector('h1');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.strictEqual(block.querySelector('h1'), h1);
  assert.equal(block.querySelectorAll('.journal-hero-media').length, 0);
  assert.equal(block.querySelectorAll('.journal-hero-copy').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-extra').length, 1);
  assert.equal(block.classList.contains('journal-hero-has-media'), false);
});

test('journal hero recognizes the canonical copy-first cover shape', async () => {
  const dom = new JSDOM(`
    <div class="journal-hero" data-block-index="11">
      <div>
        <div><h1 data-prose-index="0">Follow the work.</h1><p data-prose-index="1">A living journal.</p></div>
        <div><p data-prose-index="2"><picture><img data-image-index="0" src="/core.webp" alt="Evidence core"></picture></p></div>
      </div>
    </div>`);
  const block = dom.window.document.querySelector('.journal-hero');
  const tracked = [...block.querySelectorAll('[data-prose-index], [data-image-index]')];
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.equal(block.dataset.blockIndex, '11');
  assert.equal(block.firstElementChild.firstElementChild.classList.contains('journal-hero-copy'), true);
  assert.equal(block.firstElementChild.lastElementChild.classList.contains('journal-hero-media'), true);
  assert.equal(block.classList.contains('journal-hero-has-media'), true);
  tracked.forEach((node) => assert.ok(block.contains(node)));
  assert.equal(block.querySelectorAll('[data-prose-index], [data-image-index]').length, 4);
});

test('journal hero prioritizes optional media only when it is the first section LCP candidate', async () => {
  const dom = new JSDOM(`<main><div class="section">${canonicalMarkup}</div></main>`);
  const block = dom.window.document.querySelector('.journal-hero');
  const image = block.querySelector('img');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.equal(image.loading, 'eager');
  assert.equal(image.fetchPriority, 'high');
});
