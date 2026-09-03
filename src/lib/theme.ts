export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const THEME_ACCENTS = ['cyan', 'emerald', 'violet', 'amber', 'rose'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ThemeAccent = (typeof THEME_ACCENTS)[number];

export const DEFAULT_THEME_MODE: ThemeMode = 'dark';
export const DEFAULT_THEME_ACCENT: ThemeAccent = 'cyan';

/** Key in localStorage read by the anti-flash script in `_document.tsx`. */
export const ACCENT_STORAGE_KEY = 'splitpro-accent';

/** Values for the `theme-color` meta tag, mirroring `--background` in `globals.css`. */
export const THEME_COLOR_META = {
  light: '#ffffff',
  dark: '#030711',
} as const;

export const isThemeMode = (value?: string | null): value is ThemeMode =>
  THEME_MODES.includes(value as ThemeMode);

export const isThemeAccent = (value?: string | null): value is ThemeAccent =>
  THEME_ACCENTS.includes(value as ThemeAccent);

/** Applies the accent on `<html data-accent>` (consumed by `custom-theme.css`) and remembers it. */
export const applyAccent = (accent: ThemeAccent) => {
  if ('undefined' === typeof document) {
    return;
  }

  document.documentElement.dataset.accent = accent;

  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Storage may be unavailable (private mode); the accent still applies for this session.
  }
};
