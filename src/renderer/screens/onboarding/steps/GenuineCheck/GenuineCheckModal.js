// @flow

import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";

import Modal, { ModalBody } from "~/renderer/components/Modal";
import DeviceConnect from "~/renderer/components/DeviceConnect";
import { config } from "~/renderer/components/DeviceConnect/configs/manager";

const Container = styled.div`
  min-height: 450px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type Props = {
  isOpened: boolean,
  onClose: () => void,
  onSuccess: () => void,
};

const GenuineCheckModal = ({ isOpened, onClose, onSuccess }: Props) => {
  return (
    <Modal
      isOpened={isOpened}
      onClose={onClose}
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          title={<Trans i18nKey="genuinecheck.modal.title" />}
          render={() => (
            <Container>
              <DeviceConnect config={config} onSuccess={onSuccess} request={null} />
            </Container>
          )}
        />
      )}
    />
  );
};

export default GenuineCheckModal;
