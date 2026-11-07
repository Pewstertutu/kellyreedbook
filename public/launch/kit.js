const status = document.getElementById('kit-status');
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    const field = document.getElementById(button.dataset.copy);
    if (!field?.value) { if (status) status.textContent = 'Create a campaign link first.'; return; }
    try { await navigator.clipboard.writeText(field.value); if (status) status.textContent = 'Copied. Review and personalize before publishing or sending.'; const label = button.textContent; button.textContent = 'Copied'; setTimeout(() => { button.textContent = label; }, 2000); }
    catch { field.focus(); field.select(); if (status) status.textContent = 'Automatic copy is unavailable. The text is selected for manual copying.'; }
  });
}
const form = document.getElementById('campaign-form');
function updateLink() {
  if (!form.reportValidity()) return;
  const target = document.getElementById('destination').value;
  // Destinations come only from the site's fixed list; never accept arbitrary redirects.
  const allowed = Array.from(document.getElementById('destination').options, option => option.value);
  if (!allowed.includes(target) || !target.startsWith('/')) return;
  const url = new URL(target, 'https://kellyreedbook.netlify.app');
  for (const name of ['source', 'medium', 'campaign']) url.searchParams.set(`utm_${name}`, document.getElementById(name).value);
  document.getElementById('campaign-output').value = url.href;
}
form?.addEventListener('submit', event => { event.preventDefault(); updateLink(); if (status) status.textContent = 'Campaign link created. It is not posted or sent automatically.'; });
if (form) updateLink();
document.getElementById('print-flyer')?.addEventListener('click', () => window.print());
