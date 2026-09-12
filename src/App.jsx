import React, { useMemo, useState } from "react";

const ASPECTS = [
  { name: "Salud", desc: "Hábitos, energía y vitalidad, cuidado preventivo, relación con el cuerpo." },
  { name: "Carrera", desc: "Satisfacción, desarrollo, condiciones y proyección profesional." },
  { name: "Finanzas", desc: "Control, seguridad, hábitos financieros y proyección económica." },
  { name: "Relaciones", desc: "Calidad de los vínculos, comunicación, límites, apoyo y reciprocidad." },
  { name: "Crecimiento", desc: "Autoconocimiento, aprendizaje, objetivos y coherencia personal." },
  { name: "Ocio", desc: "Tiempo disponible, disfrute, descanso y prioridad personal." },
  { name: "Entorno", desc: "Familia, hogar y contexto cotidiano: conexión, presencia y responsabilidades." },
  { name: "Emocional", desc: "Gestión emocional, estrés y carga mental, autoestima, calma." },
];

const PALETTE = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#10b981", "#06b6d4", "#6366f1"];

const RINGS = 10;
const VIEW = 120;
const CENTER = VIEW / 2;
const MAX_R = 44;

const colorFor = (i) => PALETTE[i % PALETTE.length];

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function sectorPath(aspectIndex, ring, total) {
  const rOuter = (ring / RINGS) * MAX_R;
  const rInner = ((ring - 1) / RINGS) * MAX_R;
  const start = (aspectIndex / total) * Math.PI * 2 - Math.PI / 2;
  const end = ((aspectIndex + 1) / total) * Math.PI * 2 - Math.PI / 2;
  const [x1, y1] = polar(CENTER, CENTER, rInner, start);
  const [x2, y2] = polar(CENTER, CENTER, rOuter, start);
  const [x3, y3] = polar(CENTER, CENTER, rOuter, end);
  const [x4, y4] = polar(CENTER, CENTER, rInner, end);
  return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;
}

