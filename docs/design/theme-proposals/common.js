/* Datos de demo y selector de tema compartidos por las propuestas. No forma parte de la app. */
window.WOL = {
  areas: [
    { name: "Salud", v: 7.8, p: 8 }, { name: "Emocional", v: 6.2, p: 7 }, { name: "Relaciones", v: 6.9, p: 7 },
    { name: "Familia", v: 7.4, p: 8 }, { name: "Trabajo", v: 5.8, p: 7 }, { name: "Finanzas", v: 4.1, p: 6.5 },
    { name: "Crecimiento", v: 6.5, p: 6 }, { name: "Ocio", v: 5.3, p: 7 },
  ],
  fmt: (v) => String(v).replace(".", ","),
  ns: "http://www.w3.org/2000/svg",
  el(svg, tag, attrs) { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.append(e); return e; },
  pt(c, r, a) { return [c + r * Math.sin(a), c - r * Math.cos(a)]; },
  initThemes(key, onChange) {
    const btns = document.querySelectorAll(".demo-bar button");
    const set = (t) => { document.body.dataset.theme = t; btns.forEach((b) => b.setAttribute("aria-pressed", b.dataset.t === t)); try { localStorage[key] = t; } catch {} onChange && onChange(t); };
    btns.forEach((b) => (b.onclick = () => set(b.dataset.t)));
    let t = btns[0].dataset.t;
    try { if (localStorage[key]) t = localStorage[key]; } catch {}
    if (location.hash.slice(1)) t = location.hash.slice(1);
    set(t);
  },
};
