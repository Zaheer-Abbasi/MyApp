//sessionManager.js
export function clearSessions() {
  localStorage.removeItem('savedSessions');
}

export function getSavedSessions() {
  try {
    return JSON.parse(localStorage.getItem('savedSessions')) || [];
  } catch {
    return [];
  }
}

export function hasSavedSessions() {
  return !!localStorage.getItem('savedSessions');
}
