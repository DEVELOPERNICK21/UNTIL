import { useEffect, useState } from 'react';
import { buildPanelModel } from '@until/core/time/panelModel';
import { getProgressColor } from '@until/theme/progressColor';
import { loadLocalState, panelProfile } from './localState';
import { pushExtra } from './extra';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function App() {
  const now = useNow();
  const local = loadLocalState();
  const model = buildPanelModel(panelProfile(local), now);

  useEffect(() => {
    void pushExtra(model).catch(() => {});
  }, [model.extraText, model.extraProgress]);

  return (
    <main className="panel">
      <h1>UNTIL</h1>
      <Row
        title="Today"
        left={model.day.leftStr}
        passed={model.day.passedStr}
        leftPct={model.day.leftPct}
        progress={model.day.progress}
      />
      <Row
        title="Month"
        left={`${model.month.leftDays} days`}
        passed={`${model.month.passedDays} days`}
        leftPct={model.month.leftPct}
        progress={model.month.passedPct / 100}
      />
      <Row
        title="Year"
        left={`${model.year.leftDays} days`}
        passed={`${model.year.passedDays} days`}
        leftPct={model.year.leftPct}
        progress={model.year.passedPct / 100}
      />
      {model.life ? (
        <Row
          title="Life"
          left={`${model.life.leftDays.toLocaleString()} days`}
          passed={`${model.life.passedDays.toLocaleString()} days`}
          leftPct={model.life.leftPct}
          progress={model.life.passedPct / 100}
        />
      ) : (
        <div className="row">
          <span className="row-title">Life</span>
          <span className="row-left muted">—</span>
        </div>
      )}
    </main>
  );
}

function Row(props: {
  title: string;
  left: string;
  passed: string;
  leftPct: number;
  progress: number;
}) {
  return (
    <div className="row">
      <span className="row-title">{props.title}</span>
      <span className="row-left" style={{ color: getProgressColor(props.progress) }}>
        {props.left}
      </span>
      <span className="row-sub">
        {props.passed} passed · {props.leftPct}% left
      </span>
    </div>
  );
}
