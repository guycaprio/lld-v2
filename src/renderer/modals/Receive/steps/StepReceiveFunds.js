// @flow

import invariant from "invariant";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { getMainAccount, getAccountName } from "@ledgerhq/live-common/lib/account";
import TrackPage from "~/renderer/analytics/TrackPage";
import { command } from "~/renderer/commands";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { DisconnectedDevice, WrongDeviceForAccount } from "@ledgerhq/errors";
import { Trans } from "react-i18next";
import styled from "styled-components";
import useTheme from "~/renderer/hooks/useTheme";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import { rgba } from "~/renderer/styles/helpers";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import ReadOnlyAddressField from "~/renderer/components/ReadOnlyAddressField";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import LinkShowQRCode from "~/renderer/components/LinkShowQRCode";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import IconShield from "~/renderer/icons/Shield";
import { renderVerifyUnwrapped } from "~/renderer/components/DeviceAction/rendering";
import type { StepProps } from "../Body";
import Modal from "~/renderer/components/Modal";
import ModalBody from "~/renderer/components/Modal/ModalBody";
import QRCode from "~/renderer/components/QRCode";

const Bullet = styled.span`
  font-family: Inter;
  font-weight: bold;
  font-size: 13px;
  color: ${p => p.theme.colors.wallet};
  background-color: ${p => rgba(p.theme.colors.wallet, 0.2)};
  border-radius: 13px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Separator = styled.div`
  border-top: 1px solid #99999933;
  margin: 50px 0;
`;

const QRCodeWrapper = styled.div`
  border: 6px solid white;
