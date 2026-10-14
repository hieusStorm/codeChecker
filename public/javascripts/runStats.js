window.saveRunResult = async (passed) => {
  const codeName = new URLSearchParams(location.search).get('codename');
  if (!codeName) return;                 // unsaved test: nothing to update
  try {
    await fetch('/api/runResult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codeName, passed }),
    });
  } catch {}
};