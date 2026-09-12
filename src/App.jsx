import React, { useMemo, useState } from "react";
import {
  areas,
  questions,
  areaScores,
  scoreLevel,
  gapStatus,
  optionsFor,
  priorityOrder,
  interpretationFor,
  priorityFor,
  guidanceFor,
  gapPrompts,
  animals,
  shed,
} from "./data/scoring";

const RINGS = 10;
const VIEW = 120;
const CENTER = VIEW / 2;
const MAX_R = 44;
const TOTAL = areas.length;

const colorFor = (i) => areas[i].color;
const round1 = (n) => Math.round(n * 10) / 10;

function polar(cx, cy, r, angle) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function sectorPath(aspectIndex, ring) {
  const rOuter = (ring / RINGS) * MAX_R;
  const rInner = ((ring - 1) / RINGS) * MAX_R;
  const start = (aspectIndex / TOTAL) * Math.PI * 2 - Math.PI / 2;
  const end = ((aspectIndex + 1) / TOTAL) * Math.PI * 2 - Math.PI / 2;
  const [x1, y1] = polar(CENTER, CENTER, rInner, start);
  const [x2, y2] = polar(CENTER, CENTER, rOuter, start);
  const [x3, y3] = polar(CENTER, CENTER, rOuter, end);
  const [x4, y4] = polar(CENTER, CENTER, rInner, end);
  return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;
}

/* ------------------------------------------------------------------ wheel */

