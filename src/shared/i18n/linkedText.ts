/**
 * Messages can mark tappable phrases with square brackets, e.g. "Use [monthly goals] to repeat
 * tasks". The translator decides where each phrase sits in the sentence, so word order never
 * has to be assumed in code. Pure, so any layer may import it.
 */
export interface LinkedSegment {
  text: string;
  /** True for a phrase that was inside brackets. */
  link: boolean;
}

/** Splits a message into plain and linked segments, in reading order. Unmatched `[` stays text. */
export function parseLinkedText(message: string): LinkedSegment[] {
  const segments: LinkedSegment[] = [];
  let rest = message;
  while (rest.length > 0) {
    const open = rest.indexOf('[');
    const close = open < 0 ? -1 : rest.indexOf(']', open + 1);
    if (open < 0 || close < 0) {
      segments.push({ text: rest, link: false });
      break;
    }
    if (open > 0) segments.push({ text: rest.slice(0, open), link: false });
    segments.push({ text: rest.slice(open + 1, close), link: true });
    rest = rest.slice(close + 1);
  }
  return segments;
}

/** The message as plain text, brackets removed (for accessibility labels). */
export function stripLinkMarkers(message: string): string {
  return parseLinkedText(message)
    .map(segment => segment.text)
    .join('');
}

export interface LinkedText {
  before: string;
  link: string;
  after: string;
}

/** For a message with exactly one linked phrase: the text before it, the phrase, and the text after. */
export function splitLinkedText(message: string): LinkedText {
  const segments = parseLinkedText(message);
  const index = segments.findIndex(segment => segment.link);
  if (index < 0) return { before: message, link: '', after: '' };
  return {
    before: segments
      .slice(0, index)
      .map(segment => segment.text)
      .join(''),
    link: segments[index].text,
    after: segments
      .slice(index + 1)
      .map(segment => segment.text)
      .join(''),
  };
}
