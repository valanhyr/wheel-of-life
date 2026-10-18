import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questionsPath = join(__dirname, '..', 'src', 'data', 'questions.json');
const data = JSON.parse(readFileSync(questionsPath, 'utf8'));

test('every question has required fields', () => {
  for (const q of data.questions) {
    assert.ok(q.id, `Question missing id`);
    assert.ok(q.areaId, `Question ${q.id} missing areaId`);
    assert.ok(q.dimension, `Question ${q.id} missing dimension`);
    assert.ok(q.text, `Question ${q.id} missing text`);
    assert.ok(q.polarity, `Question ${q.id} missing polarity`);
    assert.ok(typeof q.scored === 'boolean', `Question ${q.id} missing scored flag`);
    if (q.scored || q.responseScale === 'priority_1_10') {
      assert.ok(q.responseScale, `Question ${q.id} missing responseScale`);
    } else {
      assert.ok(Array.isArray(q.options) && q.options.length > 0, `Question ${q.id} context missing options`);
    }
  }
});

test('all question IDs are unique', () => {
  const ids = data.questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('all question UIDs are unique', () => {
  const uids = data.questions.map((q) => q.uid);
  assert.equal(new Set(uids).size, uids.length);
});

test('each area has exactly 27 questions (22 scored, 1 priority, 4 context)', () => {
  const areas = {};
  for (const q of data.questions) {
    if (!areas[q.areaId]) {
      areas[q.areaId] = { scored: 0, priority: 0, context: 0 };
    }
    if (q.scored) {
      areas[q.areaId].scored++;
    } else if (q.responseScale === 'priority_1_10') {
      areas[q.areaId].priority++;
    } else {
      areas[q.areaId].context++;
    }
  }
  for (const [areaId, counts] of Object.entries(areas)) {
    assert.equal(counts.scored, 22, `${areaId} should have 22 scored questions`);
    assert.equal(counts.priority, 1, `${areaId} should have 1 priority question`);
    assert.equal(counts.context, 4, `${areaId} should have 4 context questions`);
  }
});

test('scored questions have valid factors', () => {
  for (const q of data.questions) {
    if (q.scored) {
      assert.ok(Array.isArray(q.factors), `Question ${q.id} scored but factors is not array`);
      assert.ok(q.factors.length > 0, `Question ${q.id} scored but has no factors`);
      assert.ok(q.factorWeights, `Question ${q.id} scored but missing factorWeights`);
      for (const f of q.factors) {
        assert.ok(q.factorWeights[f], `Question ${q.id} missing factorWeight for ${f}`);
      }
    }
  }
});

test('non-scored questions have empty factors', () => {
  for (const q of data.questions) {
    if (!q.scored) {
      assert.deepEqual(q.factors, [], `Question ${q.id} not scored but has factors`);
      assert.deepEqual(q.factorWeights, {}, `Question ${q.id} not scored but has factorWeights`);
    }
  }
});

test('all questions have uid', () => {
  for (const q of data.questions) {
    assert.ok(q.uid, `Question ${q.id} missing uid`);
    assert.match(q.uid, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, `Question ${q.id} has invalid uid format`);
  }
});

test('priority questions use priority_1_10 scale', () => {
  for (const q of data.questions) {
    if (q.responseScale === 'priority_1_10') {
      assert.equal(q.scored, false, `Question ${q.id} uses priority scale but is scored`);
    }
  }
});