function Wheel({ selfEval, scores, activeIndex, onSelect }) {
  const sectors = useMemo(() => {
    const out = [];
    for (let ring = RINGS; ring >= 1; ring--) {
      for (let a = 0; a < TOTAL; a++) {
        out.push({ key: `${a}-${ring}`, a, ring, d: sectorPath(a, ring) });
      }
    }
    return out;
  }, []);

  const answeredAreas = scores.filter((s) => s != null).length;

  const overlay = useMemo(() => {
    const pts = scores.map((v, a) => {
      const r = ((v ?? 0) / 10) * MAX_R;
      const angle = ((a + 0.5) / TOTAL) * Math.PI * 2 - Math.PI / 2;
      return polar(CENTER, CENTER, r, angle);
    });
    return { pts, d: pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ") + " Z" };
  }, [scores]);

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
          {sectors.map(({ key, a, ring, d }) => (
            <path
              key={key}
              d={d}
              className={`wheel__sector${activeIndex === a ? " is-active" : ""}`}
              fill={selfEval[a] >= ring ? colorFor(a) : "rgba(255,255,255,0.035)"}
              style={{ transitionDelay: `${ring * 12}ms` }}
              onClick={() => onSelect(a)}
            />
          ))}
        </g>

        {answeredAreas > 0 && (
          <g className="wheel__overlay">
            <path d={overlay.d} fill="url(#overlayFill)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.6" />
            {overlay.pts.map(([x, y], a) =>
              scores[a] == null ? null : (
                <circle key={a} cx={x} cy={y} r="1.4" fill={colorFor(a)} stroke="rgba(255,255,255,0.7)" strokeWidth="0.35" />
              )
            )}
          </g>
        )}

        {areas.map((area, a) => {
          const angle = ((a + 0.5) / TOTAL) * Math.PI * 2 - Math.PI / 2;
          const [lx, ly] = polar(CENTER, CENTER, MAX_R + 10, angle);
          return (
            <text
              key={area.id}
              x={lx}
              y={ly}
              className={`wheel__label${activeIndex === a ? " is-active" : ""}`}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {area.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------- accordion shell */

function Section({ id, title, summary, meter, open, onOpen, children }) {
  return (
    <section className={`section${open ? " is-open" : " is-compact"}`} aria-label={title}>
      <h2 className="section__head">
        <button type="button" className="section__toggle" aria-expanded={open} aria-controls={`${id}-body`} onClick={onOpen}>
          <span className="section__text">
            <span className="section__title">{title}</span>
            <span className="section__summary">{summary}</span>
          </span>
          {meter}
          <span className="section__chevron" aria-hidden="true" />
        </button>
      </h2>

      <div id={`${id}-body`} className="section__body" hidden={!open}>
        <div className="section__inner">{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ views */

function SelfEvaluation({ selfEval, onChange, activeIndex, onSelect, onDone }) {
  const [openInfo, setOpenInfo] = useState(null);

  return (
    <>
      <p className="hint">Puntúa cada área de 0 a 10 según tu percepción, antes de responder el cuestionario.</p>

      <ul className="aspects">
        {areas.map((area, i) => {
          const infoId = `aspect-info-${area.id}`;
          const isOpen = openInfo === i;
          return (
            <li
              key={area.id}
              className={`aspect${activeIndex === i ? " is-active" : ""}`}
              style={{ "--aspect-color": area.color }}
              onFocusCapture={() => onSelect(i)}
              onPointerEnter={() => onSelect(i)}
            >
              <div className="aspect__row">
                <span className="aspect__dot" aria-hidden="true" />
                <span className="aspect__name">{area.name}</span>
                <span className="aspect__value">{selfEval[i]}</span>
                <button
                  type="button"
                  className="aspect__info"
                  aria-expanded={isOpen}
                  aria-controls={infoId}
                  aria-label={`Qué evalúa ${area.name}`}
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
                aria-label={`Puntuación de ${area.name}`}
                onChange={(e) => onChange(i, e.target.value)}
              />

              <div id={infoId} className={`aspect__desc${isOpen ? " is-open" : ""}`}>
                <p>
                  <strong>{area.fullName}.</strong> {area.desc}
                  <em className="aspect__quote">{area.question}</em>
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="row-end">
        <button type="button" className="btn" onClick={onDone}>
          Ir al cuestionario
        </button>
      </div>
    </>
  );
}

function Quiz({ qIndex, setQIndex, answers, onAnswer }) {
  const current = questions[qIndex];
  const area = areas.find((a) => a.id === current.areaId);
  const options = optionsFor(current);

  return (
    <article className="question" key={current.id} style={{ "--aspect-color": area.color }}>
      <p className="question__meta">
        <span className="question__badge">{area.name}</span>
        <span>{current.dimension}</span>
        <span className="question__count">
          {qIndex + 1}/{questions.length}
        </span>
      </p>

      <h3 className="question__text">{current.text}</h3>

      <div className={`scale scale--${current.type === "frecuencia" ? "freq" : "rating"}`} role="radiogroup" aria-label={current.text}>
        {options.map((opt) => {
          const id = `${current.id}-${opt.value}`;
          return (
            <React.Fragment key={id}>
              <input
                className="scale__input"
                type="radio"
                id={id}
                name={current.id}
                checked={answers[current.id] === opt.value}
                onChange={() => onAnswer(current.id, opt.value)}
              />
              <label className="scale__label" htmlFor={id}>
                {opt.label}
              </label>
            </React.Fragment>
          );
        })}
      </div>

      {current.polarity === "negativa" && <p className="question__note">Pregunta inversa: responder menos suma más.</p>}

      <nav className="question__nav">
        <button type="button" className="btn btn--ghost" disabled={qIndex === 0} onClick={() => setQIndex(qIndex - 1)}>
          Anterior
        </button>
        <button
          type="button"
          className="btn"
          disabled={qIndex >= questions.length - 1 || answers[current.id] === undefined}
          onClick={() => setQIndex(qIndex + 1)}
        >
          Siguiente
        </button>
      </nav>
    </article>
  );
}

function ResultRow({ area, score, perception, open, onToggle }) {
  const level = scoreLevel(score);
  const gap = gapStatus(score, perception);
  const band = interpretationFor(score);
  const rules = priorityFor(score, gap);
  const plan = guidanceFor(area.id, score);
  const panelId = `result-${area.id}`;

  return (
    <li className={`result result--${level.tone}${open ? " is-open" : ""}`} style={{ "--aspect-color": area.color }}>
      <button
        type="button"
        className="result__head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        disabled={score == null}
      >
        <span className="result__info">
          <span className="result__name">
            {area.name}
            <span className={`dot dot--${level.tone}`} title={level.label} aria-label={level.label} />
          </span>
          <span className="result__meta">
            Percepción {perception} · Resultado {score ?? "—"}
          </span>
        </span>
        <span className={`badge badge--gap is-${gap.dir} is-${gap.strength}`} title={gap.label}>
          {gap.gap == null ? "Sin responder" : `${gap.gap > 0 ? "+" : ""}${gap.gap}`}
        </span>
        <span className="result__chevron" aria-hidden="true" />
      </button>

      <div className="result__detail" id={panelId} hidden={!open}>
        {band && (
          <p className="result__band">
            <strong>{band.label}.</strong> {band.text}
          </p>
        )}

        <p className="result__gap">{gapPrompts[gap.dir === "none" ? "even" : gap.dir]}</p>

        {rules.length > 0 && (
          <p className="tags">
            {rules.map((rule) => (
              <span key={rule.id} className="tag" title={rule.text}>
                {rule.id} · {rule.label}
              </span>
            ))}
          </p>
        )}

        {plan && (
          <>
            <h4 className="result__subtitle">Acciones propuestas</h4>
            <ul className="actions">
              {plan.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className="result__resources">Recursos: {plan.resources}</p>
          </>
        )}
      </div>
    </li>
  );
}

function Reflection() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`reflection${open ? " is-open" : ""}`}>
      <button type="button" className="reflection__toggle" aria-expanded={open} aria-controls="reflection-body" onClick={() => setOpen((v) => !v)}>
        <span>Para profundizar en cualquier área</span>
        <span className="result__chevron" aria-hidden="true" />
      </button>

      <div className="reflection__body" id="reflection-body" hidden={!open}>
        <p className="hint">
          Los tres animales no puntúan: se aplican después del diagnóstico, sobre el área que decidas trabajar.
        </p>

        <ul className="animals">
          {animals.map((animal) => (
            <li key={animal.id} className={`animal animal--${animal.id}`}>
              <span className="animal__name">
                {animal.name} · {animal.verb}
              </span>
              <span className="animal__q">{animal.question}</span>
            </li>
          ))}
        </ul>

        <p className="result__shed">
          <strong>Cobertizo.</strong> {shed.main}
          <span className="result__shed-alt">{shed.secondary}</span>
        </p>
      </div>
    </div>
  );
}

function Results({ selfEval, scores }) {
  const ranked = priorityOrder(scores, selfEval);
  const top = ranked[0];
  const [openArea, setOpenArea] = useState(null);

  return (
    <>
      <p className="hint">
        La <strong>brecha</strong> compara resultado y percepción: verde si sale a favor, naranja si sale en contra, neutra
        si coinciden. El tono es suave por debajo de 2 puntos y marcado a partir de 2. Aparte, el resultado por debajo de 7
        se señala como área a trabajar. Despliega un área para ver su lectura y sus acciones.
      </p>

      {top && (
        <p className={`callout callout--${top.level.tone}`}>
          <strong>{top.area.name}</strong> encabeza la prioridad: {top.score}/10 · {top.level.label.toLowerCase()}.
        </p>
      )}

      <ul className="results">
        {areas.map((area, i) => (
          <ResultRow
            key={area.id}
            area={area}
            score={scores[i]}
            perception={selfEval[i]}
            open={openArea === area.id}
            onToggle={() => setOpenArea((cur) => (cur === area.id ? null : area.id))}
          />
        ))}
      </ul>

      <Reflection />
    </>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const [selfEval, setSelfEval] = useState(() => new Array(TOTAL).fill(5));
  const [activeIndex, setActiveIndex] = useState(null);
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [openSection, setOpenSection] = useState("self");

  const scores = useMemo(() => areaScores(answers), [answers]);

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);
  const selfAvg = round1(selfEval.reduce((a, b) => a + b, 0) / TOTAL);
  const alerts = scores.filter((s) => {
    const tone = scoreLevel(s).tone;
    return tone === "warn" || tone === "danger";
  }).length;

  function handleSelf(i, value) {
    setSelfEval((prev) => {
      const next = [...prev];
      next[i] = Number(value);
      return next;
    });
  }

  function handleAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (qIndex < questions.length - 1) setTimeout(() => setQIndex((i) => i + 1), 220);
  }

  function reset() {
    setAnswers({});
    setQIndex(0);
    setOpenSection("self");
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

      <main className={`layout${openSection === "quiz" ? " is-focus" : ""}`}>
        <div className="layout__wheel">
          <Wheel selfEval={selfEval} scores={scores} activeIndex={activeIndex} onSelect={setActiveIndex} />
        </div>

        <div className="layout__stack">
          <Section
            id="self"
            title="Autoevaluación rápida"
            summary={`Media ${selfAvg}/10`}
            open={openSection === "self"}
            onOpen={() => setOpenSection("self")}
            meter={
              <span className="chips" aria-hidden="true">
                {selfEval.map((v, i) => (
                  <span
                    key={areas[i].id}
                    className="chips__item"
                    title={`${areas[i].name}: ${v}/10`}
                    style={{ "--aspect-color": areas[i].color, "--fill": `${v * 10}%` }}
                  />
                ))}
              </span>
            }
          >
            <SelfEvaluation
              selfEval={selfEval}
              onChange={handleSelf}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              onDone={() => setOpenSection("quiz")}
            />
          </Section>

          <Section
            id="quiz"
            title="Cuestionario"
            summary={`${answered} de ${questions.length} respondidas`}
            open={openSection === "quiz"}
            onOpen={() => setOpenSection("quiz")}
            meter={
              <span className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
                <span className="progress__bar" style={{ width: `${progress}%` }} />
              </span>
            }
          >
            <Quiz qIndex={qIndex} setQIndex={setQIndex} answers={answers} onAnswer={handleAnswer} />
          </Section>

          <Section
            id="results"
            title="Percepción vs resultado"
            summary={answered ? `${alerts} área(s) requieren atención` : "Aún sin respuestas"}
            open={openSection === "results"}
            onOpen={() => setOpenSection("results")}
            meter={null}
          >
            <Results selfEval={selfEval} scores={scores} />
          </Section>
        </div>
      </main>
    </div>
  );
}
