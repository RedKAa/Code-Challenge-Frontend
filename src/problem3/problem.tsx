/* 
Problem 3: Messy React
Link: http://s5tech.notion.site/Problem-3-Messy-React-20bf71f8e9de4228b606f240c446b722
*/
interface WalletBalance {
  currency: string;
  amount: number;
}

// FormattedWalletBalance interface should extend WalletBalance
// then code will be cleaner, easier to read and to maintain later
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}
interface Props extends BoxProps {

}
const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

	const getPriority = (blockchain: any): number => {
      // Using `any` disables type checking; prefer `string` or union type for better safety and clarity.
	  switch (blockchain) {
	    case 'Osmosis':
	        return 100
	    case 'Ethereum':
	      return 50
	    case 'Arbitrum':
	      return 30
	    case 'Zilliqa':
	      return 20
	    case 'Neo':
	      return 20
	    default:
	      return -99
	  }
      // Good use of switch-case, but can be replaced with a lookup map for better scalability
	}

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
		  const balancePriority = getPriority(balance.blockchain); 
          // ❌TypeScript anti-pattern: Incomplete types. 'blockchain' isn’t defined in WalletBalance interface
          // Fix: blockchain: string; // Add blockchain to interface WalletBalance
		  if (lhsPriority > -99) { 
             // ❌Anti-pattern: Undefined or Misused Variable
             // Fix: 'lhsPriority' probably be 'balancePriority'
		     if (balance.amount <= 0) {
                // ❌ Logic issue: balance with priority > -99 but amount <= 0 is returned?
                // 👉 This likely includes zero balances, which should be excluded instead
		       return true;
		     }
		  }
		  return false
		}).sort((lhs: WalletBalance, rhs: WalletBalance) => {
          const leftPriority = getPriority(lhs.blockchain);
		  const rightPriority = getPriority(rhs.blockchain);
		  if (leftPriority > rightPriority) {
		    return -1;
		  } else if (rightPriority > leftPriority) {
		    return 1;
		  }
          // Missing return value when leftPriority == rightPriority
         // Should return 0 in the last else case to avoid unstable sort behavior
    });
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
      // `toFixed()` without arguments returns string with 0 decimals
      // Should specify number of decimals (e.g. `.toFixed(2)`) for consistent formatting
    }
  })

  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow 
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
    // Using `index` as `key` is an anti-pattern in React
    // It causes rendering bugs when list changes (e.g. reorder/add/remove).
    // This breaks React’s reconciliation process, causing unnecessary re-renders
    // or incorrect component state retention (e.g., in controlled inputs, animations).

    // Should use a stable and unique key like `${currency}-${blockchain}`.
    // This helps maintain consistent virtual DOM diffing, avoids stale state issues
  })

  return (
    <div {...rest}>
      {rows}
    </div>
    // Generic <div> without semantic meaning
    // Consider using <section> or <main> for better accessibility and SEO

    // No fallback UI if `rows` is empty or loading
    // Should render message or skeleton for better UX
  )
}