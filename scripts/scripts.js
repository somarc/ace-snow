import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  readBlockConfig,
  toClassName,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

let delayedTimer;

/**
 * Applies authored section metadata before the generic section wrapper pass.
 * Section composition owns paint, width, and exterior spacing.
 * @param {HTMLElement} main The authored main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    const metadata = section.querySelector(':scope > .section-metadata');
    if (metadata) {
      const config = readBlockConfig(metadata);
      const styles = Array.isArray(config.style) ? config.style.join(' ') : config.style;
      String(styles || '').split(/[\s,]+/).filter(Boolean).forEach((style) => {
        section.classList.add(toClassName(style));
      });
      metadata.remove();
    }
  });
}

/**
 * Returns whether an authored node is carrying Canvas identity.
 * Published pages do not contain these markers; mounted editor content does.
 * @param {Element} element The node being considered for structural decoration
 * @returns {boolean} Whether structural replacement must be avoided
 */
function hasCanvasIdentity(element) {
  return Boolean(element.closest(
    '[data-block-index], [data-prose-index], [data-image-index], .prosemirror-editor',
  ));
}

/**
 * Turns published `/widgets/...` references into widget blocks.
 * Mounted Canvas fields stay canonical and are never replaced.
 * @param {HTMLElement} main The authored main element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget') || hasCanvasIdentity(link)) return;

    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const paragraph = link.closest('p');
    if (
      paragraph
      && paragraph.querySelectorAll('a').length === 1
      && paragraph.querySelector('a') === link
      && paragraph.textContent.trim() === link.textContent.trim()
    ) {
      paragraph.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds synthetic blocks on published pages while leaving Canvas fields intact.
 * @param {HTMLElement} main The authored main element
 */
function buildAutoBlocks(main) {
  try {
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')]
      .filter((link) => !link.closest('.fragment') && !hasCanvasIdentity(link));
    if (fragments.length) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const content = await loadFragment(pathname);
            if (content && fragment.parentElement) {
              fragment.parentElement.replaceWith(...content.children);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links in published default content as buttons.
 * Blocks own their links, and mounted Canvas fields retain their authored DOM.
 * @param {HTMLElement} main The authored main element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((link) => {
    if (link.closest('.block') || hasCanvasIdentity(link)) return;

    link.title = link.title || link.textContent;
    const paragraph = link.closest('p');
    const text = link.textContent.trim();
    if (link.querySelector('img') || paragraph.textContent.trim() !== text) return;

    try {
      if (new URL(link.href).href === new URL(text, window.location).href) return;
    } catch (e) {
      // An authored relative or malformed URL can still be rendered as a link.
    }

    const strong = link.closest('strong');
    const emphasis = link.closest('em');
    if (!strong && !emphasis) return;

    paragraph.className = 'button-wrapper';
    link.className = 'button';
    if (strong && emphasis) {
      link.classList.add('accent');
      const outer = strong.contains(emphasis) ? strong : emphasis;
      outer.replaceWith(link);
    } else if (strong) {
      link.classList.add('primary');
      strong.replaceWith(link);
    } else {
      link.classList.add('secondary');
      emphasis.replaceWith(link);
    }
  });
}

/**
 * Adds one keyboard skip link without touching authored content.
 * @param {Document} doc The page document
 */
function ensureSkipLink(doc) {
  const main = doc.querySelector('main');
  if (!main) return;

  main.id ||= 'main-content';
  if (doc.querySelector('.skip-link')) return;

  const link = doc.createElement('a');
  link.className = 'skip-link';
  link.href = '#main-content';
  link.textContent = 'Skip to content';
  doc.body.prepend(link);
}

/**
 * Loads fonts.css and records that the font files have been requested.
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

/**
 * Decorates the authored main content without rebuilding authored fields.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  decorateSectionMetadata(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to reach LCP.
 * @param {Document} doc The page document
 */
async function loadEager(doc) {
  doc.documentElement.lang = 'en';
  ensureSkipLink(doc);
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    doc.body.classList.add('appear');
    const firstSection = main.querySelector('.section');
    if (firstSection) await loadSection(firstSection, waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) loadFonts();
  } catch (e) {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

/**
 * Loads below-LCP content and the shared page shell.
 * @param {Document} doc The page document
 */
async function loadLazy(doc) {
  const header = doc.querySelector('header');
  if (header && !header.querySelector('.header')) loadHeader(header);

  const main = doc.querySelector('main');
  if (main) await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  const footer = doc.querySelector('footer');
  if (footer && !footer.querySelector('.footer')) loadFooter(footer);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads work that must not compete with the visitor experience.
 * Repeated Canvas body refreshes replace the pending timer instead of stacking it.
 */
function loadDelayed() {
  window.clearTimeout(delayedTimer);
  delayedTimer = window.setTimeout(() => import('./delayed.js'), 3000);
}

/**
 * Loads the page. This named function remains repeatable for Canvas Quick Edit.
 * @param {Document} doc The current document
 */
export async function loadPage(doc = document) {
  await loadEager(doc);
  await loadLazy(doc);
  loadDelayed();
}

loadPage();

if (new URL(window.location.href).searchParams.has('dapreview')) {
  // eslint-disable-next-line import/no-unresolved
  import('https://da.live/scripts/dapreview.js')
    .then(({ default: daPreview }) => daPreview(loadPage));
}
