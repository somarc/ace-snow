/* eslint-env node */
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');
const { createContext, SourceTextModule } = require('node:vm');

/**
 * Loads one dependency-free EDS decorator as an ES module for DOM contract tests.
 * @param {string} relativePath Repository-relative module path
 * @param {Window} window JSDOM window
 * @returns {Promise<Function>} The module's default export
 */
async function loadDecorator(relativePath, window) {
  const filename = resolve(relativePath);
  const source = await readFile(filename, 'utf8');
  const context = createContext({
    console,
    document: window.document,
    Element: window.Element,
    HTMLElement: window.HTMLElement,
    window,
  });
  const module = new SourceTextModule(source, { context, identifier: filename });
  await module.link(() => {
    throw new Error(`${relativePath} unexpectedly imports another module`);
  });
  await module.evaluate();
  return module.namespace.default;
}

module.exports = loadDecorator;
