import React from 'react';

const regxSentence = /(\p{Terminal_Punctuation})/gu;
const shortSentenceLength = 5;

interface SoftWrapProps {
  text: string;
}

/**
 * Soft wrap every sentence so it wraps at the period and not in the middle.
 * @param props Sentences separated by punctuation such as ".!?:;" and others used by foreign languages
 */
export function SoftWrap(props: SoftWrapProps): React.ReactNode {
  if (!props) return null;
  const { text } = props;
  if (!text) return null;

  const chunks = text.split(regxSentence);
  chunks.push(''); // balance out the empty text element after ending punctuation

  let sentence = '';
  const lines = [];
  for (let ix = 0; ix < chunks.length; ix += 2) {
    sentence += chunks[ix] + chunks[ix + 1];
    if (sentence.length > shortSentenceLength) {
      lines.push(sentence);
      sentence = '';
    }
  }

  // the last sentence goes on a line regardless of length
  if (sentence !== '') {
    lines.push(sentence);
  }

  return lines.length === 1
    ? lines[0]
    : lines.map((line, ix) => (
        <span
          key={`${ix}_SoftWrap`}
          style={{ display: 'inline-block', margin: 0, padding: 0 }}
          data-testid="span"
        >
          {line}&nbsp;
        </span>
      ));
}
