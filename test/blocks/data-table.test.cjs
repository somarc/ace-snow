/* eslint-env node */
const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const loadDecorator = require('../helpers/load-decorator.cjs');

const tableMarkup = `
  <div class="data-table block" data-block-index="9">
    <div>
      <div><p data-prose-index="0">Fact</p></div>
      <div><p data-prose-index="1">Question</p></div>
    </div>
    <div>
      <div><p data-prose-index="2"><strong>R · Repository</strong></p></div>
      <div><p data-prose-index="3">Which repository resolves the token?</p></div>
    </div>
    <div>
      <div><p data-prose-index="4">Extra row</p></div>
      <div><p data-prose-index="5">Extra detail</p></div>
      <div><p data-prose-index="6">Optional extra cell</p></div>
    </div>
  </div>`;

test('data table restores semantics and preserves every authored identity', async () => {
  const dom = new JSDOM(tableMarkup);
  const { document } = dom.window;
  const block = document.querySelector('.data-table');
  const tracked = [...block.querySelectorAll('[data-prose-index]')];
  const decorate = await loadDecorator('blocks/data-table/data-table.js', dom.window);

  decorate(block);

  assert.equal(block.dataset.blockIndex, '9');
  assert.equal(block.querySelectorAll(':scope > table').length, 1);
  assert.equal(block.querySelectorAll('thead tr').length, 1);
  assert.equal(block.querySelectorAll('tbody tr').length, 2);
  assert.equal(block.querySelectorAll('th[scope="col"]').length, 2);
  assert.equal(block.querySelectorAll('td').length, 5);
  tracked.forEach((node) => assert.ok(block.contains(node)));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 7);
  assert.equal(block.querySelectorAll('button, a').length, 0);
  assert.equal(block.tabIndex, 0);
  assert.equal(block.getAttribute('role'), 'region');
  assert.equal(block.getAttribute('aria-label'), 'Scrollable data table');
});

test('data table is idempotent and safely accepts no rows', async () => {
  const populated = new JSDOM(tableMarkup);
  const block = populated.window.document.querySelector('.data-table');
  const decorate = await loadDecorator('blocks/data-table/data-table.js', populated.window);

  decorate(block);
  const firstPass = block.innerHTML;
  decorate(block);
  assert.equal(block.innerHTML, firstPass);

  block.innerHTML = `
    <div>
      <div><p data-prose-index="10">Replacement head</p></div>
      <div><p data-prose-index="11">Replacement detail</p></div>
    </div>
    <div>
      <div><p data-prose-index="12">Replacement value</p></div>
      <div><p data-prose-index="13">Recovered after refresh</p></div>
    </div>`;
  decorate(block);
  assert.equal(block.querySelectorAll(':scope > table').length, 1);
  assert.equal(block.querySelectorAll('th').length, 2);
  assert.equal(block.querySelectorAll('td').length, 2);
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 4);
  assert.match(block.textContent, /Recovered after refresh/);

  block.replaceChildren();
  decorate(block);
  assert.equal(block.hasAttribute('tabindex'), false);
  assert.equal(block.hasAttribute('role'), false);
  assert.equal(block.hasAttribute('aria-label'), false);

  const empty = new JSDOM('<div class="data-table" data-block-index="2"></div>');
  const emptyBlock = empty.window.document.querySelector('.data-table');
  const decorateEmpty = await loadDecorator('blocks/data-table/data-table.js', empty.window);
  decorateEmpty(emptyBlock);
  decorateEmpty(emptyBlock);
  assert.equal(emptyBlock.dataset.blockIndex, '2');
  assert.equal(emptyBlock.dataset.decorated, 'true');
  assert.equal(emptyBlock.children.length, 0);
});

test('data table moves rich mounted fields intact with identity and listeners', async () => {
  const dom = new JSDOM(`
    <div class="data-table" data-block-index="12">
      <div>
        <div><div class="prosemirror-editor" data-prose-index="0"><div class="ProseMirror"><p>Kind</p></div></div></div>
        <div><p data-prose-index="1">Evidence</p></div>
      </div>
      <div>
        <div><ul data-prose-index="2"><li>Source-proven</li><li>Reproduced</li></ul></div>
        <div><p data-prose-index="3"><a href="/evidence"><code>trace()</code></a></p></div>
      </div>
      <div>
        <div><blockquote data-prose-index="4"><p>Keep the field.</p></blockquote></div>
        <div><p data-prose-index="5"><img data-image-index="0" src="/evidence.webp" alt="Evidence"></p></div>
      </div>
    </div>`);
  const { document, Event } = dom.window;
  const block = document.querySelector('.data-table');
  const editor = block.querySelector('.prosemirror-editor');
  const link = block.querySelector('a');
  const list = block.querySelector('ul');
  const image = block.querySelector('img');
  let clicks = 0;
  link.addEventListener('click', (event) => {
    event.preventDefault();
    clicks += 1;
  });
  const decorate = await loadDecorator('blocks/data-table/data-table.js', dom.window);

  decorate(block);
  link.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

  assert.strictEqual(block.querySelector('.prosemirror-editor'), editor);
  assert.strictEqual(block.querySelector('a'), link);
  assert.strictEqual(block.querySelector('ul'), list);
  assert.strictEqual(block.querySelector('img'), image);
  assert.equal(clicks, 1);
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 6);
  assert.equal(block.querySelectorAll('[data-image-index]').length, 1);
  assert.equal(block.querySelectorAll('.prosemirror-editor > .ProseMirror > p').length, 1);
  assert.equal(block.dataset.blockIndex, '12');
});
