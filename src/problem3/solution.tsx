import React, { useMemo } from 'react';
import { BoxProps } from '@mui/material'; // Assuming you're using MUI
import WalletRow from './WalletRow';
import { useWalletBalances, usePrices } from '../hooks';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

// Priority mapping extracted, should move to another file like config file
const PRIORITY_MAP: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number => PRIORITY_MAP[blockchain] ?? -99;

// Extracted sorting + filtering logic
function getSortedNonZeroBalances(
  balances: WalletBalance[]
): WalletBalance[] {
  return balances
    .filter((b) => getPriority(b.blockchain) > -99 && b.amount > 0)
    .sort((a, b) => getPriority(b.blockchain) - getPriority(a.blockchain));
}

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return getSortedNonZeroBalances(balances);
  }, [balances]);

  const formattedBalances: FormattedWalletBalance[] = sortedBalances.map((b: WalletBalance) => ({
    ...b,
    formatted: b.amount.toFixed(2),
  }));

  const rows = formattedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;

    return (
      <WalletRow
        className={classes.row}
        key={`${balance.currency}-${balance.blockchain}`}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return (
    <section {...rest}>
      {rows.length > 0 ? (
        rows
      ) : (
        <p style={{ padding: '1rem', textAlign: 'center' }}>
          No wallet balances available.
        </p>
      )}
    </section>
  );
};

export default WalletPage;
