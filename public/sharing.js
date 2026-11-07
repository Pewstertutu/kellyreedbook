const origin = 'https://kellyreedbook.netlify.app';
const field = document.getElementById('share-url');
const status = document.getElementById('share-status');
function publicURL() {
  const url = new URL(location.pathname, origin);
  if (location.pathname === '/') {
    const symptom = document.querySelector('.symptom[aria-pressed="true"]')?.dataset.symptom;
    if (symptom) { url.searchParams.set('symptom', symptom); url.hash = 'guide'; }
  }
  return url.href;
}
async function copyLink() {
  if (!field || !status) return;
  field.value = publicURL();
  try { await navigator.clipboard.writeText(field.value); status.textContent = 'Link copied. Your answers are not included.'; }
  catch { field.focus(); field.select(); status.textContent = 'Copy is unavailable. The link is selected; copy it using your browser or keyboard.'; }
}
if (field) {
  field.value = publicURL();
  document.getElementById('symptoms')?.addEventListener('click', () => { field.value = publicURL(); });
  document.getElementById('restart')?.addEventListener('click', () => { field.value = publicURL(); });
  document.getElementById('copy-guide')?.addEventListener('click', copyLink);
  document.getElementById('share-guide')?.addEventListener('click', async () => {
    const url = publicURL(); field.value = url;
    if (!navigator.share) return copyLink();
    try { await navigator.share({ title: 'NoStartPro | Free no-start checks', text: 'A free guide to help narrow down a car no-start symptom and choose a next step.', url }); status.textContent = 'Share dialog opened.'; }
    catch (error) { if (error.name === 'AbortError') { status.textContent = 'Sharing cancelled.'; } else { await copyLink(); } }
  });
}
