const CELL_ROLES = [
  'journal-feed-date',
  'journal-feed-state',
  'journal-feed-story',
  'journal-feed-systems',
];

/**
 * Applies stable role classes to authored journal entry rows.
 * The decorator never replaces, clones, unwraps, or reorders authored fields.
 * @param {HTMLElement} block The journal feed block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('journal-feed-entry');
    row.setAttribute('role', 'article');

    [...row.children].forEach((cell, index) => {
      cell.classList.remove(...CELL_ROLES, 'journal-feed-extra');
      cell.classList.add(CELL_ROLES[index] || 'journal-feed-extra');
    });
  });

  block.dataset.decorated = 'true';
}
