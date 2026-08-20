/**
 * Applies stable role classes to the journal hero authoring contract.
 * Authored prose and images remain in their original cells.
 * @param {HTMLElement} block The journal hero block
 */
export default function decorate(block) {
  const rowClasses = ['journal-hero-stage', 'journal-hero-facts'];
  const cellClasses = [
    'journal-hero-media',
    'journal-hero-copy',
    'journal-hero-extra',
    'journal-hero-fact',
  ];

  [...block.children].forEach((row) => {
    row.classList.remove(...rowClasses);
    [...row.children].forEach((cell) => cell.classList.remove(...cellClasses));
  });

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
    const section = block.closest('.section');
    if (image && section && !section.previousElementSibling) {
      image.loading = 'eager';
      image.fetchPriority = 'high';
    }
  } else {
    block.classList.remove('journal-hero-has-media');
  }

  factRows.forEach((row) => {
    row.classList.add('journal-hero-facts');
    [...row.children].forEach((cell) => cell.classList.add('journal-hero-fact'));
  });

  block.dataset.decorated = 'true';
}
