export type BlockLanguage = 'css' | 'scss';

export interface Block {
  language: BlockLanguage;
  /** Offset of the tag (`css` or `scss`). */
  start: number;
  /** Offset just after the opening backtick. */
  contentStart: number;
  /** Offset of the closing backtick, or the end of the text if it's unclosed. */
  contentEnd: number;
}

// A bare tag, as in the grammar. In code, a tag right after a quote is in a
// string; in HTML that's where blocks are (`class="css`…`"`).
const CODE_TAG = /(?<![\w$.`'"])(s?css)\s*`/g;
const HTML_TAG = /(?<![\w$.`])(s?css)\s*`/g;

function closingBacktick(text: string, from: number): number {
  for (let i = from; i < text.length; i++) {
    if (text[i] === '\\') i++;
    else if (text[i] === '`') return i;
  }
  return -1;
}

/** The block whose content contains `offset` (inclusive at both ends). */
export function findBlockAt(text: string, offset: number, html = false): Block | undefined {
  const tag = new RegExp(html ? HTML_TAG : CODE_TAG);
  for (let m = tag.exec(text); m && m.index < offset; m = tag.exec(text)) {
    const contentStart = m.index + m[0].length;
    const close = closingBacktick(text, contentStart);
    const contentEnd = close === -1 ? text.length : close;
    if (offset >= contentStart && offset <= contentEnd) {
      return { language: m[1] as BlockLanguage, start: m.index, contentStart, contentEnd };
    }
    if (close === -1) return undefined;
    tag.lastIndex = close + 1;
  }
  return undefined;
}

const blank = (s: string) => s.replace(/[^\r\n]/g, ' ');

/**
 * A stylesheet with the same offsets and line breaks as `text`, holding only
 * the block as a rule: the tag becomes a selector and an opening brace, the
 * closing backtick a closing brace, and everything else spaces.
 */
export function blockStylesheet(text: string, block: Block): string {
  const tag = blank(text.slice(block.start, block.contentStart));
  const closed = block.contentEnd < text.length;
  return (
    blank(text.slice(0, block.start)) +
    'x' +
    tag.slice(1, -1) +
    '{' +
    text.slice(block.contentStart, block.contentEnd) +
    (closed ? '}' + blank(text.slice(block.contentEnd + 1)) : '')
  );
}
