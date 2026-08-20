/* eslint-env node */
const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const loadDecorator = require('../helpers/load-decorator.cjs');

const feedMarkup = `
  <div class="journal-feed block" data-block-index="7">
    <div>
      <div><p data-prose-index="0">20 Aug 2026</p></div>
      <div><p data-prose-index="1">Investigation · Validated</p></div>
      <div><h3 data-prose-index="2"><a href="/journal/asset-identity">Make the asset identity durable</a></h3><p data-prose-index="3">Repository context is part of identity.</p></div>
      <div><p data-prose-index="4">Assets · Delivery</p></div>
    </div>
    <div>
      <div><p data-prose-index="5">25 Jun 2026</p></div>
      <div><p data-prose-index="6">Experiment · Testing</p></div>
      <div><h3 data-prose-index="7"><a href="/journal/duplicate-detection">Surface duplicate evidence</a></h3></div>
      <div><p data-prose-index="8">Assets UI · NUI</p></div>
      <div><p data-prose-index="9">Optional note</p></div>
    </div>
  </div>`;

test('journal feed preserves rows, links, prose markers, and block identity', async () => {
  const dom = new JSDOM(feedMarkup);
  const { document } = dom.window;
  const block = document.querySelector('.journal-feed');
  const rows = [...block.children];
  const links = [...block.querySelectorAll('a')];
  const tracked = [...block.querySelectorAll('[data-prose-index]')];
  const decorate = await loadDecorator('blocks/journal-feed/journal-feed.js', dom.window);

  decorate(block);

  assert.equal(block.dataset.blockIndex, '7');
  assert.equal(block.children.length, 2);
  rows.forEach((row, index) => assert.strictEqual(block.children[index], row));
  links.forEach((link) => assert.ok(block.contains(link)));
  tracked.forEach((node) => assert.ok(block.contains(node)));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 10);
  assert.equal(block.querySelectorAll('.journal-feed-entry').length, 2);
  assert.equal(block.querySelectorAll('.journal-feed-date').length, 2);
  assert.equal(block.querySelectorAll('.journal-feed-state').length, 2);
  assert.equal(block.querySelectorAll('.journal-feed-story').length, 2);
  assert.equal(block.querySelectorAll('.journal-feed-systems').length, 2);
  assert.equal(block.querySelectorAll('.journal-feed-extra').length, 1);
  assert.equal(block.querySelectorAll('button').length, 0);
});

test('journal feed decoration is idempotent and sparse rows remain readable', async () => {
  const dom = new JSDOM('<div class="journal-feed"><div><div><p data-prose-index="0">20 Aug 2026</p></div></div></div>');
  const block = dom.window.document.querySelector('.journal-feed');
  const paragraph = block.querySelector('p');
  const decorate = await loadDecorator('blocks/journal-feed/journal-feed.js', dom.window);

  decorate(block);
  const htmlAfterFirstPass = block.innerHTML;
  decorate(block);

  assert.equal(block.innerHTML, htmlAfterFirstPass);
  assert.strictEqual(block.querySelector('p'), paragraph);
  assert.equal(block.querySelectorAll('.journal-feed-date').length, 1);
  assert.equal(block.querySelectorAll('.journal-feed-entry').length, 1);

  block.innerHTML = `
    <div>
      <div><div class="prosemirror-editor" data-prose-index="10"><div class="ProseMirror"><p>03 Aug 2026</p></div></div></div>
      <div><p data-prose-index="11">Release · Validated</p></div>
      <div><h3 data-prose-index="12">Recovered entry</h3></div>
    </div>`;
  decorate(block);

  assert.equal(block.querySelectorAll('.journal-feed-entry').length, 1);
  assert.equal(block.querySelectorAll('.journal-feed-date').length, 1);
  assert.equal(block.querySelectorAll('.journal-feed-state').length, 1);
  assert.equal(block.querySelectorAll('.journal-feed-story').length, 1);
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 3);
  assert.match(block.textContent, /Recovered entry/);
});
