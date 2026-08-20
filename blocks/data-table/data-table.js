/**
 * Builds a semantic table while moving every authored field intact.
 * The outer block and all Canvas prose identities remain canonical.
 * @param {HTMLElement} block The data table block
 */
export default function decorate(block) {
  if (block.querySelector(':scope > table.data-table-element')) return;

  const rows = [...block.children];
  if (!rows.length) {
    block.removeAttribute('tabindex');
    block.removeAttribute('role');
    block.removeAttribute('aria-label');
    block.dataset.decorated = 'true';
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table-element';
  const head = document.createElement('thead');
  const body = document.createElement('tbody');

  rows.forEach((row, rowIndex) => {
    const tableRow = document.createElement('tr');
    [...row.children].forEach((cell) => {
      const tableCell = document.createElement(rowIndex === 0 ? 'th' : 'td');
      if (rowIndex === 0) tableCell.scope = 'col';
      tableCell.append(...cell.childNodes);
      tableRow.append(tableCell);
    });
    (rowIndex === 0 ? head : body).append(tableRow);
  });

  table.append(head, body);
  block.replaceChildren(table);
  block.tabIndex = 0;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Scrollable data table');
  block.dataset.decorated = 'true';
}
