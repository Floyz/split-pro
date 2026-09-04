import { ArrowDownLeft, ArrowUpRight, CircleCheck, Wallet } from 'lucide-react';
import React from 'react';

import { HeroCard } from '~/components/HeroCard';
import { useTranslationWithUtils } from '~/hooks/useTranslationWithUtils';
import { isCurrencyCode } from '~/lib/currency';
import { useCurrencyPreferenceStore } from '~/store/currencyPreferenceStore';

import { ConvertibleBalance } from './ConvertibleBalance';

type Balances = { currency: string; amount: bigint }[];

interface BalanceHeroCardProps {
  youOwe?: Balances;
  youGet?: Balances;
  currencies: string[];
}

const AMOUNT_CLASSES = 'flex-wrap text-2xl font-semibold';

/** Custom fork: hero card replacing the plain "Total balance" boxes on the balances page. */
export const BalanceHeroCard: React.FC<BalanceHeroCardProps> = ({
  youOwe = [],
  youGet = [],
  currencies,
}) => {
  const { t } = useTranslationWithUtils();
  const selectedCurrency = useCurrencyPreferenceStore((s) => s.getPreference());
  const forceShowButton = 1 < currencies.length;

  if (0 === youOwe.length && 0 === youGet.length) {
    return (
      <HeroCard icon={CircleCheck} label={t('ui.total_balance')} tone="muted">
        <p className="text-muted-foreground text-2xl font-semibold">{t('ui.settled_up')}</p>
      </HeroCard>
    );
  }

  if (isCurrencyCode(selectedCurrency)) {
    return (
      <HeroCard icon={Wallet} label={t('ui.total_balance')}>
        <ConvertibleBalance
          balances={[...youOwe, ...youGet]}
          showMultiOption
          signed
          className={AMOUNT_CLASSES}
          overrideCurrencies={currencies}
          forceShowButton={forceShowButton}
        />
      </HeroCard>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <HeroCard
        icon={ArrowUpRight}
        label={`${t('actors.you')} ${t('ui.expense.you.lent')}`}
        tone="positive"
      >
        <ConvertibleBalance
          balances={youGet}
          showMultiOption
          className={AMOUNT_CLASSES}
          overrideCurrencies={currencies}
          forceShowButton={forceShowButton}
        />
      </HeroCard>
      <HeroCard
        icon={ArrowDownLeft}
        label={`${t('actors.you')} ${t('ui.expense.you.owe')}`}
        tone="negative"
      >
        <ConvertibleBalance
          balances={youOwe}
          showMultiOption
          className={AMOUNT_CLASSES}
          overrideCurrencies={currencies}
          forceShowButton={forceShowButton}
        />
      </HeroCard>
    </div>
  );
};
