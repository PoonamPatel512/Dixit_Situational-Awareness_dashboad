function scoreState(score) {
  if (score >= 75) return "healthy";
  if (score >= 55) return "watch";
  return "risk-off";
}

const FALLBACK_CHECKS = [
  { key: "breakouts", label: "Breakouts working?", verdict: "No", cue: "Failing", state: "risk-off" },
  { key: "leaders", label: "Leaders holding?", verdict: "No", cue: "Fading", state: "risk-off" },
  { key: "pullbacks", label: "Pullbacks bought?", verdict: "Yes", cue: "Support", state: "healthy" },
  { key: "followThrough", label: "Follow-through?", verdict: "Weak", cue: "Low conviction", state: "watch" }
];

export default function ExecutionPanel({ score, executionWindow }) {
  const resolvedScore = Number.isFinite(score) ? score : executionWindow?.score ?? 0;
  const state = scoreState(resolvedScore);
  const checks = executionWindow?.checks?.length ? executionWindow.checks : FALLBACK_CHECKS;

  return (
    <section className="panel execution-panel">
      <header className="exec-header-row">
        <h3>Execution Window</h3>
        <strong className="exec-score">{Math.round(resolvedScore)}</strong>
      </header>

      <div className="exec-header-rule" />

      <div className={`exec-state ${state}`}>{(executionWindow?.conviction || state).toUpperCase()}</div>

      <div className="exec-checklist">
        {checks.map((item) => (
          <div className="exec-check-row" key={item.key || item.label}>
            <span className={`dot ${item.state || "watch"}`} aria-hidden="true" />
            <span className="check-label">{item.label}</span>
            <span className={`check-verdict ${item.state || "watch"}`}>{item.verdict}</span>
            <span className={`check-cue ${item.state || "watch"}`}>{item.cue}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
