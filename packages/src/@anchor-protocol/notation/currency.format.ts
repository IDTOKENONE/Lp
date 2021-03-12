import { MICRO } from '@anchor-protocol/notation/currency';
import {
  ANC,
  AncUstLP,
  aUST,
  bLuna,
  bLunaLunaLP,
  LPToken,
  Luna,
  Token,
  UST,
  uToken,
} from '@anchor-protocol/types';
import big, { BigSource } from 'big.js';
import { formatDemimal, formatInteger } from './unit.format';

// ---------------------------------------------
// render
// ---------------------------------------------
export function mapDecimalPointBaseSeparatedNumbers<T>(
  n: string,
  mapper: (i: string, d: string | undefined) => T,
): T {
  const [i, d] = n.toString().split('.');
  return mapper(i, d);
}

// ---------------------------------------------
// formatters
// ---------------------------------------------
export const d2Formatter = formatDemimal({ decimalPoints: 2, delimiter: true });
export const d3InputFormatter = formatDemimal({
  decimalPoints: 3,
  delimiter: false,
});
export const d3Formatter = formatDemimal({ decimalPoints: 3, delimiter: true });
export const d6InputFormatter = formatDemimal({
  decimalPoints: 6,
  delimiter: false,
});
export const d6Formatter = formatDemimal({ decimalPoints: 6, delimiter: true });
export const iFormatter = formatInteger({ delimiter: true });

// ---------------------------------------------
// constants
// ---------------------------------------------
export const UST_INPUT_MAXIMUM_INTEGER_POINTS = 14;
export const ANC_INPUT_MAXIMUM_INTEGER_POINTS = 14;
export const LUNA_INPUT_MAXIMUM_INTEGER_POINTS = 14;
export const UST_INPUT_MAXIMUM_DECIMAL_POINTS = 3;
export const LUNA_INPUT_MAXIMUM_DECIMAL_POINTS = 6;
export const ANC_INPUT_MAXIMUM_DECIMAL_POINTS = 6;

const M = 1000000;

// ---------------------------------------------
// specific format functions
// ---------------------------------------------
export function formatUSTInput<C extends UST<BigSource> | aUST<BigSource>>(
  n: C,
): C extends UST<BigSource> ? UST : C extends aUST<BigSource> ? aUST : never {
  return d3InputFormatter(n) as any;
}

export function formatLunaInput<C extends Luna<BigSource> | bLuna<BigSource>>(
  n: C,
): C extends Luna<BigSource>
  ? Luna
  : C extends bLuna<BigSource>
  ? bLuna
  : never {
  return d6InputFormatter(n) as any;
}

export function formatANCInput<C extends ANC<BigSource>>(
  n: C,
): C extends ANC<BigSource> ? ANC : never {
  return d6InputFormatter(n) as any;
}

export function formatLPInput<C extends LPToken<BigSource>>(
  n: C,
): C extends AncUstLP<BigSource>
  ? AncUstLP
  : C extends bLunaLunaLP<BigSource>
  ? bLunaLunaLP
  : C extends LPToken<BigSource>
  ? LPToken
  : never {
  return d6InputFormatter(n) as any;
}

export function formatANC(n: ANC<BigSource>): string {
  return d6Formatter(n);
}

export function formatLP(n: LPToken<BigSource>): string {
  return d6Formatter(n);
}

export function formatANCWithPostfixUnits(n: ANC<BigSource>): string {
  const bn = big(n);
  return bn.gte(M) ? d3Formatter(bn.div(M)) + 'M' : formatANC(n);
}

export function formatUST(n: UST<BigSource> | aUST<BigSource>): string {
  return d3Formatter(n);
}

export function formatUSTWithPostfixUnits(
  n: UST<BigSource> | aUST<BigSource>,
): string {
  const bn = big(n);
  return bn.gte(M) ? d2Formatter(bn.div(M)) + 'M' : formatUST(n);
}

export function formatLuna(n: Luna<BigSource> | bLuna<BigSource>): string {
  return d6Formatter(n);
}

export function formatLunaWithPostfixUnits(
  n: Luna<BigSource> | bLuna<BigSource>,
): string {
  const bn = big(n);
  return bn.gte(M) ? d3Formatter(bn.div(M)) + 'M' : d3Formatter(bn);
}

// ---------------------------------------------
// unspecific format functions
// ---------------------------------------------
export function formatUTokenDecimal2(n: uToken<BigSource>): string {
  const bn = big(n).div(MICRO);
  return bn.gte(M) ? d2Formatter(bn.div(M)) + 'M' : d2Formatter(bn);
}

export function formatTokenInteger(n: Token<BigSource>): string {
  return big(n).gte(M) ? iFormatter(n) + 'M' : iFormatter(n);
}

export function formatUTokenInteger(n: uToken<BigSource>): string {
  const bn = big(n).div(MICRO);
  return bn.gte(M) ? iFormatter(bn.div(M)) + 'M' : iFormatter(bn);
}
