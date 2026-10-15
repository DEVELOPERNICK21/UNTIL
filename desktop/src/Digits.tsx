import type { Part } from './periods';

const INLINE_UNITS = new Set(['h', 'm', 's']);

/**
 * The big number in the middle of the dial. A part that changes remounts, which plays a small
 * roll-in, so the seconds tick visibly and the hours stay still.
 */
export function Digits({ parts }: { parts: Part[] }) {
  if (parts.length === 1 && parts[0].unit === '') {
    return (
      <div className="digits digits-text">
        <span className="num">{parts[0].value}</span>
      </div>
    );
  }

  const inline = INLINE_UNITS.has(parts[0]?.unit ?? '');
  const main = inline ? parts.slice(0, 2) : parts.slice(0, 1);
  const rest = inline ? parts.slice(2) : [];

  return (
    <div className="digits">
      <div className="digits-main">
        {main.map(part => (
          <span className="digits-part" key={part.unit}>
            <span className="num" key={part.value}>
              {part.value}
            </span>
            {inline ? <span className="unit">{part.unit}</span> : null}
          </span>
        ))}
      </div>
      {inline ? null : <div className="digits-unit">{parts[0].unit}</div>}
      {rest.length ? (
        <div className="digits-sub">
          {rest.map(part => (
            <span className="digits-part" key={part.unit}>
              <span className="num" key={part.value}>
                {part.value}
              </span>
              <span className="unit">{part.unit}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
