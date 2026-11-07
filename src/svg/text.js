/**
 * SVG Text Measurement, Fitting, and Wrapping Utilities.
 * Uses a calibrated per-character width table for sans-serif system fonts.
 */

// Relative character width factors (relative to fontPx = 1.0)
const CHAR_WIDTHS = {
  // Ultra-narrow
  'i': 0.28, 'l': 0.28, 'I': 0.32, 'j': 0.32, 't': 0.35, 'r': 0.38, 'f': 0.35,
  '.': 0.28, ',': 0.28, ':': 0.28, ';': 0.28, '!': 0.32, '|': 0.28, '\'': 0.24,
  '`': 0.32, '-': 0.36, ' ': 0.28, '/': 0.35, '\\': 0.35, '(': 0.35, ')': 0.35,
  '[': 0.35, ']': 0.35, '{': 0.38, '}': 0.38, '"': 0.40, '^': 0.45, '*': 0.45,
  // Wide characters
  'm': 0.85, 'w': 0.78, 'M': 0.88, 'W': 0.92, '@': 0.95, '%': 0.82, '&': 0.75,
  'Q': 0.75, 'O': 0.75, 'C': 0.72, 'D': 0.74, 'G': 0.75, 'H': 0.74, 'U': 0.74,
  // Medium uppercase
  'A': 0.68, 'B': 0.68, 'E': 0.65, 'F': 0.62, 'K': 0.68, 'N': 0.72, 'P': 0.65,
  'R': 0.68, 'S': 0.65, 'T': 0.62, 'V': 0.68, 'X': 0.68, 'Y': 0.68, 'Z': 0.65,
  // Standard lowercase
  'a': 0.55, 'b': 0.58, 'c': 0.52, 'd': 0.58, 'e': 0.54, 'g': 0.58, 'h': 0.58,
  'k': 0.52, 'n': 0.58, 'o': 0.58, 'p': 0.58, 'q': 0.58, 's': 0.50, 'u': 0.58,
  'v': 0.52, 'x': 0.52, 'y': 0.54, 'z': 0.50,
  // Digits
  '0': 0.58, '1': 0.45, '2': 0.58, '3': 0.58, '4': 0.58,
  '5': 0.58, '6': 0.58, '7': 0.58, '8': 0.58, '9': 0.58,
  // Default fallback for other characters (including emoji / symbols)
  _default: 0.55,
  _cjk: 1.0,
};

/**
 * Calculates estimated rendered width of text in pixels.
 * @param {string} text
 * @param {number} fontPx
 * @returns {number} Width in pixels
 */
export function measureText(text, fontPx = 12) {
  if (!text) return 0;
  let totalFactor = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = text.charCodeAt(i);
    // CJK characters or wide Unicode symbols
    if (code >= 0x4e00 && code <= 0x9fff) {
      totalFactor += CHAR_WIDTHS._cjk;
    } else {
      totalFactor += CHAR_WIDTHS[char] !== undefined ? CHAR_WIDTHS[char] : CHAR_WIDTHS._default;
    }
  }
  return totalFactor * fontPx;
}

/**
 * Fits text within a given maximum pixel width, truncating with an ellipsis if needed.
 * @param {string} text - Raw text to fit (not XML-escaped yet)
 * @param {number} fontPx - Font size in pixels
 * @param {number} maxWidth - Maximum bounding width in pixels
 * @param {string} [ellipsis='...'] - Ellipsis string
 * @returns {string} Truncated string that fits within maxWidth
 */
export function fitText(text, fontPx, maxWidth, ellipsis = '...') {
  if (!text) return '';
  const initialWidth = measureText(text, fontPx);
  if (initialWidth <= maxWidth) return text;

  const ellipsisWidth = measureText(ellipsis, fontPx);
  const targetWidth = maxWidth - ellipsisWidth;
  if (targetWidth <= 0) return ellipsis;

  let low = 0;
  let high = text.length;
  let bestFit = '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const sub = text.slice(0, mid);
    const subWidth = measureText(sub, fontPx);

    if (subWidth <= targetWidth) {
      bestFit = sub;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return bestFit.trimEnd() + ellipsis;
}

/**
 * Wraps text into multiple lines of at most maxWidth pixels, up to maxLines.
 * If text exceeds maxLines, the final line is truncated with an ellipsis.
 * @param {string} text - Raw text to wrap (not XML-escaped yet)
 * @param {number} fontPx - Font size in pixels
 * @param {number} maxWidth - Max pixel width per line
 * @param {number} [maxLines=2] - Maximum number of lines allowed
 * @returns {string[]} Array of lines that fit within bounds
 */
export function wrapText(text, fontPx, maxWidth, maxLines = 2) {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = measureText(candidate, fontPx);

    if (width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (lines.length === maxLines - 1) {
        // This is the last allowed line, append remaining words and fitText
        const remaining = [word, ...words.slice(i + 1)].join(' ');
        lines.push(fitText(remaining, fontPx, maxWidth));
        currentLine = '';
        break;
      }
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(fitText(currentLine, fontPx, maxWidth));
  }

  return lines;
}
