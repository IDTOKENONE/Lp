import { Ratio } from '@anchor-protocol/notation';
import big from 'big.js';
import { useAddressProvider } from 'contexts/contract';
import { SAFE_RATIO } from 'env';
import type { ReactNode } from 'react';
import { Consumer, Context, createContext, useContext, useMemo } from 'react';
import {
  Data as MarketOverview,
  useMarketOverview,
} from '../queries/marketOverview';
import { Data as MarketState, useMarketState } from '../queries/marketState';
import {
  Data as MarketUserOverview,
  useMarketUserOverview,
} from '../queries/marketUserOverview';

export interface MarketProviderProps {
  children: ReactNode;
}

export interface Market {
  ready: boolean;
  currentBlock: MarketState['currentBlock'] | undefined;
  marketBalance: MarketState['marketBalance'] | undefined;
  marketState: MarketState['marketState'] | undefined;
  borrowRate: MarketOverview['borrowRate'] | undefined;
  oraclePrice: MarketOverview['oraclePrice'] | undefined;
  overseerWhitelist: MarketOverview['overseerWhitelist'] | undefined;
  loanAmount: MarketUserOverview['loanAmount'] | undefined;
  liability: MarketUserOverview['liability'] | undefined;
  borrowInfo: MarketUserOverview['borrowInfo'] | undefined;
  bLunaMaxLtv: Ratio | undefined;
  bLunaSafeLtv: Ratio | undefined;
  refetch: () => void;
}

// @ts-ignore
const MarketContext: Context<Market> = createContext<Market>();

export function MarketProvider({ children }: MarketProviderProps) {
  const addressProvider = useAddressProvider();

  const {
    data: { currentBlock, marketBalance, marketState },
    refetch: refetchMarketState,
  } = useMarketState();

  const {
    data: { borrowRate, oraclePrice, overseerWhitelist },
    refetch: refetchMarketOverview,
  } = useMarketOverview({ marketBalance, marketState });

  const {
    data: { loanAmount, liability, borrowInfo },
    refetch: refetchMarketUserOverview,
  } = useMarketUserOverview({
    currentBlock,
  });

  const bLunaMaxLtv = useMemo(() => {
    return overseerWhitelist?.elems.find(
      ({ collateral_token }) =>
        collateral_token === addressProvider.bAssetToken('ubluna'),
    )?.ltv;
  }, [addressProvider, overseerWhitelist?.elems]);

  const bLunaSafeLtv = useMemo(() => {
    return bLunaMaxLtv
      ? (big(bLunaMaxLtv).mul(SAFE_RATIO).toString() as Ratio)
      : undefined;
  }, [bLunaMaxLtv]);

  const ready = useMemo(() => {
    return (
      typeof currentBlock === 'number' &&
      !!marketBalance &&
      !!marketState &&
      !!borrowRate &&
      !!oraclePrice &&
      !!overseerWhitelist &&
      !!loanAmount &&
      !!liability &&
      !!borrowInfo &&
      !!bLunaMaxLtv &&
      !!bLunaSafeLtv
    );
  }, [
    currentBlock,
    bLunaMaxLtv,
    bLunaSafeLtv,
    borrowInfo,
    borrowRate,
    liability,
    loanAmount,
    marketBalance,
    marketState,
    oraclePrice,
    overseerWhitelist,
  ]);

  const state = useMemo<Market>(
    () => ({
      ready,
      currentBlock,
      marketBalance,
      marketState,
      borrowRate,
      oraclePrice,
      overseerWhitelist,
      loanAmount,
      liability,
      borrowInfo,
      bLunaMaxLtv,
      bLunaSafeLtv,
      refetch: refetchMarketState,
    }),
    [
      ready,
      currentBlock,
      bLunaMaxLtv,
      bLunaSafeLtv,
      borrowInfo,
      borrowRate,
      liability,
      loanAmount,
      marketBalance,
      marketState,
      oraclePrice,
      overseerWhitelist,
      refetchMarketState,
    ],
  );

  return (
    <MarketContext.Provider value={state}>{children}</MarketContext.Provider>
  );
}

export function useMarket(): Market {
  return useContext(MarketContext);
}

export function useMarketNotNullable(): {
  currentBlock: MarketState['currentBlock'];
  marketBalance: MarketState['marketBalance'];
  marketState: MarketState['marketState'];
  borrowRate: MarketOverview['borrowRate'];
  oraclePrice: MarketOverview['oraclePrice'];
  overseerWhitelist: MarketOverview['overseerWhitelist'];
  loanAmount: MarketUserOverview['loanAmount'];
  liability: MarketUserOverview['liability'];
  borrowInfo: MarketUserOverview['borrowInfo'];
  bLunaMaxLtv: Ratio;
  bLunaSafeLtv: Ratio;
  refetch: () => void;
} {
  const {
    ready,
    currentBlock,
    marketBalance,
    marketState,
    borrowRate,
    oraclePrice,
    overseerWhitelist,
    loanAmount,
    liability,
    borrowInfo,
    bLunaMaxLtv,
    bLunaSafeLtv,
    refetch,
  } = useContext(MarketContext);

  if (
    !ready ||
    typeof currentBlock !== 'number' ||
    !marketBalance ||
    !marketState ||
    !borrowRate ||
    !oraclePrice ||
    !overseerWhitelist ||
    !loanAmount ||
    !liability ||
    !borrowInfo ||
    !bLunaMaxLtv ||
    !bLunaSafeLtv
  ) {
    throw new Error(`Datas can not be undefined`);
  }

  return {
    currentBlock,
    marketBalance,
    marketState,
    borrowRate,
    oraclePrice,
    overseerWhitelist,
    loanAmount,
    liability,
    borrowInfo,
    bLunaMaxLtv,
    bLunaSafeLtv,
    refetch,
  };
}

export const MarketConsumer: Consumer<Market> = MarketContext.Consumer;
