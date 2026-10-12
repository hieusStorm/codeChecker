(() => {
  const $ = (id) => document.getElementById(id);
  const codeEditor = $('codeEditor');
  const inputEditor = $('inputEditor');
  const expectedEditor = $('expectedEditor');
  const testList = $('testList');
  const search = $('testSearch');

  const TEMPLATE = 'function myFunction(a, b) {\n  return a + b;\n}';
  const currentName = new URLSearchParams(location.search).get('codename');

  const snapshot = () => [codeEditor, inputEditor, expectedEditor].map((e) => e.value).join('\u0000');
  let baseline = snapshot();
  const isDirty = () => snapshot() !== baseline;
  window.addEventListener('beforeunload', (e) => {
    if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
  });

  testList.querySelectorAll('.test-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.test === currentName);
  });
  testList.addEventListener('click', (e) => {
    const item = e.target.closest('.test-item');
    if (!item || item.dataset.draft) return;
    e.preventDefault();                       // stops the inner <a> from also navigating
    if (isDirty() && !confirm('You have unsaved changes. Discard them?')) return;
    baseline = snapshot();
    location.href = '/?codename=' + encodeURIComponent(item.dataset.test);
  });

  $('newTestButton').addEventListener('click', () => {
    if (isDirty() && !confirm('You have unsaved changes. Discard them and start a new test?')) return;
    codeEditor.value = TEMPLATE;
    inputEditor.value = '';
    expectedEditor.value = '';
    baseline = snapshot();

    document.querySelector('.page-heading h1').textContent = 'New test';
    document.querySelector('.breadcrumb strong').textContent = 'New test';
    history.replaceState(null, '', '/?new=1');

    testList.querySelectorAll('.test-item').forEach((el) => el.classList.remove('active'));
    testList.querySelector('[data-draft]')?.remove();
    const draft = document.createElement('button');
    draft.type = 'button';
    draft.className = 'test-item active';
    draft.dataset.draft = '1';
    draft.innerHTML = '<span class="test-icon">JS</span><span class="test-copy"><strong>New test (unsaved)</strong></span>';
    testList.prepend(draft);

    codeEditor.focus();
    codeEditor.select();
  });

  const saveStatus = $('saveStatus');
  if (saveStatus) {
    new MutationObserver(() => {
      if (!/saved/i.test(saveStatus.textContent)) return;
      baseline = snapshot();
      const name = (codeEditor.value.split('function ')[1] || '').split('(')[0].trim();
      const known = [...testList.querySelectorAll('.test-item')].some((el) => el.dataset.test === name);
      if (name && !known) location.href = '/?codename=' + encodeURIComponent(name);
    }).observe(saveStatus, { childList: true, characterData: true, subtree: true });
  }

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    testList.querySelectorAll('.test-item:not([data-draft])').forEach((el) => {
      el.hidden = q !== '' && !(el.dataset.test || '').toLowerCase().includes(q);
    });
  });
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) { e.preventDefault(); search.focus(); }
    if (e.key === 'Escape' && document.activeElement === search) {
      search.value = ''; search.dispatchEvent(new Event('input')); search.blur();
    }
  });
})();