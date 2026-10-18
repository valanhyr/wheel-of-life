import React, { useEffect, useMemo, useState } from "react";
import original from "./data/questions.json";
import { validateEditorSnapshot } from "./data/editor-validation";
import { changeQuestion, createQuestion, removeQuestion, duplicateScale, changeScale } from "./data/question-operations";
import { questionImpact } from "./data/question-impact";

const pretty = (value) => JSON.stringify(value, null, 2);

export function ImpactReview({ impact, onConfirm, onCancel, saving }) {
  const score = (value) => value == null ? "No comparable" : `${Math.round(value * 100) / 100}/10`;
  return <section className="editor__review" aria-label="Revisión de impacto">
    <p className="editor__eyebrow">Antes de guardar</p><h3>Revisión de impacto</h3>
    <p>{impact.added.length} altas · {impact.removed.length} bajas · {impact.changed.length} modificaciones · {impact.scaleChanges.length} escalas</p>
    {impact.changed.length > 0 && <p className="editor__help">Preguntas modificadas: {impact.changed.join(", ")}</p>}
    {impact.renamed.map(({ from, to }) => <p key={from}><code>{from} → {to}</code> · referencias actualizadas</p>)}
    {impact.renamed.length > 0 && <p className="editor__note">Las respuestas históricas reales siguen usando el ID anterior. Necesitan una migración explícita; esta vista solo remapea los ejemplos sintéticos.</p>}
    {impact.scaleChanges.map((scale) => <p key={scale.key}>{scale.key}: {scale.usersBefore} → {scale.usersAfter} preguntas</p>)}
    <h4>Comparación de fixtures sintéticos</h4>
    <ul>{Object.entries(impact.fixtures).map(([id, values]) => <li key={id}><strong>{id}</strong>: {score(values.before)} → {score(values.after)}</li>)}</ul>
    <p className="editor__help">Solo compara la nota ponderada. No verifica textos, patrones ni todos los casos posibles; ejecuta npm test y npm run build antes de publicar.</p>
    <div className="editor__actions"><button type="button" className="btn" onClick={onConfirm} disabled={saving}>{saving ? "Guardando…" : "Confirmar y guardar JSON"}</button><button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>Seguir editando</button></div>
  </section>;
}

