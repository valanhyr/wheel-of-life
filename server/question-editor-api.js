import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import { validateEditorSnapshot } from "../src/data/editor-validation.js";

export const RULE_FILES = Object.freeze({
  salud: "health-rules.json", emocional: "emotional-rules.json", relaciones: "relationships-rules.json",
  familia: "family-rules.json", trabajo: "work-rules.json", finanzas: "finance-rules.json",
  crecimiento: "growth-rules.json", ocio: "leisure-rules.json",
});

const files = { document: "questions.json", scales: "response-scales.json", ...RULE_FILES };
const fixtureFiles = { salud: "health", emocional: "emotional", relaciones: "relationships", familia: "family", trabajo: "work", finanzas: "finance", crecimiento: "growth", ocio: "leisure" };
const reply = (res, code, value) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(value)); };

async function load(root) {
  const raws = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, name]) => [key, await readFile(join(root, name), "utf8")])));
  const revision = createHash("sha256").update(JSON.stringify(raws)).digest("hex");
  const { document, scales, ...rules } = Object.fromEntries(Object.entries(raws).map(([key, raw]) => [key, JSON.parse(raw)]));
  return { document, scales, rules, revision, raws };
}

function localRequest(req) {
  const host = req.headers.host;
  const address = req.socket.remoteAddress;
  if (!host || !/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(host) || !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address)) return false;
  if (!req.headers.origin) return true;
  try { return new URL(req.headers.origin).host === host && ["http:", "https:"].includes(new URL(req.headers.origin).protocol); }
  catch { return false; }
}

const MAX_BYTES = 2 * 1024 * 1024;
async function bodyOf(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) { const error = new Error("El archivo supera el límite de 2 MB."); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createQuestionEditorMiddleware(root) {
  let writing = false;
  return async (req, res, next) => {
    if (req.url?.split("?")[0] !== "/api/editor/questions") { if (next) return next(); return reply(res, 404, { error: "Ruta no encontrada." }); }
    if (!localRequest(req)) return reply(res, 403, { error: "Acceso permitido únicamente desde localhost." });
    if (!["GET", "PUT"].includes(req.method)) return reply(res, 405, { error: "Método no permitido." });
    if (req.method === "GET") {
      try {
        const { document, scales, rules, revision } = await load(root);
        const fixtureAnswers = Object.fromEntries(await Promise.all(Object.entries(fixtureFiles).map(async ([id, stem]) => {
          const file = new URL(`../tests/fixtures/${stem}-demo.json`, import.meta.url);
          return [id, JSON.parse(await readFile(file, "utf8")).answers];
        })));
        return reply(res, 200, { document, scales, rules, revision, fixtureAnswers });
      }
      catch { return reply(res, 500, { error: "No se pudieron leer los archivos JSON." }); }
    }
    if (!req.headers["content-type"]?.startsWith("application/json")) return reply(res, 415, { error: "Se requiere application/json." });
    if (Number(req.headers["content-length"]) > MAX_BYTES) return reply(res, 413, { error: "El archivo supera el límite de 2 MB." });
    let submitted;
    try { submitted = await bodyOf(req); }
    catch (error) { return reply(res, error.status ?? 400, { error: "JSON inválido o demasiado grande." }); }
    if (writing) return reply(res, 409, { error: "Hay otra escritura en curso. Vuelve a cargar los datos." });
    writing = true;
    const staged = [];
    const applied = [];
    try {
      const current = await load(root);
      if (submitted?.revision !== current.revision) return reply(res, 409, { error: "Los archivos cambiaron desde que los cargaste. Recarga antes de guardar." });
      if (!submitted.rules || Object.keys(submitted.rules).sort().join() !== Object.keys(RULE_FILES).sort().join() || !submitted.scales || typeof submitted.scales !== "object" || Array.isArray(submitted.scales)) return reply(res, 422, { error: "Faltan reglas o escalas de respuesta." });
      const snapshot = { document: { ...current.document, questions: submitted.document?.questions }, scales: submitted.scales, rules: submitted.rules };
      const errors = validateEditorSnapshot(snapshot);
      for (const previous of current.document.questions) {
        const stillSameId = snapshot.document.questions?.find((q) => q?.id === previous.id);
        if (stillSameId && stillSameId.uid !== previous.uid) errors.push(`${previous.id}: la identidad interna uid no puede cambiar.`);
      }
      if (errors.length) return reply(res, 422, { error: "Revisa las referencias antes de guardar.", errors });
      const nextRaw = Object.fromEntries(Object.entries(files).map(([key]) => [key, JSON.stringify(key === "document" ? snapshot.document : key === "scales" ? snapshot.scales : snapshot.rules[key], null, 2) + "\n"]));
      for (const [key, name] of Object.entries(files)) {
        if (JSON.stringify(JSON.parse(current.raws[key])) === JSON.stringify(JSON.parse(nextRaw[key]))) continue;
        const path = join(root, name);
        const temp = `${path}.${randomUUID()}.tmp`;
        await writeFile(temp, nextRaw[key], { flag: "wx" });
        staged.push(temp);
        await rename(temp, path);
        applied.push([path, current.raws[key]]);
      }
      const { revision } = await load(root);
      return reply(res, 200, { revision });
    } catch {
      let restored = true;
      for (const [path, raw] of applied.reverse()) {
        try { await writeFile(path, raw); } catch { restored = false; }
      }
      return reply(res, 500, { error: restored ? "Error al guardar. Se han restaurado los archivos anteriores; comprueba el estado antes de continuar." : "Error al guardar y restaurar los archivos. Comprueba src/data/ antes de continuar." });
    } finally {
      await Promise.all(staged.map((path) => unlink(path).catch(() => {})));
      writing = false;
    }
  };
}