function Wheel({ selfEval, resultAvg, activeIndex, onSelect }) {
  const total = ASPECTS.length;

  const sectors = useMemo(() => {
    const out = [];
    for (let ring = RINGS; ring >= 1; ring--) {
      for (let a = 0; a < total; a++) {
        out.push({ key: `${a}-${ring}`, a, ring, d: sectorPath(a, ring, total) });
      }
    }
    return out;
  }, [total]);

  const overlay = useMemo(() => {
    const pts = resultAvg.map((v, a) => {
      const r = (Math.max(0, Math.min(10, v)) / 10) * MAX_R;
      const angle = ((a + 0.5) / total) * Math.PI * 2 - Math.PI / 2;
      return polar(CENTER, CENTER, r, angle);
    });
    return {
      pts,
      d: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z",
    };
  }, [resultAvg, total]);

  const hasResults = resultAvg.some((v) => v > 0);

  return (
    <div className="wheel">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label="Rueda de la vida">
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="rgba(109,40,217,0)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.18)" />
          </radialGradient>
          <linearGradient id="overlayFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={MAX_R + 6} fill="url(#wheelGlow)" />

        <g className="wheel__sectors">
          {sectors.map(({ key, a, ring, d }) => {
            const filled = selfEval[a] >= ring;
            return (
              <path
                key={key}
                d={d}
                className={`wheel__sector${activeIndex === a ? " is-active" : ""}`}
                fill={filled ? colorFor(a) : "rgba(255,255,255,0.035)"}
                style={{ transitionDelay: `${ring * 12}ms` }}
                onClick={() => onSelect(a)}
              />
            );
          })}
        </g>

        {hasResults && (
          <g className="wheel__overlay">
            <path d={overlay.d} fill="url(#overlayFill)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
            {overlay.pts.map(([x, y], a) => (
              <circle key={a} cx={x} cy={y} r="1.4" fill={colorFor(a)} stroke="rgba(255,255,255,0.7)" strokeWidth="0.35" />
            ))}
          </g>
        )}

        {ASPECTS.map((aspect, a) => {
          const angle = ((a + 0.5) / total) * Math.PI * 2 - Math.PI / 2;
          const [lx, ly] = polar(CENTER, CENTER, MAX_R + 10, angle);
          return (
            <text
              key={aspect.name}
              x={lx}
              y={ly}
              className={`wheel__label${activeIndex === a ? " is-active" : ""}`}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {aspect.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function AspectPanel({ selfEval, onChange, activeIndex, onSelect, open, onToggle }) {
  const [openInfo, setOpenInfo] = useState(null);
  const avg = Math.round((selfEval.reduce((a, b) => a + b, 0) / selfEval.length) * 10) / 10;

  return (
    <section className={`panel panel--collapsible${open ? " is-open" : ""}`} aria-label="Autoevaluación rápida">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        aria-controls="aspects-body"
        onClick={onToggle}
      >
        <span className="disclosure__icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="disclosure__text">
          <span className="panel__title">Autoevaluación rápida</span>
          <span className="panel__hint">{open ? "Puntúa cada área de 0 a 10" : `Media ${avg}/10 · toca para editar`}</span>
        </span>
        {!open && (
          <span className="disclosure__preview" aria-hidden="true">
            {selfEval.map((v, i) => (
              <span
                key={i}
                className="disclosure__chip"
                style={{ "--aspect-color": colorFor(i), "--fill": `${v * 10}%` }}
              >
                {v}
              </span>
            ))}
          </span>
        )}
      </button>

      <div id="aspects-body" className="collapse" hidden={!open}>
        <ul className="aspects">
          {ASPECTS.map((aspect, i) => {
            const infoId = `aspect-info-${i}`;
            const isOpen = openInfo === i;
            return (
              <li
                key={aspect.name}
                className={`aspect${activeIndex === i ? " is-active" : ""}`}
                style={{ "--aspect-color": colorFor(i) }}
                onFocusCapture={() => onSelect(i)}
                onPointerEnter={() => onSelect(i)}
              >
                <div className="aspect__row">
                  <span className="aspect__dot" aria-hidden="true" />
                  <span className="aspect__name">{aspect.name}</span>
                  <span className="aspect__value">{selfEval[i]}</span>
                  <button
                    type="button"
                    className="aspect__info"
                    aria-expanded={isOpen}
                    aria-controls={infoId}
                    aria-label={`Qué evalúa ${aspect.name}`}
                    onClick={() => setOpenInfo(isOpen ? null : i)}
                  >
                    i
                  </button>
                </div>

                <input
                  className="aspect__range"
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={selfEval[i]}
                  aria-label={`Puntuación de ${aspect.name}`}
                  onChange={(e) => onChange(i, e.target.value)}
                />

                <div id={infoId} className={`aspect__desc${isOpen ? " is-open" : ""}`}>
                  <p>{aspect.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function App() {
  const [selfEval, setSelfEval] = useState(() => new Array(ASPECTS.length).fill(5));
  const [activeIndex, setActiveIndex] = useState(null);
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [aspectsOpen, setAspectsOpen] = useState(true);

  const questions = useMemo(() => {
    const out = [];
    ASPECTS.forEach((aspect, ai) => {
      for (let i = 0; i < 3; i++) {
        out.push({
          id: `${ai}-${i}`,
          areaIndex: ai,
          area: aspect.name,
          dimension: `Dimensión ${i + 1}`,
          text: `En las últimas semanas, ¿cómo valoras tu situación en ${aspect.name.toLowerCase()}? (${i + 1}/3)`,
        });
      }
    });
    return out;
  }, []);

  const resultAvg = useMemo(
    () =>
      ASPECTS.map((_, ai) => {
        const own = questions.filter((q) => q.areaIndex === ai && answers[q.id] != null);
        if (!own.length) return 0;
        const sum = own.reduce((acc, q) => acc + answers[q.id], 0);
        return Math.round((sum / own.length) * 10) / 10;
      }),
    [answers, questions]
  );

  const current = questions[qIndex];
  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);

  function handleSelf(i, value) {
    setSelfEval((prev) => {
      const next = [...prev];
      next[i] = Number(value);
      return next;
    });
  }

  function handleAnswer(value) {
    setAnswers((prev) => ({ ...prev, [current.id]: Number(value) }));
    setAspectsOpen(false);
    if (qIndex < questions.length - 1) {
      setTimeout(() => setQIndex((i) => i + 1), 200);
    }
  }

  function reset() {
    setAnswers({});
    setQIndex(0);
    setAspectsOpen(true);
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Rueda de la Vida</h1>
          <p className="app__subtitle">Medir · Comparar · Priorizar · Actuar</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          Reiniciar
        </button>
      </header>

      <main className={`layout${aspectsOpen ? "" : " is-compact"}`}>
        <div className="layout__wheel">
          <Wheel selfEval={selfEval} resultAvg={resultAvg} activeIndex={activeIndex} onSelect={setActiveIndex} />
        </div>

        <div className="layout__aspects">
          <AspectPanel
            selfEval={selfEval}
            onChange={handleSelf}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            open={aspectsOpen}
            onToggle={() => setAspectsOpen((v) => !v)}
          />
        </div>

        <div className="layout__quiz">
          <section className="panel">
            <header className="panel__head">
              <h2 className="panel__title">Cuestionario</h2>
              <p className="panel__hint">
                {answered} de {questions.length} respondidas
              </p>
              <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                <span className="progress__bar" style={{ width: `${progress}%` }} />
              </div>
            </header>

            {current && (
              <article className="question" key={current.id} style={{ "--aspect-color": colorFor(current.areaIndex) }}>
                <p className="question__meta">
                  <span className="question__badge">{current.area}</span>
                  <span>{current.dimension}</span>
                </p>
                <h3 className="question__text">{current.text}</h3>

                <div className="scale" role="radiogroup" aria-label={current.text}>
                  {Array.from({ length: 10 }, (_, k) => k + 1).map((v) => {
                    const id = `${current.id}-${v}`;
                    return (
                      <React.Fragment key={id}>
                        <input
                          className="scale__input"
                          type="radio"
                          id={id}
                          name={current.id}
                          value={v}
                          checked={answers[current.id] === v}
                          onChange={() => handleAnswer(v)}
                        />
                        <label className="scale__label" htmlFor={id}>
                          {v}
                        </label>
                      </React.Fragment>
                    );
                  })}
                </div>

                <nav className="question__nav">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={qIndex === 0}
                    onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={qIndex >= questions.length - 1}
                    onClick={() => setQIndex((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    Siguiente
                  </button>
                </nav>
              </article>
            )}
          </section>

          <section className="panel">
            <header className="panel__head">
              <h2 className="panel__title">Percepción vs resultado</h2>
              <p className="panel__hint">La brecha señala dónde explorar, no quién tiene razón.</p>
            </header>

            <ul className="results">
              {ASPECTS.map((aspect, i) => {
                const hasResult = resultAvg[i] > 0;
                const gap = Math.round((selfEval[i] - resultAvg[i]) * 10) / 10;
                return (
                  <li key={aspect.name} className="result" style={{ "--aspect-color": colorFor(i) }}>
                    <div className="result__info">
                      <span className="result__name">{aspect.name}</span>
                      <span className="result__meta">
                        Percepción {selfEval[i]} · Resultado {hasResult ? resultAvg[i] : "—"}
                      </span>
                    </div>
                    <span className={`badge${hasResult && Math.abs(gap) >= 2 ? " badge--warn" : ""}`}>
                      {hasResult ? `Brecha ${gap > 0 ? "+" : ""}${gap}` : "Sin datos"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
