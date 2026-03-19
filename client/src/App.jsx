import { useEffect, useMemo, useState } from "react";
import { fetchDashboard } from "./api";
import AlertBanner from "./components/AlertBanner";
import DecisionHero from "./components/DecisionHero";
import ExecutionPanel from "./components/ExecutionPanel";
import MetricPanel from "./components/MetricPanel";
import ScoreBreakdown from "./components/ScoreBreakdown";
import SectorHeatmap from "./components/SectorHeatmap";
import TopTicker from "./components/TopTicker";

const REFRESH_MS = 45000;

function directionFromNumeric(value, flat = 0.1) {
  if (value > flat) return "up";
  if (value < -flat) return "down";
  return "flat";
}

function buildPanelRows(data) {
  const vol = data.panels.volatility;
  const trend = data.panels.trend;
  const breadth = data.panels.breadth;
  const mom = data.panels.momentum;
  const macro = data.panels.macro;

  const trendState = (above) => (above ? "healthy" : "risk-off");
  const totalSectors = mom.sectors.length || 12;
  const sectorsUp = mom.positiveSectors;
  const sectorsRatio = totalSectors ? sectorsUp / totalSectors : 0;
  const leader = mom.top3?.[0];
  const laggard = mom.bottom3?.[mom.bottom3.length - 1];
  const participationLabel =
    mom.pctNifty500HigherHighs >= 55
      ? "High / Broad"
      : mom.pctNifty500HigherHighs >= 35
        ? "Medium / Selective"
        : "Low / Narrow";

  return {
    volatility: [
      {
        label: "India VIX",
        value: vol.vixLevel.toFixed(2),
        direction: directionFromNumeric(-vol.vix5dSlope),
        state: vol.vixLevel < 15 ? "healthy" : vol.vixLevel > 18 ? "risk-off" : "watch"
      },
      {
        label: "Nifty PCR",
        value: vol.pcr.toFixed(2),
        direction: directionFromNumeric(vol.pcr - 1),
        state: vol.pcr >= 0.9 && vol.pcr <= 1.2 ? "healthy" : "watch"
      }
    ],
    trend: [
      {
        label: "Nifty vs 10 DMA",
        value: trend.niftyAbove10 ? "Above" : "Below",
        direction: trend.niftyAbove10 ? "up" : "down",
        state: trendState(trend.niftyAbove10)
      },
      {
        label: "Nifty vs 20 DMA",
        value: trend.niftyAbove20 ? "Above" : "Below",
        direction: trend.niftyAbove20 ? "up" : "down",
        state: trendState(trend.niftyAbove20)
      },
      {
        label: "Nifty vs 50 DMA",
        value: trend.niftyAbove50 ? "Above" : "Below",
        direction: trend.niftyAbove50 ? "up" : "down",
        state: trendState(trend.niftyAbove50)
      },
      {
        label: "Bank Nifty vs 50MA",
        value: trend.bankNiftyAbove50 ? "Above" : "Below",
        direction: trend.bankNiftyAbove50 ? "up" : "down",
        state: trend.bankNiftyAbove50 ? "healthy" : "risk-off"
      }
    ],
    breadth: [
      {
        label: "A/D Ratio",
        value: breadth.adRatio.toFixed(2),
        direction: directionFromNumeric(breadth.adRatio - 1, 0.05),
        state: breadth.adRatio >= 1 ? "healthy" : "risk-off"
      },
      {
        label: "% Stocks > 10 EMA",
        value: `${breadth.pctAbove10ema.toFixed(0)}%`,
        direction: directionFromNumeric(breadth.pctAbove10ema - 50, 3),
        state: breadth.pctAbove10ema > 50 ? "healthy" : "watch"
      },
      {
        label: "% Stocks > 20 EMA",
        value: `${breadth.pctAbove20ema.toFixed(0)}%`,
        direction: directionFromNumeric(breadth.pctAbove20ema - 50, 3),
        state: breadth.pctAbove20ema > 50 ? "healthy" : "watch"
      },
      {
        label: "% Stocks > 50 EMA",
        value: `${breadth.pctAbove50ema.toFixed(0)}%`,
        direction: directionFromNumeric(breadth.pctAbove50ema - 50, 3),
        state: breadth.pctAbove50ema > 50 ? "healthy" : "watch"
      }
    ],
    momentum: [
      {
        label: "Sectors +",
        value: `${sectorsUp}/${totalSectors}`,
        direction: directionFromNumeric(sectorsRatio - 0.5, 0.08),
        state: sectorsRatio >= 0.6 ? "healthy" : sectorsRatio >= 0.35 ? "watch" : "risk-off"
      },
      {
        label: "Leader",
        value: leader ? `${leader.label} ${leader.changePercent.toFixed(2)}%` : "N/A",
        direction: leader ? directionFromNumeric(leader.changePercent, 0.05) : "flat",
        state: leader && leader.changePercent > 0 ? "healthy" : "watch"
      },
      {
        label: "Laggard",
        value: laggard ? `${laggard.label} ${laggard.changePercent.toFixed(2)}%` : "N/A",
        direction: laggard ? directionFromNumeric(laggard.changePercent, 0.05) : "flat",
        state: laggard && laggard.changePercent < 0 ? "risk-off" : "watch"
      },
      {
        label: "Participation",
        value: participationLabel,
        direction: directionFromNumeric(mom.pctNifty500HigherHighs - 40, 2),
        state:
          mom.pctNifty500HigherHighs >= 55
            ? "healthy"
            : mom.pctNifty500HigherHighs >= 35
              ? "watch"
              : "risk-off"
      }
    ],
    macro: [
      {
        label: "USD/INR Trend",
        value: macro.usdInrTrend.toUpperCase(),
        direction: macro.usdInrTrend,
        state: macro.usdInrTrend === "up" ? "risk-off" : "healthy"
      },
      {
        label: "FII Net Flow",
        value: macro.fiiNetCr === null ? "N/A" : `${macro.fiiNetCr.toFixed(0)} Cr`,
        direction: macro.fiiNetCr === null ? "flat" : directionFromNumeric(macro.fiiNetCr, 20),
        state: macro.fiiNetCr !== null && macro.fiiNetCr < 0 ? "risk-off" : "healthy"
      },
      {
        label: "RBI Stance",
        value: macro.rbiStance.toUpperCase(),
        direction: macro.rbiStance === "hawkish" ? "down" : macro.rbiStance === "dovish" ? "up" : "flat",
        state: macro.rbiStance === "hawkish" ? "risk-off" : "watch"
      }
    ]
  };
}