export default function QuestionEditor({ onClose }) {
  const [snapshot, setSnapshot] = useState({ document: original, rules: {}, scales: {}, revision: null });
  const [baseline, setBaseline] = useState(null);
  const [areaId, setAreaId] = useState(original.areas[0].id);
  const [selectedId, setSelectedId] = useState(original.questions[0].id);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [ruleDrafts, setRuleDrafts] = useState({});
  const [scaleDraft, setScaleDraft] = useState(null);
  const [changed, setChanged] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [review, setReview] = useState(null);
  const [editVersion, setEditVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/editor/questions", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("No está disponible el backend local. Inicia la app con npm run dev.");
      return response.json();
    }).then((data) => { setSnapshot(data); setBaseline(data); setSelectedId(data.document.questions[0]?.id ?? null); })
      .catch((error) => { if (error.name !== "AbortError") setNotice(error.message); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!changed && !Object.keys(drafts).length && !Object.keys(ruleDrafts).length && scaleDraft === null) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed, drafts, ruleDrafts, scaleDraft]);

  const items = snapshot.document.questions;
  const area = original.areas.find((entry) => entry.id === areaId);
  const areaItems = items.filter((item) => item.areaId === areaId);
  const filtered = useMemo(() => areaItems.filter((item) => `${item.id} ${item.dimension} ${item.text}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [areaItems, query]);
  const selected = items.find((item) => item.id === selectedId);
  let workingScales = snapshot.scales;
  try { if (scaleDraft !== null) workingScales = JSON.parse(scaleDraft); }
  catch { /* Keep invalid raw JSON for correction before saving. */ }
  let edited = selected;
  try { if (selected && drafts[selectedId] !== undefined) edited = JSON.parse(drafts[selectedId]); }
  catch { /* Leave the raw JSON in place so the error can be corrected. */ }

  function editField(field, value) {
    if (!selected) return;
    try {
      const base = JSON.parse(drafts[selectedId] ?? pretty(selected));
      const updated = { ...base, [field]: value };
      if (field === "areaId" && base.scored) updated.dimension = original.areas.find((a) => a.id === value).dimensions[0];
      if (field === "scored" && value && !snapshot.rules[base.areaId]?.dimensions[base.dimension]) updated.dimension = original.areas.find((a) => a.id === base.areaId).dimensions[0];
      if (field === "polarity") {
        const counterpart = base.responseScale?.replace(/_(positive|negative)$/, value === "negativa" ? "_negative" : "_positive");
        if (workingScales[counterpart]) updated.responseScale = counterpart;
      }
      setDrafts((previous) => ({ ...previous, [selectedId]: pretty(updated) }));
      touch();
      setErrors([]);
    } catch { setErrors(["Corrige el JSON de la pregunta antes de usar los campos rápidos."]); }
  }

  function touch() { setEditVersion((version) => version + 1); setReview(null); }

  function snapshotWithRules() {
    const rules = { ...snapshot.rules };
    for (const [id, raw] of Object.entries(ruleDrafts)) rules[id] = JSON.parse(raw);
    return { ...snapshot, rules };
  }

  function leave() {
    if (!(changed || Object.keys(drafts).length || Object.keys(ruleDrafts).length || scaleDraft !== null) || window.confirm("Hay cambios sin guardar en los archivos JSON. ¿Salir del editor?")) onClose();
  }

  function selectArea(id) {
    setAreaId(id);
    setSelectedId(items.find((item) => item.areaId === id)?.id ?? null);
    setQuery("");
    setErrors([]);
  }

  function applyQuestion() {
    if (!selected || drafts[selectedId] === undefined) return;
    try {
      const parsed = JSON.parse(drafts[selectedId]);
      const next = changeQuestion(snapshotWithRules(), selected.uid, parsed);
      setSnapshot(next);
      setRuleDrafts({});
      setDrafts((previous) => { const copy = { ...previous }; delete copy[selectedId]; return copy; });
      setSelectedId(parsed.id);
      setAreaId(parsed.areaId);
      setChanged(true);
      touch();
      setErrors([]);
      setNotice("Pregunta aplicada en memoria. Guarda para escribir los archivos JSON.");
    } catch (error) { setErrors([`Pregunta ${selectedId}: ${error.message}`]); }
  }

  function add() {
    if (!areaItems.length) { setErrors(["Esta área no tiene preguntas para usar como modelo."]); return; }
    try {
      const next = createQuestion(snapshotWithRules(), selected?.areaId === areaId ? selected.id : areaItems[0].id, "Nueva pregunta — editar antes de guardar");
      setSnapshot(next);
      setRuleDrafts({});
      setSelectedId(next.document.questions.at(-1).id);
      setChanged(true);
      touch();
      setErrors([]);
      setNotice("Pregunta creada y vinculada a sus reglas. Edita el enunciado antes de guardar.");
    } catch (error) { setErrors([error.message]); }
  }

  function remove() {
    if (!selected || !window.confirm(`¿Eliminar ${selected.id} del borrador y desvincular sus reglas?`)) return;
    try {
      const next = removeQuestion(snapshotWithRules(), selected.uid);
      setSnapshot(next);
      setRuleDrafts({});
      setDrafts((previous) => { const copy = { ...previous }; delete copy[selected.id]; return copy; });
      setSelectedId(next.document.questions.find((item) => item.areaId === areaId)?.id ?? null);
      setChanged(true);
      touch();
      setErrors([]);
    } catch (error) { setErrors([error.message]); }
  }

  function duplicateSelectedScale() {
    try {
      const next = duplicateScale({ ...snapshotWithRules(), scales: JSON.parse(scaleDraft ?? pretty(snapshot.scales)) }, selected.uid);
      setSnapshot(next.snapshot);
      setRuleDrafts({});
      setScaleDraft(null);
      setChanged(true);
      touch();
      setNotice(`Escala ${next.key} creada solo para ${selected.id}. Sus opciones pueden editarse sin afectar otras preguntas.`);
      setErrors([]);
    } catch (error) { setErrors([error.message]); }
  }

  function editScaleScore(key, index, value) {
    try {
      const scales = JSON.parse(scaleDraft ?? pretty(snapshot.scales));
      const options = scales[key].options.map((option, i) => i === index ? { ...option, score: Number(value) } : option);
      setScaleDraft(pretty(changeScale({ ...snapshot, scales }, key, { ...scales[key], options }).scales));
      touch();
    } catch (error) { setErrors([`Escala: ${error.message}`]); }
  }

  function editScaleField(key, field, value) {
    try {
      const scales = JSON.parse(scaleDraft ?? pretty(snapshot.scales));
      setScaleDraft(pretty(changeScale({ ...snapshot, scales }, key, { ...scales[key], [field]: value }).scales));
      touch();
    } catch (error) { setErrors([`Escala: ${error.message}`]); }
  }

  function prepareReview() {
    if (!snapshot.revision || saving) return;
    try {
      let updated = snapshotWithRules();
      for (const [id, raw] of Object.entries(drafts)) {
        const current = updated.document.questions.find((q) => q.id === id);
        updated = changeQuestion(updated, current.uid, JSON.parse(raw));
      }
      const scales = scaleDraft === null ? snapshot.scales : JSON.parse(scaleDraft);
      updated = { ...updated, scales };
      const problems = validateEditorSnapshot(updated);
      if (problems.length) { setErrors(problems); return; }
      setErrors([]);
      setReview({ snapshot: updated, impact: questionImpact(baseline, updated, baseline.fixtureAnswers), version: editVersion });
    } catch (error) { setErrors([`Revisa el JSON: ${error.message}`]); }
  }

  async function save() {
    if (!review || review.version !== editVersion || saving) return;
    const updated = review.snapshot;
    try {
      setSaving(true);
      const response = await fetch("/api/editor/questions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors ?? [result.error ?? "No se pudieron guardar los archivos."]); return; }
      const persisted = { ...updated, revision: result.revision, fixtureAnswers: baseline.fixtureAnswers };
      setSnapshot(persisted);
      setBaseline(persisted);
      setDrafts({});
      setRuleDrafts({});
      setScaleDraft(null);
      setSelectedId(updated.document.questions.find((item) => item.id === selectedId)?.id ?? updated.document.questions.find((item) => item.areaId === areaId)?.id ?? null);
      setChanged(false);
      setReview(null);
      setErrors([]);
      setNotice("JSON guardados en src/data/. Recarga la app para ver los cambios y ejecuta npm test y npm run build antes de publicarlos.");
    } catch (error) { setErrors([`No se pudo guardar: ${error.message}`]); }
    finally { setSaving(false); }
  }

  return <main className="editor">
    <div className="editor__intro"><div><p className="editor__eyebrow">Biblioteca editorial · {items.length} preguntas</p><h2>Editor de preguntas</h2><p className="editor__lead">Edición local de los JSON del cuestionario y sus reglas. Cada cambio se revisa antes de escribir los archivos.</p></div><button type="button" className="btn btn--ghost" onClick={leave}>← Volver al cuestionario</button></div>
    <div className="editor__toolbar"><span className="editor__status">{changed || Object.keys(drafts).length || Object.keys(ruleDrafts).length || scaleDraft !== null ? "● Cambios sin guardar" : "○ Archivos del proyecto"}</span><div className="editor__actions"><button type="button" className="btn" disabled={!snapshot.revision || saving} onClick={prepareReview}>Revisar impacto</button></div></div>
    <p className="editor__note">Las referencias se actualizan automáticamente al aplicar cambios. Algunos IDs fijados en scoring.js están protegidos. El guardado requiere revisar y confirmar el impacto; no recalibra resultados ni migra respuestas reales.</p>
    {notice && <p role="status" className="editor__notice">{notice}</p>}
    {errors.length > 0 && <div role="alert" className="editor__notice editor__notice--error"><strong>No se puede guardar:</strong><ul>{errors.slice(0, 30).map((error, i) => <li key={i}>{error}</li>)}</ul>{errors.length > 30 && <p>Y {errors.length - 30} errores más.</p>}</div>}
    {review && <ImpactReview impact={review.impact} onConfirm={save} onCancel={() => setReview(null)} saving={saving} />}
    <div className="editor__layout">
      <aside className="editor__sidebar" aria-label="Áreas del cuestionario"><h3>Áreas <span>08</span></h3>{original.areas.map((entry) => <button key={entry.id} type="button" className={`editor__area${entry.id === areaId ? " is-selected" : ""}`} style={{ "--aspect-color": entry.color }} onClick={() => selectArea(entry.id)} aria-current={entry.id === areaId ? "true" : undefined}><span className="editor__area-dot" />{entry.name}<small>{items.filter((item) => item.areaId === entry.id).length}</small></button>)}</aside>
      <section className="editor__catalog" aria-label={`Preguntas de ${area.name}`}><div className="editor__catalog-head"><div><p className="editor__eyebrow">Área seleccionada</p><h3>{area.fullName}</h3><p>{areaItems.length} preguntas · {area.dimensions.length} dimensiones</p></div><button type="button" className="btn" onClick={add} disabled={!snapshot.revision}>+ Crear pregunta</button></div><p className="editor__help">La pregunta nueva copiará la configuración de la pregunta seleccionada.</p>
        <label className="editor__search">Buscar por texto, ID o dimensión<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar preguntas…" /></label>
        {filtered.length === 0 ? <p className="editor__empty">No hay preguntas que coincidan con la búsqueda.</p> : <div className="editor__groups">{[...new Set(filtered.map((item) => item.dimension))].map((dimension) => <div key={dimension} className="editor__group"><h4>{dimension} <span>{filtered.filter((item) => item.dimension === dimension).length}</span></h4>{filtered.filter((item) => item.dimension === dimension).map((item) => <button type="button" key={item.id} className={`editor__item${selectedId === item.id ? " is-selected" : ""}`} onClick={() => { setSelectedId(item.id); setErrors([]); }}><span className="editor__item-meta"><code>{item.id}</code><span>{item.scored === false ? (item.dimension.startsWith("Prioridades") ? "Prioridad" : "Contexto") : "Puntuable"}</span></span><span className="editor__item-text">{item.text}</span></button>)}</div>)}</div>}
      </section>
      <section className="editor__detail" aria-label="Editar pregunta"><p className="editor__eyebrow">Ficha de pregunta</p><h3>Editar pregunta</h3>{selected ? <><p className="editor__id">{selected.id}</p><p className="editor__help">Identidad interna: <code>{selected.uid}</code> · inmutable</p>
          <div className="editor__quick">
            <label className="editor__field">Identificador (ID)<input value={edited?.id ?? ""} onChange={(event) => editField("id", event.target.value)} /></label>
            <label className="editor__field">Área de la pregunta<select value={edited?.areaId ?? ""} onChange={(event) => editField("areaId", event.target.value)}>{original.areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="editor__field">Dimensión<select value={edited?.dimension ?? ""} onChange={(event) => editField("dimension", event.target.value)}>{[...new Set([...(original.areas.find((a) => a.id === edited?.areaId)?.dimensions ?? []), "Contexto", "Prioridades", edited?.dimension].filter(Boolean))].map((name) => <option key={name}>{name}</option>)}</select></label>
            <label className="editor__field editor__field--wide">Enunciado<textarea rows="4" value={edited?.text ?? ""} onChange={(event) => editField("text", event.target.value)} /></label>
            <label className="editor__field">Escala<select value={edited?.responseScale ?? ""} onChange={(event) => editField("responseScale", event.target.value)}><option value="">Opciones propias</option>{Object.keys(workingScales ?? {}).map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
            <label className="editor__field">Polaridad<select value={edited?.polarity ?? "positiva"} onChange={(event) => editField("polarity", event.target.value)}><option value="positiva">Positiva</option><option value="negativa">Negativa</option></select></label>
            <label className="editor__field">Peso en dimensión<input type="number" min="0.01" step="0.01" value={edited?.dimensionWeight ?? ""} onChange={(event) => editField("dimensionWeight", Number(event.target.value))} /></label>
            <label className="editor__field editor__check"><input type="checkbox" checked={edited?.scored === true} onChange={(event) => editField("scored", event.target.checked)} /> Puntuable</label>
            <label className="editor__field editor__check"><input type="checkbox" checked={edited?.required === true} onChange={(event) => editField("required", event.target.checked)} /> Obligatoria</label>
          </div>
          <p className="editor__help">Aplicar pregunta actualiza la lista y sus referencias. Opciones y factores siguen disponibles en el JSON avanzado.</p><details><summary>JSON avanzado de la pregunta</summary><label className="editor__field" htmlFor="editor-json">JSON de la pregunta<textarea id="editor-json" className="editor__json" spellCheck="false" rows="15" value={drafts[selectedId] ?? pretty(selected)} onChange={(event) => { setDrafts((previous) => ({ ...previous, [selectedId]: event.target.value })); touch(); }} /></label></details><div className="editor__actions"><button type="button" className="btn btn--ghost" onClick={applyQuestion} disabled={drafts[selectedId] === undefined}>Aplicar pregunta</button><button type="button" className="btn btn--danger" onClick={remove}>Eliminar pregunta</button></div></> : <p className="editor__empty">Selecciona una pregunta de la lista.</p>}
        <div className="editor__rules"><h3>Escalas de respuesta</h3><p className="editor__help">Preguntas que usan esta escala: {items.filter((item) => item.responseScale === selected?.responseScale).length}. Cambiar sus puntuaciones afecta a todas; duplicar crea una escala solo para la pregunta seleccionada.</p>
          <button type="button" className="btn btn--ghost" disabled={!selected?.responseScale || !workingScales?.[selected.responseScale] || drafts[selectedId] !== undefined} onClick={duplicateSelectedScale}>Duplicar escala para esta pregunta</button>
          {selected?.responseScale && workingScales?.[selected.responseScale] && <div className="editor__scale-options">
            <h4>{selected.responseScale} · {workingScales[selected.responseScale].type === "rating" ? "Rango de valoración" : "Puntuaciones compartidas"}</h4>
            {workingScales[selected.responseScale].options?.map((option, i) => <label className="editor__field" key={`${option.value}-${i}`}>{option.label} ({option.value}) · score 0–10<input type="number" min="0" max="10" step="0.5" value={option.score} onChange={(event) => editScaleScore(selected.responseScale, i, event.target.value)} /></label>)}
            {workingScales[selected.responseScale].type === "rating" && <div className="editor__quick">{["min", "max", "step"].map((field) => <label key={field} className="editor__field">{field}<input type="number" value={workingScales[selected.responseScale][field]} onChange={(event) => editScaleField(selected.responseScale, field, Number(event.target.value))} /></label>)}<label className="editor__field editor__check"><input type="checkbox" checked={workingScales[selected.responseScale].invert} onChange={(event) => editScaleField(selected.responseScale, "invert", event.target.checked)} /> Invertir puntuación</label></div>}
          </div>}
          <details><summary>JSON avanzado de todas las escalas</summary><label className="editor__field" htmlFor="editor-scales">JSON de escalas<textarea id="editor-scales" className="editor__json" spellCheck="false" rows="10" value={scaleDraft ?? pretty(snapshot.scales)} onChange={(event) => { setScaleDraft(event.target.value); touch(); }} /></label></details>
        </div>
        <div className="editor__rules"><h3>Reglas del área</h3><p className="editor__help">Las referencias se mantienen desde el formulario. Para patrones y pesos globales utiliza el JSON avanzado.</p><details><summary>JSON avanzado de reglas</summary><label className="editor__field" htmlFor="editor-rules">JSON de reglas<textarea id="editor-rules" className="editor__json" spellCheck="false" rows="12" value={ruleDrafts[areaId] ?? pretty(snapshot.rules[areaId] ?? {})} onChange={(event) => { setRuleDrafts((previous) => ({ ...previous, [areaId]: event.target.value })); touch(); }} /></label></details></div>
      </section>
    </div>
  </main>;
}