`;

const Receive1ShareAddress = ({
  address,
  showQRCodeModal,
}: {
  address: string,
  showQRCodeModal: () => void,
}) => {
  return (
    <>
      <Box horizontal alignItems="center" flow={2} mb={4}>
        <Bullet>1</Bullet>
        <Text style={{ flex: 1 }} ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
          <Trans i18nKey="receive.shareWithSender" />
        </Text>
        <LinkShowQRCode onClick={showQRCodeModal} address={address} />
      </Box>
      <ReadOnlyAddressField address={address} />
    </>
  );
};

const Receive2NoDevice = ({
  onVerify,
  currencyName,
}: {
  onVerify: () => void,
  currencyName: string,
}) => {
  return (
    <>
      <Box horizontal flow={2} mt={2} alignItems="center">
        <Box color="alertRed">
          <IconShield height={32} width={28} />
        </Box>
        <Text fontSize={12} color="alertRed" ff="Inter" style={{ flexShrink: "unset" }}>
          <Trans i18nKey="currentAddress.messageIfSkipped" values={{ currencyName }} />
          <LinkWithExternalIcon
            style={{ display: "inline-flex", marginLeft: "10px" }}
            onClick={() => openURL(urls.recipientAddressInfo)}
            label={<Trans i18nKey="common.learnMore" />}
          />
        </Text>
      </Box>

      <Box pt={4} horizontal justifyContent="center">
        <Button primary onClick={onVerify}>
          <Trans i18nKey="common.verify" />
        </Button>
      </Box>
    </>
  );
};

const Receive2Device = ({
  onVerify,
  currencyName,
  device,
}: {
  onVerify: () => void,
  currencyName: string,
  device: *,
}) => {
  const type = useTheme("colors.palette.type");

  return (
    <>
      <Box horizontal alignItems="center" flow={2}>
        <Bullet>2</Bullet>
        <Text
          style={{ maxWidth: 300 }}
          ff="Inter|SemiBold"
          color="palette.text.shade100"
          fontSize={4}
        >
          <Trans i18nKey="currentAddress.messageIfUnverified" value={{ currencyName }} />
          <LinkWithExternalIcon
            style={{ display: "inline-flex", marginLeft: "10px" }}
            onClick={() => openURL(urls.recipientAddressInfo)}
            label={<Trans i18nKey="common.learnMore" />}
          />
        </Text>
      </Box>

      {renderVerifyUnwrapped({ modelId: device.modelId, type })}
    </>
  );
};

const StepReceiveFunds = ({
  isAddressVerified,
  account,
  parentAccount,
  device,
  onChangeAddressVerified,
  transitionTo,
  onResetSkip,
  verifyAddressError,
  token,
  onClose,
}: StepProps) => {
  const mainAccount = account ? getMainAccount(account, parentAccount) : null;
  invariant(account && mainAccount, "No account given");
  const currencyName = token ? token.name : getAccountName(account);
  const initialDevice = useRef(device);
  const address = mainAccount.freshAddress;
  const [modalVisible, setModalVisible] = useState(false);

  const confirmAddress = useCallback(async () => {
    try {
      if (!device) {
        throw new DisconnectedDevice();
      }
      const { address } = await command("getAddress")({
        derivationMode: mainAccount.derivationMode,
        currencyId: mainAccount.currency.id,
        devicePath: device.path,
        path: mainAccount.freshAddressPath,
        verify: true,
      }).toPromise();
      if (address !== mainAccount.freshAddress) {
        throw new WrongDeviceForAccount(`WrongDeviceForAccount ${mainAccount.name}`, {
          accountName: mainAccount.name,
        });
      }
      onChangeAddressVerified(true);
      transitionTo("receive");
    } catch (err) {
      onChangeAddressVerified(false, err);
    }
  }, [device, mainAccount, transitionTo, onChangeAddressVerified]);

  const onVerify = useCallback(() => {
    // if device has changed since the beginning, we need to re-entry device
    if (device !== initialDevice.current || !isAddressVerified) {
      transitionTo("device");
    }
    onChangeAddressVerified(null);
    onResetSkip();
  }, [device, onChangeAddressVerified, onResetSkip, transitionTo, isAddressVerified]);

  const hideQRCodeModal = useCallback(() => setModalVisible(false), [setModalVisible]);
  const showQRCodeModal = useCallback(() => setModalVisible(true), [setModalVisible]);

  // when address need verification we trigger it on device
  useEffect(() => {
    if (isAddressVerified === null) {
      confirmAddress();
    }
  }, [isAddressVerified, confirmAddress]);

  return (
    <>
      <Box px={2}>
        <TrackPage category="Receive Flow" name="Step 4" />
        {verifyAddressError ? (
          <ErrorDisplay error={verifyAddressError} onRetry={onVerify} />
        ) : isAddressVerified === true ? (
          // Address was confirmed on device! we display a success screen!

          <Box alignItems="center">
            <SuccessDisplay
              title={<Trans i18nKey="receive.successTitle" />}
              description={
                <LinkWithExternalIcon
                  style={{ display: "inline-flex", marginLeft: "10px" }}
                  onClick={() => openURL(urls.recipientAddressInfo)}
                  label={<Trans i18nKey="common.learnMore" />}
                />
              }
            >
              <Box flow={4} pt={4} horizontal justifyContent="center">
                <Button outlineGrey onClick={onVerify}>
                  <Trans i18nKey="common.reverify" />
                </Button>
                <Button primary onClick={onClose}>
                  <Trans i18nKey="common.done" />
                </Button>
              </Box>
            </SuccessDisplay>
          </Box>
        ) : isAddressVerified === false ? (
          // User explicitly bypass device verification (no device)
          <>
            <Receive1ShareAddress address={address} showQRCodeModal={showQRCodeModal} />
            <Separator />
            <Receive2NoDevice onVerify={onVerify} currencyName={currencyName} />
          </>
        ) : device ? (
          // verification with device
          <>
            <Receive1ShareAddress address={address} showQRCodeModal={showQRCodeModal} />
            <Separator />
            <Receive2Device device={device} onVerify={onVerify} currencyName={currencyName} />
          </>
        ) : null // should not happen
        }
      </Box>
      <Modal isOpened={modalVisible} onClose={hideQRCodeModal} centered width={460}>
        <ModalBody
          onClose={hideQRCodeModal}
          render={() => (
            <Box alignItems="center">
              <QRCodeWrapper>
                <QRCode size={211} data={address} />
              </QRCodeWrapper>
              <Box mt={6}>
                <ReadOnlyAddressField address={address} />
              </Box>
            </Box>
          )}
        />
      </Modal>
    </>
  );
};

export default StepReceiveFunds;
