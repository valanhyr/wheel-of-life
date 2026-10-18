const weighted = (rows) => rows.length > 0 && rows.every((row) => row.score != null && Number.isFinite(row.weight) && row.weight > 0)
  ? rows.reduce((sum, row) => sum + row.score * row.weight, 0) / rows.reduce((sum, row) => sum + row.weight, 0) : null;

function answerScore(question, raw, scales) {
  const scale = scales[question.responseScale];
  if (raw === undefined || !scale) return null;
  if (scale.options) return scale.options.find((option) => option.value === raw)?.score ?? null;
  if (typeof raw !== "number" || raw < scale.min || raw > scale.max || (raw - scale.min) % scale.step !== 0) return null;
  const score = 10 * (raw - scale.min) / (scale.max - scale.min);
  return scale.invert ? 10 - score : score;
}

function fixtureScore(snapshot, areaId, answers, before) {
  const rule = snapshot.rules[areaId];
  if (!rule || !answers) return null;
  const originals = new Map(before.document.questions.map((q) => [q.uid, q.id]));
  const own = snapshot.document.questions.filter((q) => q.areaId === areaId && q.scored === true);
  const rows = own.map((q) => ({ q, score: answerScore(q, answers[originals.get(q.uid)], snapshot.scales) }));
  if (rows.some(({ score }) => score == null)) return null;
  const dimensions = Object.entries(rule.dimensions).map(([name, config]) => {
    const members = rows.filter(({ q }) => config.question_ids.includes(q.id));
    if (members.length !== config.question_ids.length) return { score: null, weight: rule.dimensionWeights[name] };
    return { score: weighted(members.map(({ q, score }) => ({ score, weight: q.dimensionWeight ?? 1 }))), weight: rule.dimensionWeights[name] };
  });
  return weighted(dimensions);
}

export function questionImpact(before, after, fixtureAnswers = {}) {
  const previous = new Map(before.document.questions.map((q) => [q.uid, q]));
  const next = new Map(after.document.questions.map((q) => [q.uid, q]));
  const added = [], removed = [], renamed = [], changed = [];
  const affected = new Set();
  for (const [uid, q] of next) {
    const old = previous.get(uid);
    if (!old) { added.push(q.id); affected.add(q.areaId); continue; }
    if (old.id !== q.id) renamed.push({ from: old.id, to: q.id });
    if (JSON.stringify(old) !== JSON.stringify(q)) { changed.push(q.id); affected.add(old.areaId); affected.add(q.areaId); }
  }
  for (const [uid, q] of previous) if (!next.has(uid)) { removed.push(q.id); affected.add(q.areaId); }
  const scaleChanges = [];
  for (const key of new Set([...Object.keys(before.scales), ...Object.keys(after.scales)])) {
    if (JSON.stringify(before.scales[key]) === JSON.stringify(after.scales[key])) continue;
    const oldUsers = before.document.questions.filter((q) => q.responseScale === key);
    const newUsers = after.document.questions.filter((q) => q.responseScale === key);
    scaleChanges.push({ key, usersBefore: oldUsers.length, usersAfter: newUsers.length });
    for (const q of [...oldUsers, ...newUsers]) affected.add(q.areaId);
  }
  for (const id of new Set([...Object.keys(before.rules), ...Object.keys(after.rules)])) if (JSON.stringify(before.rules[id]) !== JSON.stringify(after.rules[id])) affected.add(id);
  const fixtures = Object.fromEntries([...affected].map((areaId) => [areaId, {
    before: fixtureScore(before, areaId, fixtureAnswers[areaId], before),
    after: fixtureScore(after, areaId, fixtureAnswers[areaId], before),
  }]));
  return { added, removed, renamed, changed, scaleChanges, areas: [...affected], fixtures };
}
