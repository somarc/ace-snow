/* eslint-env node */
const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const loadDecorator = require('../helpers/load-decorator.cjs');

test('metadata remains intact for Canvas while staying out of the rendered page', async () => {
  const dom = new JSDOM(`
    <div class="metadata block" data-block-index="8">
      <div><div><p data-prose-index="0">Title</p></div><div><p data-prose-index="1">Field Journal</p></div></div>
    </div>`);
  const block = dom.window.document.querySelector('.metadata');
  const fields = [...block.querySelectorAll('[data-prose-index]')];
  const decorate = await loadDecorator('blocks/metadata/metadata.js', dom.window);

  decorate(block);
  decorate(block);

  assert.equal(block.hidden, true);
  assert.equal(block.dataset.blockIndex, '8');
  assert.deepEqual(fields.map((field) => field.textContent.trim()), ['Title', 'Field Journal']);
  fields.forEach((field) => assert.ok(block.contains(field)));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 2);
});
