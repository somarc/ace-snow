/**
 * Keeps authored page metadata available to Canvas without rendering it as page content.
 * @param {Element} block The metadata block
 */
export default function decorate(block) {
  block.hidden = true;
}
