const SESSION_USER_STORAGE_KEY = 'crew_forum_session_user';

// Mentor tip:
// This is pseudo-auth (not real login). It is perfect for student projects
// to model ownership behavior without building a full auth system.
const makeRandomPart = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createRandomUser = () => {
  const seed = makeRandomPart();
  return {
    id: `pilot-${Date.now()}-${makeRandomPart().toLowerCase()}`,
    label: `Pilot-${seed}`,
  };
};

const normalizeLabel = (value) => value.trim().replace(/\s+/g, ' ').slice(0, 30);

export const getOrCreateSessionUser = () => {
  // SSR guard: localStorage exists only in the browser.
  if (typeof window === 'undefined') {
    return createRandomUser();
  }

  const existingRaw = window.localStorage.getItem(SESSION_USER_STORAGE_KEY);

  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      if (existing?.id && existing?.label) {
        return existing;
      }
    } catch {
      // Ignore parse errors and create a fresh ID.
    }
  }

  const nextUser = createRandomUser();
  // Persist once and reuse so the same browser session behaves like one user.
  window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(nextUser));
  return nextUser;
};

export const resetSessionUser = () => {
  // Useful for demos/testing to simulate a different user quickly.
  const nextUser = createRandomUser();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  return nextUser;
};

export const setSessionUserLabel = (nextLabel) => {
  const safeLabel = normalizeLabel(nextLabel ?? '');
  const current = getOrCreateSessionUser();

  const updated = {
    ...current,
    label: safeLabel || current.label,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
};
