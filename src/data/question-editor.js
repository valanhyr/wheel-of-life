const textFor = (text) => {
  if (typeof text !== "string" || !text.trim()) throw new Error("El enunciado no puede estar vacío.");
  return text.trim();
};

export function updateQuestionText(questions, id, text) {
  const index = questions.findIndex((question) => question.id === id);
  if (index < 0) throw new Error("La pregunta no existe.");
  const next = [...questions];
  next[index] = { ...next[index], text: textFor(text) };
  return next;
}

export function createQuestionFrom(questions, templateId, text) {
  const template = questions.find((question) => question.id === templateId);
  if (!template) throw new Error("La pregunta modelo no existe.");
  const title = textFor(text);
  const match = /^(.*_)(\d+)$/.exec(template.id);
  const prefix = match ? match[1] : `${template.id}_`;
  const digits = match ? match[2] : "01";
  const numbers = questions.map((q) => q.id.startsWith(prefix) && /^\d+$/.test(q.id.slice(prefix.length)) ? Number(q.id.slice(prefix.length)) : null).filter((n) => n !== null);
  const nextId = `${prefix}${String(Math.max(...numbers, 0) + 1).padStart(digits.length, "0")}`;
  return [...questions, { ...structuredClone(template), id: nextId, uid: `qid_${crypto.randomUUID()}`, text: title }];
}

export function restoreDraft(raw, originals) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < originals.length) return null;
    const ids = new Set();
    const uids = new Set();
    const byId = new Map(originals.map((q) => [q.id, q]));
    for (const question of parsed) {
      if (!question || typeof question.id !== "string" || ids.has(question.id) || typeof question.uid !== "string" || uids.has(question.uid) || typeof question.text !== "string" || !question.text.trim()) return null;
      ids.add(question.id);
      uids.add(question.uid);
      const { id, text, ...metadata } = question;
      if (byId.has(id)) {
        const { id: originalId, text: originalText, ...originalMetadata } = byId.get(id);
        if (JSON.stringify(metadata) !== JSON.stringify(originalMetadata)) return null;
      } else {
        const match = /^(.*_)(\d+)$/.exec(id);
        // New entries must match the complete metadata of a known template.
        const validTemplate = originals.some((q) => {
          const { id: _id, text: _text, uid: _uid, ...rest } = q;
          const { uid: _newUid, ...newMetadata } = metadata;
          return match && q.id.startsWith(match[1]) && JSON.stringify(rest) === JSON.stringify(newMetadata);
        });
        if (!validTemplate) return null;
      }
    }
    if (originals.some((q) => !ids.has(q.id))) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function exportQuestions(document, questions) {
  return JSON.stringify({ ...document, questions }, null, 2) + "\n";
}
