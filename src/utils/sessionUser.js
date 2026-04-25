const SESSION_USER_STORAGE_KEY = 'crew_forum_session_user';

const makeRandomPart = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createRandomUser = () => {
  const seed = makeRandomPart();
  return {
    id: `pilot-${Date.now()}-${makeRandomPart().toLowerCase()}`,
    label: `Pilot-${seed}`,
  };
};

export const getOrCreateSessionUser = () => {
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
  window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(nextUser));
  return nextUser;
};

export const resetSessionUser = () => {
  const nextUser = createRandomUser();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_USER_STORAGE_KEY, JSON.stringify(nextUser));
  }

  return nextUser;
};
