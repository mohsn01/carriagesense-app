import { fmtClock } from '../lib/geo';
import Icon from './Icon';
import LineBadge from './LineBadge';

// Turn-by-turn instructions. With `currentSeg` the list doubles as live progress:
// finished steps get a tick, the current one is highlighted.
export default function StepList({ steps, currentSeg = null }) {
  return (
    <ol className="steps">
      {steps.map((step, i) => {
        const last = Math.max(...step.segs);
        const first = Math.min(...step.segs);
        const state =
          currentSeg == null ? 'todo' : currentSeg > last ? 'done' : currentSeg >= first ? 'current' : 'todo';
        return (
          <li key={step.key} className={`step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="step-rail">
              <span className="step-mark">
                {state === 'done' ? (
                  <Icon name="check" size={14} strokeWidth={3} />
                ) : step.lineId ? (
                  <LineBadge lineId={step.lineId} size="sm" />
                ) : (
                  <Icon name={step.icon} size={16} />
                )}
              </span>
              {i < steps.length - 1 && <span className="step-line" />}
            </span>
            <span className="step-body">
              <span className="step-top">
                <strong>{step.title}</strong>
                <time>{fmtClock(step.startMs)}</time>
              </span>
              <span className="step-sub">{step.sub}</span>
              {step.extra && <span className="step-extra">{step.extra}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
