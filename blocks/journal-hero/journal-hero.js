const ROW_CLASSES = [
  'journal-hero-stage',
  'journal-hero-ledger-stage',
  'journal-hero-facts',
  'journal-hero-method',
  'journal-hero-extra-row',
];

const CELL_CLASSES = [
  'journal-hero-media',
  'journal-hero-copy',
  'journal-hero-claim',
  'journal-hero-dossier',
  'journal-hero-extra',
  'journal-hero-fact',
  'journal-hero-step',
  'is-active',
];

const METHOD_STEPS = ['signal', 'boundary', 'evidence', 'decision', 'next'];
const methodObservers = new WeakMap();

const normalizeLabel = (value) => value.trim().toLowerCase().replace(/[^a-z]+/g, ' ').trim();

const prioritizeImage = (block, image) => {
  const section = block.closest('.section');
  if (image && section && !section.previousElementSibling) {
    image.loading = 'eager';
    image.fetchPriority = 'high';
  }
};

const resetRoles = (block) => {
  methodObservers.get(block)?.disconnect();
  methodObservers.delete(block);
  block.querySelector(':scope > .journal-hero-step-controls')?.remove();

  [...block.children].forEach((row) => {
    row.classList.remove(...ROW_CLASSES);
    if (row.getAttribute('role') === 'list') row.removeAttribute('role');
    [...row.children].forEach((cell) => {
      cell.classList.remove(...CELL_CLASSES);
      if (cell.getAttribute('role') === 'listitem') cell.removeAttribute('role');
    });
  });
};

const getMethodState = (method) => {
  const steps = [...method.children];
  const labels = steps.map((step) => normalizeLabel(
    step.querySelector('strong, h2, h3, h4')?.textContent || '',
  ));
  const valid = steps.length === METHOD_STEPS.length
    && labels.every((label, index) => label === METHOD_STEPS[index]);

  return { steps, labels, valid };
};

const renderMethodControls = (block, method, activeIndex = 0) => {
  block.querySelector(':scope > .journal-hero-step-controls')?.remove();
  const { steps, labels, valid } = getMethodState(method);
  steps.forEach((step) => step.classList.remove('is-active'));
  if (!valid) return;

  const controls = block.ownerDocument.createElement('div');
  controls.className = 'journal-hero-step-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Explore the current evidence path');

  const status = block.ownerDocument.createElement('p');
  status.className = 'journal-hero-step-status';
  status.setAttribute('aria-live', 'polite');

  const setActiveStep = (nextIndex) => {
    steps.forEach((step, index) => step.classList.toggle('is-active', index === nextIndex));
    [...controls.querySelectorAll('button')].forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === nextIndex));
    });
    status.textContent = steps[nextIndex].textContent.trim().replace(/\s+/g, ' ');
  };

  labels.forEach((label, index) => {
    const button = block.ownerDocument.createElement('button');
    button.type = 'button';
    button.className = 'journal-hero-step-control';
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => setActiveStep(index));
    controls.append(button);
  });

  controls.append(status);
  block.insertBefore(controls, method);
  setActiveStep(Math.min(activeIndex, steps.length - 1));
};

const observeMethod = (block, method) => {
  const Observer = block.ownerDocument.defaultView?.MutationObserver;
  if (!Observer) return;

  const observer = new Observer(() => {
    const controls = block.querySelector(':scope > .journal-hero-step-controls');
    const activeIndex = Math.max(0, [...(controls?.querySelectorAll('button') || [])]
      .findIndex((button) => button.getAttribute('aria-pressed') === 'true'));
    renderMethodControls(block, method, activeIndex);
  });
  observer.observe(method, { childList: true, characterData: true, subtree: true });
  methodObservers.set(block, observer);
};

const decorateDefaultHero = (block) => {
  const [stage, ...factRows] = [...block.children];

  if (stage) {
    stage.classList.add('journal-hero-stage');
    const cells = [...stage.children];
    const mediaIndex = cells.findIndex((cell) => cell.querySelector('picture, img'));
    const copyIndex = mediaIndex === 0 ? 1 : 0;

    block.classList.toggle('journal-hero-has-media', mediaIndex >= 0);

    cells.forEach((cell, index) => {
      if (index === mediaIndex) cell.classList.add('journal-hero-media');
      else if (index === copyIndex) cell.classList.add('journal-hero-copy');
      else cell.classList.add('journal-hero-extra');
    });

    const image = mediaIndex >= 0 ? cells[mediaIndex].querySelector('img') : null;
    prioritizeImage(block, image);
  } else {
    block.classList.remove('journal-hero-has-media');
  }

  factRows.forEach((row) => {
    row.classList.add('journal-hero-facts');
    [...row.children].forEach((cell) => cell.classList.add('journal-hero-fact'));
  });
};

const decorateEvidenceLedger = (block) => {
  const [stage, method, ...extraRows] = [...block.children];
  const stageCells = stage ? [...stage.children] : [];
  const claim = stageCells.find((cell) => cell.querySelector('h1')) || stageCells[0];
  const dossier = stageCells.find((cell) => cell !== claim);

  if (stage) stage.classList.add('journal-hero-stage', 'journal-hero-ledger-stage');
  if (claim) claim.classList.add('journal-hero-copy', 'journal-hero-claim');
  if (dossier) dossier.classList.add('journal-hero-dossier');
  stageCells
    .filter((cell) => cell !== claim && cell !== dossier)
    .forEach((cell) => cell.classList.add('journal-hero-extra'));

  const image = dossier?.querySelector('img') || null;
  block.classList.toggle('journal-hero-has-media', Boolean(image));
  prioritizeImage(block, image);

  if (method) {
    method.classList.add('journal-hero-method');
    method.setAttribute('role', 'list');
    const steps = [...method.children];
    steps.forEach((step) => {
      step.classList.add('journal-hero-step');
      step.setAttribute('role', 'listitem');
    });
    renderMethodControls(block, method);
    observeMethod(block, method);
  }

  extraRows.forEach((row) => {
    row.classList.add('journal-hero-extra-row');
    [...row.children].forEach((cell) => cell.classList.add('journal-hero-extra'));
  });
};

/**
 * Applies stable role classes to the journal hero authoring contract.
 * Authored prose and images remain in their original cells.
 * @param {HTMLElement} block The journal hero block
 */
export default function decorate(block) {
  resetRoles(block);

  if (block.classList.contains('evidence-ledger')) decorateEvidenceLedger(block);
  else decorateDefaultHero(block);

  block.dataset.decorated = 'true';
}
