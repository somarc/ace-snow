import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads and decorates the footer fragment.
 * @param {Element} block The footer block
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);
  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-shell';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
