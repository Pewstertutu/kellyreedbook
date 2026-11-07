import { symptoms, nodes, tools, makeNotes } from './diagnostics.js';
const $ = (id) => document.getElementById(id);
let selected = null;
let current = null;
let history = [];
let answeredFeedback = false;
let completed = false;

async function count(event) {
  if (!$('measurement').checked || navigator.doNotTrack === '1' || (!selected && event !== 'amazon_click')) return;
  try {
    const response = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, symptom: selected?.id ?? 'unselected' }), keepalive: true });
    if (!response.ok) throw new Error('Unavailable');
  } catch {
    $('measurement-status').textContent = 'Usage counting is currently unavailable. The guide still works normally.';
  }
}
function renderTools() {
  $('tool-list').replaceChildren();
  $('tools-intro').textContent = 'For this symptom, these tools may help with a later check. Borrowing a tool or requesting a professional test may be more useful than buying one.';
  for (const id of selected.tools) {
    const tool = tools[id];
    const article = document.createElement('article'); article.className = 'tool';
    const text = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = tool.title;
    const description = document.createElement('p'); description.className = 'small'; description.textContent = tool.description;
    text.append(title, description);
    const link = document.createElement('a'); link.className = 'button secondary'; link.textContent = `${tool.label} ↗`; link.href = tool.url; link.target = '_blank'; link.rel = 'sponsored noopener noreferrer'; link.addEventListener('click', () => count('amazon_click'));
    article.append(text, link); $('tool-list').append(article);
  }
}
function choose(symptom) {
  selected = symptom; current = symptom.first; history = []; answeredFeedback = false; completed = false;
  document.querySelectorAll('.symptom').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.symptom === symptom.id)));
  $('check-panel').hidden = false;
  renderTools(); count('symptom_selected'); render();
}
function answer(value) {
  const node = nodes[current];
  history.push({ key: current, answer: value });
  current = value === 'unsure' ? 'unsure' : node[value];
  count('check_completed'); render();
}
function render() {
  const node = nodes[current];
  $('progress').textContent = `${selected.title} · ${node.end ? 'Checks finished' : `Check ${history.length + 1}`}`;
  $('check-title').textContent = node.end ? 'Your next step' : node.title;
  $('check-description').textContent = node.end ? 'Here’s what your observations suggest doing next.' : node.description;
  $('answers').replaceChildren(); $('result').hidden = !node.end; $('back').hidden = history.length === 0;
  $('feedback-status').textContent = ''; $('feedback').hidden = answeredFeedback;
  if (node.end) {
    $('outcome-title').textContent = node.title; $('outcome-description').textContent = node.description;
    const title = document.createElement('h3'); title.textContent = 'Your observations';
    const list = document.createElement('ul');
    for (const item of history) {
      const li = document.createElement('li'); li.textContent = `${nodes[item.key].title} — ${item.answer === 'yes' ? 'Yes' : item.answer === 'no' ? 'No' : 'Not sure'}`; list.append(li);
    }
    $('summary').replaceChildren(title, list);
    if (!completed) { count('flow_completed'); completed = true; }
  } else {
    for (const [value, label] of [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure / stop here']]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = value === 'unsure' ? 'button secondary' : 'button'; button.textContent = label; button.addEventListener('click', () => answer(value)); $('answers').append(button);
    }
  }
  // Focus makes each new question available to keyboard and screen-reader users.
  $('check-title').focus({ preventScroll: true });
  $('check-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
for (const [index, symptom] of symptoms.entries()) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'symptom'; button.dataset.symptom = symptom.id; button.setAttribute('aria-pressed', 'false'); button.setAttribute('aria-controls', 'check-panel');
  const number = document.createElement('span'); number.className = 'number'; number.textContent = String(index + 1).padStart(2, '0'); number.setAttribute('aria-hidden', 'true');
  const text = document.createElement('span'); const title = document.createElement('strong'); title.textContent = symptom.title; const description = document.createElement('span'); description.className = 'small'; description.textContent = symptom.description; text.append(title, description); button.append(number, text); button.addEventListener('click', () => choose(symptom)); $('symptoms').append(button);
}
$('make').addEventListener('change', () => { $('make-note').textContent = makeNotes[$('make').value]; });
$('restart').addEventListener('click', () => {
  selected = null; current = null; history = []; completed = false; answeredFeedback = false;
  $('check-panel').hidden = true; $('tool-list').replaceChildren(); $('tools-intro').textContent = 'Select a symptom to see relevant options. Start with the free checks above.';
  document.querySelectorAll('.symptom').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  document.querySelector('.symptom').focus();
});
$('back').addEventListener('click', () => { current = history.pop().key; answeredFeedback = false; render(); });
$('print').addEventListener('click', () => window.print());
$('amazon-picks').addEventListener('click', () => count('amazon_click'));
for (const button of document.querySelectorAll('[data-feedback]')) button.addEventListener('click', () => {
  if (answeredFeedback) return;
  answeredFeedback = true; count(button.dataset.feedback); $('feedback').hidden = true;
  $('feedback-status').textContent = button.dataset.feedback === 'helpful' ? 'Thanks. Keep these notes for your next step.' : 'Thanks. If you’re still unsure, save these notes and contact a qualified technician.';
});
$('measurement').addEventListener('change', () => {
  $('measurement-status').textContent = $('measurement').checked ? 'Anonymous usage counts are on for the rest of this visit.' : 'Anonymous usage counts are off.';
});
if (navigator.doNotTrack === '1') {
  $('measurement').disabled = true;
  $('measurement-status').textContent = 'Your browser’s Do Not Track preference is respected. Usage counts are off.';
}
