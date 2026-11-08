import React, { useState } from "react";
import { financeRoutes, resourcesForRoute, suggestFinanceRoute } from "./data/finance-recommendations.js";
import { financeDemoResources } from "./data/finance-demo-resources.js";

const reportEmail = import.meta.env.VITE_RESOURCE_REPORT_EMAIL;

function ResourceList({ title, resources, onDismiss, dismissed, onRestore }) {
  return <div className="resource-route__group">
    <h5>{title}</h5>
    {resources.length === 0 && <p className="hint">No hay más recursos revisados de este tipo para esta ruta.</p>}
    <ul className="resource-route__list">{resources.map((resource) => <li key={resource.id} className="resource-route__item">
      <strong>{resource.title}</strong>
      <p>{resource.description}</p>
      <p className="resource-route__meta">{resource.cost === "free" ? "Gratuito" : "De pago (consulta el precio en destino)"} · {resource.provider} · {resource.registrationRequired ? "Requiere registro" : "Consulta las condiciones de acceso"} · Nivel {resource.level} · {resource.affiliate ? "Enlace afiliado" : "Sin afiliación"}</p>
      <div className="resource-route__actions">
        <a href={resource.url} target="_blank" rel="noopener noreferrer">Ver en {resource.provider} ↗</a>
        <button type="button" onClick={() => onDismiss(resource.id)}>Ya lo conozco/uso</button>
        <button type="button" onClick={() => onDismiss(resource.id)}>No me encaja</button>
        {reportEmail && <a href={`mailto:${encodeURIComponent(reportEmail)}?subject=${encodeURIComponent(`Reporte de recurso: ${resource.id}`)}`}>Reportar recurso</a>}
      </div>
    </li>)}</ul>
    {dismissed.length > 0 && <div className="resource-route__dismissed">
      <span>Recursos apartados: </span>
      {dismissed.map((resource) => <button type="button" key={resource.id} onClick={() => onRestore(resource.id)}>Restaurar {resource.title}</button>)}
    </div>}
  </div>;
}

export default function FinanceRecommendations({ result, answers }) {
  const suggestion = suggestFinanceRoute(result, answers);
  const [choice, setChoice] = useState(suggestion.id);
  const [dismissed, setDismissed] = useState([]);
  const [chosenStep, setChosenStep] = useState(null);
  if (!result?.complete) return null;
  const route = financeRoutes.find(({ id }) => id === choice);
  const allResources = route ? resourcesForRoute(route.id) : { books: [], tools: [] };
  const resources = route ? resourcesForRoute(route.id, dismissed) : { books: [], tools: [] };
  const omitted = (kind) => allResources[kind].filter(({ id }) => dismissed.includes(id));
  const restore = (id) => setDismissed((previous) => previous.filter((value) => value !== id));
  return <section className="resource-route" aria-label="Rutas para avanzar">
    <h4 className="result__subtitle">Rutas para avanzar</h4>
    <p className="hint">{suggestion.id ? `Ruta sugerida: ${financeRoutes.find(({ id }) => id === suggestion.id).title}. ${suggestion.reason}` : "Tu resultado no señala una ruta dominante. Elige la que te interese trabajar."}</p>
    <div className="resource-route__choices" role="group" aria-label="Elegir ruta de Finanzas">
      {financeRoutes.map((option) => <button type="button" key={option.id} className={`resource-route__choice${choice === option.id ? " is-selected" : ""}`} aria-pressed={choice === option.id} onClick={() => { setChoice(option.id); setChosenStep(null); }}>{option.title}</button>)}
    </div>
    {route && <>
      <p className="resource-route__description">{route.description}</p>
      <div className="resource-route__group">
        <h5>Elige un siguiente paso (opcional)</h5>
        <ul className="resource-route__steps">{route.steps.map((step, index) => <li key={step}><label><input type="radio" name="finance-next-step" checked={chosenStep === index} onChange={() => setChosenStep(index)} />{step}</label></li>)}</ul>
        {chosenStep !== null && <button type="button" className="resource-route__clear" onClick={() => setChosenStep(null)}>Quitar mi selección</button>}
      </div>
      <ResourceList title="Herramientas" resources={resources.tools} onDismiss={(id) => setDismissed((previous) => [...new Set([...previous, id])])} dismissed={omitted("tools")} onRestore={restore} />
      <ResourceList title="Libros recomendados" resources={resources.books} onDismiss={(id) => setDismissed((previous) => [...new Set([...previous, id])])} dismissed={omitted("books")} onRestore={restore} />
    </>}
    {import.meta.env.DEV && <aside className="resource-route__demo" aria-label="Fichas Demo · solo desarrollo">
      <h5>Fichas Demo · solo desarrollo</h5>
      <p>Estos enlaces son pruebas de navegación: pueden mostrar error. No son recursos disponibles ni enlaces afiliados.</p>
      <ul className="resource-route__demo-list">{financeDemoResources.map((demo) => <li key={demo.id}>
        <strong>{demo.title}</strong>
        <p>{demo.description}</p>
        <a href={demo.url} target="_blank" rel="noopener noreferrer">Abrir enlace de prueba ↗</a>
      </li>)}</ul>
    </aside>}
    <p className="resource-route__disclaimer">Sugerencias orientativas; no constituyen asesoramiento profesional ni garantizan resultados. Los enlaces te llevan a sitios externos: consulta allí precios, disponibilidad, registro y privacidad antes de compartir datos. Los materiales de origen español pueden incluir ejemplos no aplicables a tu país.</p>
    {!reportEmail && <p className="hint">El correo para reportar recursos aún no está configurado.</p>}
  </section>;
}
