// @flow
import React from "react";
import { Trans } from "react-i18next";
import { createSelector } from "reselect";
import type { OutputSelector } from "reselect";
import { handleActions, createAction } from "redux-actions";
import type { CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import network from "@ledgerhq/live-common/lib/network";

import { urls } from "~/config/urls";
import logger from "~/logger/logger";

import type { State } from ".";

export type CurrencyStatus = {
  id: string, // the currency id
  message: string,
  link: string,
  nonce: number,
  warning?: boolean, // display as a warning
  keepSync?: boolean, // even if something is happening, make live still stay in sync
};

export type CurrenciesStatusState = CurrencyStatus[];

const state: CurrenciesStatusState = [];

const handlers = {
  CURRENCIES_STATUS_SET: (
    state: CurrenciesStatusState,
    { payload }: { payload: CurrenciesStatusState },
  ) => payload,
};

// Actions

const setCurrenciesStatus = createAction("CURRENCIES_STATUS_SET");
export const fetchCurrenciesStatus = () => async (dispatch: *) => {
  try {
    const { data } = await network({
      method: "GET",
      url: process.env.LL_STATUS_ENDPOINT || urls.currenciesStatus,
    });

    const terminatedCurrencies = listSupportedCurrencies()
      .filter(coin => coin.terminated && !data.find(c => c.id === coin.id))
      .map(coin => ({
        id: coin.id,
        nonce: 98,
        message: (
          <Trans
            i18nKey="banners.genericTerminatedCrypto"
            values={{ coinName: coin.name }}
            parent="div"
          />
        ),
        link: (coin.terminated && coin.terminated.link) || "#",
      }));

    if (Array.isArray(data)) {
      dispatch(setCurrenciesStatus(data.concat(terminatedCurrencies)));
    } else {
      setCurrenciesStatus(terminatedCurrencies);
    }
  } catch (err) {
    logger.error(err);
  }
};

// Selectors

export const currenciesStatusSelector = (state: State) => state.currenciesStatus;

// if there is a status, it means that currency is disrupted, the status is returned.
export const currencyDownStatusLocal = (
  currenciesStatus: CurrenciesStatusState,
  currency: CryptoCurrency,
): ?CurrencyStatus => currenciesStatus.find(c => c.id === currency.id);

export const currencyDownStatus: OutputSelector<
  State,
  { currency: CryptoCurrency },
  ?CurrencyStatus,
> = createSelector(
  currenciesStatusSelector,
  (_, { currency }): CryptoCurrency => currency,
  currencyDownStatusLocal,
);

// Exporting reducer

const reducer = handleActions(handlers, state);

export default reducer;
