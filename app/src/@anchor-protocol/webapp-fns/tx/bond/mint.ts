import {
  AddressProvider,
  fabricatebAssetBond,
} from '@anchor-protocol/anchor.js';
import { formatLuna } from '@anchor-protocol/notation';
import { bLuna, Gas, Luna, Rate, u, UST } from '@anchor-protocol/types';
import { demicrofy, formatFluidDecimalPoints } from '@libs/formatter';
import { MantleFetch } from '@libs/mantle';
import {
  pickAttributeValue,
  pickEvent,
  pickRawLog,
  TxResultRendering,
  TxStreamPhase,
} from '@libs/webapp-fns';
import { pipe } from '@rx-stream/pipe';
import { NetworkInfo, TxResult } from '@terra-dev/wallet-types';
import { CreateTxOptions, StdFee } from '@terra-money/terra.js';
import big, { BigSource } from 'big.js';
import { Observable } from 'rxjs';
import {
  TxHelper,
  _postTx,
  _pollTxInfo,
  _createTxOptions,
  _catchTxError,
} from '@libs/webapp-fns/tx/internal';

export function bondMintTx(
  $: Parameters<typeof fabricatebAssetBond>[0] & {
    gasFee: Gas;
    gasAdjustment: Rate<number>;
    fixedGas: u<UST>;
    network: NetworkInfo;
    addressProvider: AddressProvider;
    mantleEndpoint: string;
    mantleFetch: MantleFetch;
    post: (tx: CreateTxOptions) => Promise<TxResult>;
    txErrorReporter?: (error: unknown) => string;
    onTxSucceed?: () => void;
  },
): Observable<TxResultRendering> {
  const helper = new TxHelper({ ...$, txFee: $.fixedGas });

  return pipe(
    _createTxOptions({
      msgs: fabricatebAssetBond($)($.addressProvider),
      fee: new StdFee($.gasFee, $.fixedGas + 'uusd'),
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    ({ value: txInfo }) => {
      const rawLog = pickRawLog(txInfo, 0);

      if (!rawLog) {
        return helper.failedToFindRawLog();
      }

      const fromContract = pickEvent(rawLog, 'from_contract');

      if (!fromContract) {
        return helper.failedToFindEvents('from_contract');
      }

      try {
        const bondedAmount = pickAttributeValue<u<Luna>>(fromContract, 3);

        const mintedAmount = pickAttributeValue<u<bLuna>>(fromContract, 4);

        const exchangeRate =
          bondedAmount &&
          mintedAmount &&
          (big(bondedAmount).div(mintedAmount) as Rate<BigSource> | undefined);

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            bondedAmount && {
              name: 'Bonded Amount',
              value: formatLuna(demicrofy(bondedAmount)) + ' LUNA',
            },
            mintedAmount && {
              name: 'Minted Amount',
              value: formatLuna(demicrofy(mintedAmount)) + ' bLUNA',
            },
            exchangeRate && {
              name: 'Exchange Rate',
              value: formatFluidDecimalPoints(exchangeRate, 6),
            },
            helper.txHashReceipt(),
            helper.txFeeReceipt(),
          ],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    },
  )().pipe(_catchTxError({ helper, ...$ }));
}
