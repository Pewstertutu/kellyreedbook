import test from 'node:test';
import assert from 'node:assert/strict';
import { symptoms, nodes, tools } from '../public/diagnostics.js';
import { isValidEvent } from '../lib/validate.js';

test('every symptom and answer path reaches a safe next step, without cycles or missing nodes', () => {
  const visited = new Set();
  function walk(id, path = []) {
    assert.ok(nodes[id], `Missing node: ${id}`);
    assert.ok(!path.includes(id), `Cycle: ${id}`);
    const node = nodes[id]; visited.add(id);
    assert.ok(node.title && node.description);
    if (node.end) return;
    for (const next of [node.yes, node.no, 'unsure']) walk(next, [...path, id]);
  }
  assert.equal(new Set(symptoms.map(s => s.id)).size, 7);
  for (const symptom of symptoms) { walk(symptom.first); for (const tool of symptom.tools) assert.ok(tools[tool]); }
  assert.deepEqual([...visited].sort(), Object.keys(nodes).sort());
});
test('usage endpoint validator allows only known aggregate dimensions and rejects personal data', () => {
  for (const event of ['symptom_selected', 'check_completed', 'flow_completed', 'helpful', 'not_helpful', 'amazon_click']) {
    assert.equal(isValidEvent({ event, symptom: 'single-click' }), true);
  }
  for (const body of [null, [], {}, { event: 'arbitrary', symptom: 'single-click' }, { event: 'helpful', symptom: 'my car' }, { event: 'helpful', symptom: 'single-click', email: 'extra field' }, { event: 'helpful', symptom: 'unselected' }]) {
    assert.equal(isValidEvent(body), false);
  }
  assert.equal(isValidEvent({ event: 'amazon_click', symptom: 'unselected' }), true);
});
