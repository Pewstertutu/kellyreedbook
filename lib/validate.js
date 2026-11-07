import { symptoms } from '../public/diagnostics.js';
export function isValidEvent(body) {
  return body !== null && typeof body === 'object' && !Array.isArray(body)
    && Object.keys(body).length === 2
    && ['symptom_selected', 'check_completed', 'flow_completed', 'helpful', 'not_helpful', 'amazon_click'].includes(body.event)
    && (symptoms.some((symptom) => symptom.id === body.symptom)
      || (body.event === 'amazon_click' && body.symptom === 'unselected'));
}
