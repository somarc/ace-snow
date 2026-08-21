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

const evidenceLedgerMarkup = `
  <div class="journal-hero evidence-ledger block" data-block-index="14">
    <div>
      <div>
        <p data-prose-index="0">ACE × ServiceNow / Living field journal</p>
        <h1 data-prose-index="1">Follow the work from friction to proof.</h1>
        <p data-prose-index="2">A living record of investigations and decisions.</p>
      </div>
      <div>
        <p data-prose-index="3">Entry 005 · Investigation · <strong>Validated</strong></p>
        <h2 data-prose-index="4"><a href="/journal/asset-identity">Make the asset identity durable.</a></h2>
        <p data-prose-index="5">Repository context is part of identity.</p>
        <p data-prose-index="6"><strong>R · P → intended A → D ✓</strong></p>
        <p data-prose-index="7">20 Aug 2026 · Oak · FileVault · Dynamic Media</p>
      </div>
    </div>
    <div>
      <div><p data-prose-index="8"><strong>Signal</strong></p><p data-prose-index="9">A persisted pointer moves.</p></div>
      <div><p data-prose-index="10"><strong>Boundary</strong></p><p data-prose-index="11">Two repositories own different facts.</p></div>
      <div><p data-prose-index="12"><strong>Evidence</strong></p><p data-prose-index="13">Source plus local reproduction.</p></div>
      <div><p data-prose-index="14"><strong>Decision</strong></p><p data-prose-index="15">One remote DAM now.</p></div>
      <div><p data-prose-index="16"><strong>Next</strong></p><p data-prose-index="17">Validate live topology.</p></div>
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

test('evidence ledger variant preserves authored identity and adds stable roles', async () => {
  const dom = new JSDOM(evidenceLedgerMarkup);
  const { document } = dom.window;
  const block = document.querySelector('.journal-hero');
  const tracked = [...block.querySelectorAll('[data-prose-index]')];
  const claim = block.firstElementChild.firstElementChild;
  const dossier = block.firstElementChild.lastElementChild;
  const method = block.lastElementChild;
  const methodCells = [...method.children];
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.equal(block.dataset.blockIndex, '14');
  assert.strictEqual(block.querySelector('.journal-hero-claim'), claim);
  assert.strictEqual(block.querySelector('.journal-hero-dossier'), dossier);
  assert.strictEqual(block.querySelector('.journal-hero-method'), method);
  methodCells.forEach((cell) => assert.ok(cell.classList.contains('journal-hero-step')));
  tracked.forEach((node) => assert.ok(block.contains(node)));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, tracked.length);
  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 5);
  assert.equal(block.querySelectorAll('.journal-hero-step.is-active').length, 1);
  assert.equal(block.querySelector('.journal-hero-step-control').getAttribute('aria-pressed'), 'true');
});

test('evidence ledger controls change emphasis without hiding or moving authored content', async () => {
  const dom = new JSDOM(evidenceLedgerMarkup);
  const { document } = dom.window;
  const block = document.querySelector('.journal-hero');
  const methodCells = [...block.lastElementChild.children];
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);
  const controls = [...block.querySelectorAll('.journal-hero-step-control')];
  controls[2].click();

  assert.equal(controls[0].getAttribute('aria-pressed'), 'false');
  assert.equal(controls[2].getAttribute('aria-pressed'), 'true');
  assert.strictEqual(block.querySelector('.journal-hero-step.is-active'), methodCells[2]);
  assert.match(block.querySelector('.journal-hero-step-status').textContent, /Evidence/);
  methodCells.forEach((cell) => assert.equal(cell.hidden, false));
});

test('evidence ledger controls follow in-place Canvas edits and withdraw for malformed labels', async () => {
  const dom = new JSDOM(evidenceLedgerMarkup);
  const block = dom.window.document.querySelector('.journal-hero');
  const signal = block.lastElementChild.firstElementChild.querySelector('strong');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);
  signal.textContent = 'Observation';
  await new Promise((resolve) => { dom.window.setTimeout(resolve, 0); });

  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 0);
  assert.equal(block.querySelectorAll('.journal-hero-step').length, 5);

  signal.textContent = 'Signal';
  await new Promise((resolve) => { dom.window.setTimeout(resolve, 0); });

  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 5);
  assert.equal(block.querySelector('.journal-hero-step-control').textContent, 'signal');
  assert.equal(block.querySelectorAll('.journal-hero-step.is-active').length, 1);
});

test('evidence ledger preserves optional dossier images across supported authored shapes', async () => {
  const mediaShapes = [
    '<picture><img data-image-index="9" src="/direct.webp" alt="Direct picture"></picture>',
    '<p data-prose-index="18"><picture><img data-image-index="9" src="/marked.webp" alt="Marked picture"></picture></p>',
    '<img data-image-index="9" src="/raw.webp" alt="Raw image">',
  ];
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', new JSDOM().window);

  mediaShapes.forEach((shape) => {
    const dom = new JSDOM(evidenceLedgerMarkup);
    const block = dom.window.document.querySelector('.journal-hero');
    const dossier = block.firstElementChild.lastElementChild;
    dossier.insertAdjacentHTML('beforeend', shape);
    const image = dossier.querySelector('[data-image-index="9"]');
    const prose = dossier.querySelector('[data-prose-index="18"]');

    decorate(block);

    assert.strictEqual(block.querySelector('[data-image-index="9"]'), image);
    if (prose) assert.strictEqual(block.querySelector('[data-prose-index="18"]'), prose);
    assert.equal(block.querySelectorAll('[data-image-index="9"]').length, 1);
    assert.equal(block.classList.contains('journal-hero-has-media'), true);
  });
});

test('evidence ledger decoration is idempotent and recovers after Canvas replaces inner DOM', async () => {
  const dom = new JSDOM(evidenceLedgerMarkup);
  const block = dom.window.document.querySelector('.journal-hero');
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);
  decorate(block);
  assert.equal(block.querySelectorAll('.journal-hero-step-controls').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 5);

  block.innerHTML = `
    <div>
      <div><div class="prosemirror-editor" data-prose-index="30"><div class="ProseMirror"><h1>Recovered claim</h1></div></div></div>
      <div><p data-prose-index="31">Recovered dossier</p></div>
    </div>
    <div>
      <div><div class="prosemirror-editor" data-prose-index="32"><div class="ProseMirror"><p><strong>Signal</strong></p></div></div><div class="prosemirror-editor" data-prose-index="33"><div class="ProseMirror"><p>Recovered signal.</p></div></div></div>
      <div><div class="prosemirror-editor" data-prose-index="34"><div class="ProseMirror"><p><strong>Boundary</strong></p></div></div><div class="prosemirror-editor" data-prose-index="35"><div class="ProseMirror"><p>Recovered boundary.</p></div></div></div>
      <div><div class="prosemirror-editor" data-prose-index="36"><div class="ProseMirror"><p><strong>Evidence</strong></p></div></div><div class="prosemirror-editor" data-prose-index="37"><div class="ProseMirror"><p>Recovered evidence.</p></div></div></div>
      <div><div class="prosemirror-editor" data-prose-index="38"><div class="ProseMirror"><p><strong>Decision</strong></p></div></div><div class="prosemirror-editor" data-prose-index="39"><div class="ProseMirror"><p>Recovered decision.</p></div></div></div>
      <div><div class="prosemirror-editor" data-prose-index="40"><div class="ProseMirror"><p><strong>Next</strong></p></div></div><div class="prosemirror-editor" data-prose-index="41"><div class="ProseMirror"><p>Recovered next.</p></div></div></div>
    </div>`;
  decorate(block);

  assert.equal(block.querySelectorAll('.journal-hero-step-controls').length, 1);
  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 5);
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 12);
  assert.match(block.textContent, /Recovered dossier/);
});

test('evidence ledger keeps malformed method content visible without generating controls', async () => {
  const dom = new JSDOM(`
    <div class="journal-hero evidence-ledger">
      <div><div><h1 data-prose-index="0">Field journal</h1></div></div>
      <div>
        <div><p data-prose-index="1"><strong>Signal</strong><br>One</p></div>
        <div><p data-prose-index="2"><strong>Boundary</strong><br>Two</p></div>
        <div><p data-prose-index="3"><strong>Evidence</strong><br>Three</p></div>
        <div><p data-prose-index="4"><strong>Next</strong><br>Four</p></div>
      </div>
    </div>`);
  const block = dom.window.document.querySelector('.journal-hero');
  const cells = [...block.lastElementChild.children];
  const decorate = await loadDecorator('blocks/journal-hero/journal-hero.js', dom.window);

  decorate(block);

  assert.equal(block.querySelectorAll('.journal-hero-step-control').length, 0);
  assert.equal(block.querySelectorAll('.journal-hero-step').length, 4);
  cells.forEach((cell) => assert.equal(cell.hidden, false));
  assert.equal(block.querySelectorAll('[data-prose-index]').length, 5);
});
