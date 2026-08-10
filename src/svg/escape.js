/**
 * Escapes XML special characters for safe SVG rendering.
 * @param {string|any} str
 * @returns {string}
 */
export function escapeXml(str) {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
