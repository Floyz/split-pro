import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'next-i18next';
import React, { type PropsWithChildren, useCallback, useState } from 'react';
import { toast } from 'sonner';

import { AppDrawer } from '~/components/ui/drawer';
import { Label } from '~/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import {
  DEFAULT_THEME_ACCENT,
  DEFAULT_THEME_MODE,
  THEME_ACCENTS,
  THEME_MODES,
  type ThemeAccent,
  type ThemeMode,
  applyAccent,
  isThemeAccent,
  isThemeMode,
} from '~/lib/theme';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const satisfies Record<ThemeMode, React.ElementType>;

/** Custom fork: lets the user pick colour mode + accent colour, persisted on the user. */
export const ThemePicker: React.FC<PropsWithChildren> = ({ children }) => {
  const { t } = useTranslation();
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const updateUser = api.user.updateUserDetail.useMutation();

  const [accent, setAccent] = useState<ThemeAccent>(() =>
    isThemeAccent(session?.user.themeAccent) ? session.user.themeAccent : DEFAULT_THEME_ACCENT,
  );

  const persist = useCallback(
    async (patch: { themeMode?: ThemeMode; themeAccent?: ThemeAccent }) => {
      try {
        await updateUser.mutateAsync(patch);
        await update({ user: { ...session?.user, ...patch } });
        toast.success(t('account.change_theme_details.messages.theme_changed'), {
          duration: 1500,
        });
      } catch (error) {
        console.error('Error changing theme:', error);
        toast.error(t('errors.theme_change_failed'));
      }
    },
    [session?.user, t, update, updateUser],
  );

  const onModeChange = useCallback(
    (value: string) => {
      // Radix emits an empty string when the active item is clicked again.
      if (!isThemeMode(value)) {
        return;
      }

      setTheme(value);
      void persist({ themeMode: value });
    },
    [persist, setTheme],
  );

  const onAccentChange = useCallback(
    (value: string) => {
      if (!isThemeAccent(value)) {
        return;
      }

      setAccent(value);
      applyAccent(value);
      void persist({ themeAccent: value });
    },
    [persist],
  );

  return (
    <AppDrawer
      trigger={children}
      title={t('account.change_theme_details.title')}
      leftAction={t('actions.close')}
      className="h-[60vh]"
    >
      <div className="flex flex-col gap-8 py-4">
        <div className="flex flex-col gap-3">
          <Label>{t('account.change_theme_details.mode')}</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="lg"
            className="justify-start"
            value={isThemeMode(theme) ? theme : DEFAULT_THEME_MODE}
            onValueChange={onModeChange}
          >
            {THEME_MODES.map((mode) => {
              const Icon = MODE_ICONS[mode];

              return (
                <ToggleGroupItem
                  key={mode}
                  value={mode}
                  aria-label={t(`account.change_theme_details.modes.${mode}`)}
                  className="data-[state=on]:border-primary data-[state=on]:text-primary flex-1 gap-2"
                >
                  <Icon className="size-4" />
                  {t(`account.change_theme_details.modes.${mode}`)}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-3">
          <Label>{t('account.change_theme_details.accent')}</Label>
          <ToggleGroup
            type="single"
            className="justify-start gap-3"
            value={accent}
            onValueChange={onAccentChange}
          >
            {THEME_ACCENTS.map((item) => (
              <ToggleGroupItem
                key={item}
                value={item}
                aria-label={t(`account.change_theme_details.accents.${item}`)}
                title={t(`account.change_theme_details.accents.${item}`)}
                className={cn(
                  'size-10 rounded-full border-2 border-transparent p-0 hover:bg-transparent data-[state=on]:bg-transparent',
                  item === accent && 'border-foreground',
                )}
              >
                <span
                  className="flex size-7 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: `var(--brand-${item})` }}
                >
                  {item === accent ? <Check className="size-4" /> : null}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </AppDrawer>
  );
};
