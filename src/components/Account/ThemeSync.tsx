import { type Session } from 'next-auth';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import React, { useEffect } from 'react';

import {
  DEFAULT_THEME_ACCENT,
  DEFAULT_THEME_MODE,
  THEME_COLOR_META,
  applyAccent,
  isThemeAccent,
  isThemeMode,
} from '~/lib/theme';

/**
 * Custom fork: pushes the theme stored on the user (DB) into `next-themes` and `<html data-accent>`,
 * and keeps the `theme-color` meta tag in sync with the resolved mode.
 *
 * Only reacts to changes of the persisted values, so a local `setTheme` from the picker is never
 * reverted while the session refreshes.
 */
export const ThemeSync: React.FC<{ user: Session['user'] }> = ({ user }) => {
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setTheme(isThemeMode(user.themeMode) ? user.themeMode : DEFAULT_THEME_MODE);
  }, [user.themeMode, setTheme]);

  useEffect(() => {
    applyAccent(isThemeAccent(user.themeAccent) ? user.themeAccent : DEFAULT_THEME_ACCENT);
  }, [user.themeAccent]);

  return (
    <Head>
      <meta
        name="theme-color"
        content={THEME_COLOR_META['light' === resolvedTheme ? 'light' : 'dark']}
      />
    </Head>
  );
};
