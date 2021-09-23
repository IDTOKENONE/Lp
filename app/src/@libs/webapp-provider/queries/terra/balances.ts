import { createQueryFn } from '@libs/react-query-utils';
import { terraswap } from '@libs/types';
import { useBrowserInactive } from '@libs/use-browser-inactive';
import {
  TERRA_QUERY_KEY,
  TerraBalances,
  terraBalancesQuery,
} from '@libs/webapp-fns';
import { useTerraWebapp } from '@libs/webapp-provider';
import { useConnectedWallet } from '@terra-dev/use-wallet';
import { useQuery, UseQueryResult } from 'react-query';

const queryFn = createQueryFn(terraBalancesQuery);

export function useTerraBalancesQuery(
  assets: terraswap.AssetInfo[],
): UseQueryResult<TerraBalances | undefined> {
  const { mantleFetch, mantleEndpoint, queryErrorReporter } = useTerraWebapp();

  const connectedWallet = useConnectedWallet();

  const { browserInactive } = useBrowserInactive();

  const result = useQuery(
    [
      TERRA_QUERY_KEY.TERRA_BALANCES,
      connectedWallet?.walletAddress,
      assets,
      mantleEndpoint,
      mantleFetch,
    ],
    queryFn,
    {
      refetchInterval: !!connectedWallet && browserInactive && 1000 * 60 * 5,
      enabled: !browserInactive,
      keepPreviousData: true,
      onError: queryErrorReporter,
    },
  );

  return result;
}
