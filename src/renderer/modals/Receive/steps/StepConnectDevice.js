// @flow

import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import DeviceAction from "~/renderer/components/DeviceAction";
import { config } from "~/renderer/components/DeviceAction/actions/app";
import CurrencyDownStatusAlert from "~/renderer/components/CurrencyDownStatusAlert";
import TrackPage from "~/renderer/analytics/TrackPage";

import type { StepProps } from "../Body";
import TokenTips from "../../TokenTips";

export default function StepConnectDevice({
  account,
  parentAccount,
  token,
  transitionTo,
}: StepProps) {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  const tokenCur = (account && account.type === "TokenAccount" && account.token) || token;

  return (
    <>
      {mainAccount ? <CurrencyDownStatusAlert currency={mainAccount.currency} /> : null}
      <DeviceAction
        config={config}
        request={{ account: mainAccount }}
        onSuccess={() => transitionTo("receive")}
      />
      {!tokenCur ? null : <TokenTips token={tokenCur} />}
    </>
  );
}

export function StepConnectDeviceFooter({
  t,
  transitionTo,
  isAppOpened,
  onSkipConfirm,
}: StepProps) {
  return (
    <Box horizontal flow={2}>
      <TrackPage category="Receive Flow" name="Step 2" />
      <Button
        event="Receive Flow Without Device Clicked"
        onClick={() => {
          onSkipConfirm();
          transitionTo("receive");
        }}
      >
        {t("receive.steps.connectDevice.withoutDevice")}
      </Button>
    </Box>
  );
}
