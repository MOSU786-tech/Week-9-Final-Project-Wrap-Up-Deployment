export const POST_FLAGS = ['Question', 'Opinion', 'Showcase', 'Resource'];

export const FEED_SETTINGS_STORAGE_KEY = 'crew_forum_feed_settings';

export const getDefaultFeedSettings = () => ({
  accentTheme: 'sunrise',
  showContent: true,
  showImage: true,
});

export const loadFeedSettings = () => {
  if (typeof window === 'undefined') {
    return getDefaultFeedSettings();
  }

  const fallback = getDefaultFeedSettings();
  const value = window.localStorage.getItem(FEED_SETTINGS_STORAGE_KEY);

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return {
      accentTheme: ['sunrise', 'teal', 'ember'].includes(parsed?.accentTheme)
        ? parsed.accentTheme
        : fallback.accentTheme,
      showContent: typeof parsed?.showContent === 'boolean' ? parsed.showContent : fallback.showContent,
      showImage: typeof parsed?.showImage === 'boolean' ? parsed.showImage : fallback.showImage,
    };
  } catch {
    return fallback;
  }
};

export const saveFeedSettings = (settings) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(FEED_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const isYouTubeLink = (url = '') => /youtu\.be|youtube\.com/.test(url);

export const toYouTubeEmbed = (url = '') => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    return '';
  } catch {
    return '';
  }
};

export const formatPostTime = (value) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const isPositiveIntegerString = (value) => /^\d+$/.test(String(value).trim());
