function prettyLabel(key) {
  if (key === "macroLiquidity") return "Macro/Liquidity";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

const ORDERED_KEYS = ["volatility", "momentum", "trend", "breadth", "macroLiquidity"];

function scoreTone(score) {
  if (score >= 75) return "good";
  if (score >= 55) return "watch";
  return "risk";
}

export default function ScoreBreakdown({ categoryScores, weights, totalScore, decision }) {
  const rows = ORDERED_KEYS.filter((key) => Number.isFinite(categoryScores?.[key])).map((key) => ({
    key,
    label: prettyLabel(key),
    score: Number(categoryScores[key]),
    weight: Number(weights?.[key] || 0)
  }));

  const resolvedScore = Number.isFinite(totalScore)
    ? totalScore
    : rows.reduce((acc, row) => acc + row.score * (row.weight / 100), 0);

  return (
    <section className="panel score-panel">
      <h3>Scoring Weights</h3>
      <div className="score-list">
        {rows.map((row) => {
          const tone = scoreTone(row.score);
          return (
            <div className="score-row" key={row.key}>
              <span className="score-label">{row.label}</span>
              <div className="score-bar-track">
                <div className={`score-bar ${tone}`} style={{ width: `${Math.max(4, row.score)}%` }} />
              </div>
              <strong className={`score-value ${tone}`}>{Math.round(row.score)}</strong>
              <span className="score-weight">+{row.weight}%</span>
            </div>
          );
        })}
      </div>

      <div className="score-total-row">
        <span>Total Score</span>
        <strong>{Math.round(resolvedScore)}/100</strong>
      </div>

      <div className="score-legend">
        <div className="legend-row good"><span className="dot good" />80-100: YES (press risk)</div>
        <div className="legend-row watch"><span className="dot watch" />60-79: CAUTION (selective)</div>
        <div className="legend-row risk"><span className="dot risk" />&lt;60: NO (preserve capital)</div>
      </div>

      <div className="score-decision">Current: {decision || (resolvedScore >= 80 ? "YES" : resolvedScore >= 60 ? "CAUTION" : "NO")}</div>
    </section>
  );
}