export default function App() {
  const [mode, setMode] = useState("swing");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const load = async (force = false) => {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchDashboard(mode, force);
      setData(payload);
      setSecondsAgo(0);
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refreshTimer = setInterval(() => load(false), REFRESH_MS);
    const secondsTimer = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(secondsTimer);
    };
  }, [mode]);

  const panelRows = useMemo(() => (data ? buildPanelRows(data) : null), [data]);
  const qualityItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      { label: "Volatility", value: data.categoryScores.volatility },
      { label: "Trend", value: data.categoryScores.trend },
      { label: "Breadth", value: data.categoryScores.breadth },
      { label: "Momentum", value: data.categoryScores.momentum },
      { label: "Macro", value: data.categoryScores.macroLiquidity }
    ];
  }, [data]);

  return (
    <div className="terminal-shell">
      <TopTicker
        ticker={
          data?.ticker || {
            nifty50: {},
            bankNifty: {},
            indiaVix: {},
            usdInr: {},
            gsec10y: {},
            sectors: []
          }
        }
        updating={loading}
        secondsAgo={secondsAgo}
        onRefresh={() => load(true)}
      />

      <main className="dashboard-grid">
        <section className="title-row">
          <h1>Should I Be Trading?</h1>
          <div className="mode-toggle">
            <button className={mode === "swing" ? "active" : ""} type="button" onClick={() => setMode("swing")}>Swing Mode</button>
            <button className={mode === "positional" ? "active" : ""} type="button" onClick={() => setMode("positional")}>Positional Mode</button>
          </div>
          <div className="asof">IST {data?.meta?.asOfIST || "--"}</div>
        </section>

        {error && <div className="error-box">{error}</div>}
        {data?.alerts && <AlertBanner alerts={data.alerts} />}

        {data && !loading && (
          <section className="panel quality-strip">
            <div className={`quality-item decision ${data.decision.value.toLowerCase()}`}>
              <span>Decision</span>
              <strong>{data.decision.value}</strong>
              <small>{data.meta.modeLabel}</small>
            </div>
            <div className="quality-item total">
              <span>Total Score</span>
              <strong>{data.marketQualityScore.toFixed(1)} / 100</strong>
              <small>{data.decision.action}</small>
            </div>
            {qualityItems.map((item) => (
              <div className="quality-item metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value.toFixed(0)}</strong>
                <div className="mini-bar">
                  <div className="mini-fill" style={{ width: `${Math.max(2, item.value)}%` }} />
                </div>
              </div>
            ))}
          </section>
        )}

        {!data || loading ? (
          <section className="loading-grid">
            <div className="skeleton lg" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </section>
        ) : (
          <>
            <DecisionHero
              decision={data.decision.value}
              score={data.marketQualityScore}
              action={data.decision.action}
              modeLabel={data.meta.modeLabel}
              marketOpen={data.meta.marketOpen}
              executionWindowScore={data.executionWindowScore}
            />

            <section className="panel summary-panel">
              <h3>Terminal Analysis</h3>
              <p>{data.summary}</p>
            </section>

            <MetricPanel title="Volatility" rows={panelRows.volatility} />
            <MetricPanel title="Trend" rows={panelRows.trend} />
            <MetricPanel title="Breadth" rows={panelRows.breadth} />
            <MetricPanel title="Momentum" rows={panelRows.momentum} />
            <MetricPanel title="Macro / Liquidity" rows={panelRows.macro} />

            <SectorHeatmap sectors={data.panels.momentum.sectors} />
            <ScoreBreakdown categoryScores={data.categoryScores} weights={data.weights} />
            <ExecutionPanel score={data.executionWindowScore} executionWindow={data.executionWindow} />
          </>
        )}
      </main>
    </div>
  );
}
