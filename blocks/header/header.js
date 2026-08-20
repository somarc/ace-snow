import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const desktop = window.matchMedia('(min-width: 900px)');
let removeDesktopListener = () => {};

/**
 * Sets the mobile navigation state.
 * @param {HTMLElement} nav The primary navigation
 * @param {HTMLButtonElement} button The menu button
 * @param {boolean} expanded Whether the mobile menu is open
 */
function setExpanded(nav, button, expanded) {
  nav.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  document.body.classList.toggle('nav-open', expanded);
}

/**
 * Loads and decorates the shared navigation fragment.
 * @param {Element} block The header block
 */
export default async function decorate(block) {
  const headerMeta = getMetadata('nav');
  const navPath = headerMeta ? new URL(headerMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);
  if (!fragment) return;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Primary');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  ['brand', 'sections', 'tools'].forEach((name, index) => {
    const section = nav.children[index];
    if (section) section.classList.add(`nav-${name}`);
  });

  const sections = nav.querySelector('.nav-sections');
  if (sections) sections.id = 'primary-navigation';

  const menu = document.createElement('button');
  menu.className = 'nav-menu';
  menu.type = 'button';
  menu.setAttribute('aria-controls', sections?.id || 'nav');
  menu.innerHTML = '<span aria-hidden="true"></span>';
  menu.addEventListener('click', () => {
    setExpanded(nav, menu, nav.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      setExpanded(nav, menu, false);
      menu.focus();
    }
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setExpanded(nav, menu, false);
  });

  nav.addEventListener('focusout', (event) => {
    if (!desktop.matches && !nav.contains(event.relatedTarget)) setExpanded(nav, menu, false);
  });

  removeDesktopListener();
  const handleDesktopChange = () => setExpanded(nav, menu, false);
  desktop.addEventListener('change', handleDesktopChange);
  removeDesktopListener = () => desktop.removeEventListener('change', handleDesktopChange);

  nav.prepend(menu);
  setExpanded(nav, menu, false);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-shell';
  wrapper.append(nav);
  block.append(wrapper);
}
