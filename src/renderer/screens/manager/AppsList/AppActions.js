// @flow
import React, { useCallback, useMemo, memo } from "react";

import {
  useAppInstallNeedsDeps,
  useAppUninstallNeedsDeps,
} from "@ledgerhq/live-common/lib/apps/react";

import type { App } from "@ledgerhq/live-common/lib/types/manager";
import type { State, Action, InstalledItem } from "@ledgerhq/live-common/lib/apps/types";

import styled from "styled-components";
import { Trans } from "react-i18next";

import Text from "~/renderer/components/Text";
import Tooltip from "~/renderer/components/Tooltip";
import Button from "~/renderer/components/Button";
import Progress from "~/renderer/screens/manager/AppsList/Progress";

import { colors } from "~/renderer/styles/theme";

import IconCheck from "~/renderer/icons/Check";
import IconTrash from "~/renderer/icons/Trash";
import IconArrowDown from "~/renderer/icons/ArrowDown";

const AppActionsWrapper = styled.div`
  display: flex;
  flex: 1;
  min-width: 150px;
  justify-content: flex-end;
  flex-direction: row;
  > *:not(:last-child) {
    margin-right: 10px;
  }
`;

const SuccessInstall = styled.div`
  color: ${p => p.theme.colors.positiveGreen};
  display: flex;
  flex-direction: row;
  padding: 10px 20px;
  > svg {
    padding-right: 5px;
  }
`;

const SuccessUpdate = styled(SuccessInstall)`
  color: ${p => p.theme.colors.palette.primary.main};
`;

type Props = {
  state: State,
  app: App,
  installed: ?InstalledItem,
  dispatch: Action => void,
  appStoreView: boolean,
  onlyUpdate?: boolean,
  forceUninstall?: boolean,
  notEnoughMemoryToInstall: boolean,
  showActions?: boolean,
  progress: number,
  setAppInstallDep?: (*) => void,
  setAppUninstallDep?: (*) => void,
};

// eslint-disable-next-line react/display-name
const AppActions: React$ComponentType<Props> = React.memo(
  ({
    state,
    app,
    installed,
    dispatch,
    forceUninstall,
    appStoreView,
    onlyUpdate,
    notEnoughMemoryToInstall,
    showActions = true,
    progress,
    setAppInstallDep,
    setAppUninstallDep,
  }: Props) => {
    const { name } = app;
    const { installedAvailable, installQueue, uninstallQueue } = state;

    const needsInstallDeps = useAppInstallNeedsDeps(state, app);

    const needsUninstallDeps = useAppUninstallNeedsDeps(state, app);

    const onInstall = useCallback(() => {
      if (needsInstallDeps && setAppInstallDep) setAppInstallDep(needsInstallDeps);
      else dispatch({ type: "install", name });
    }, [dispatch, name, needsInstallDeps, setAppInstallDep]);

    const onUninstall = useCallback(() => {
      if (needsUninstallDeps && setAppUninstallDep) setAppUninstallDep(needsUninstallDeps);
      else dispatch({ type: "uninstall", name });
    }, [dispatch, name, needsUninstallDeps, setAppUninstallDep]);

    const installing = useMemo(() => installQueue.includes(name), [installQueue, name]);
    const uninstalling = useMemo(() => uninstallQueue.includes(name), [uninstallQueue, name]);

    return (
      <AppActionsWrapper>
        {installing || uninstalling ? (
          <Progress installing={installing} uninstalling={uninstalling} progress={progress} />
        ) : (
          showActions && (
            <>
              {appStoreView && installed && installed.updated ? (
                <SuccessInstall>
                  <IconCheck size={16} />
                  <Text ff="Inter|SemiBold" fontSize={4}>
                    <Trans i18nKey="manager.applist.item.installed" />
                  </Text>
                </SuccessInstall>
              ) : null}
              {installed && !installed.updated ? (
                <SuccessUpdate>
                  <Text ff="Inter|SemiBold" fontSize={4}>
                    <Trans i18nKey="manager.applist.item.update" />
                  </Text>
                </SuccessUpdate>
              ) : !installed ? (
                <Tooltip
                  content={
                    notEnoughMemoryToInstall ? (
                      <Trans i18nKey="manager.applist.item.notEnoughSpace" />
                    ) : null
                  }
                >
                  <Button
                    style={{ display: "flex" }}
                    lighterPrimary
                    disabled={notEnoughMemoryToInstall}
                    onClick={notEnoughMemoryToInstall ? null : onInstall}
                    event="Manager Install Click"
                    eventProperties={{
                      appName: name,
                      appVersion: app.version,
                    }}
                  >
                    <IconArrowDown size={14} />
                    <Text style={{ marginLeft: 8 }}>
                      <Trans i18nKey="manager.applist.item.install" />
                    </Text>
                  </Button>
                </Tooltip>
              ) : null}
              {((installed || !installedAvailable) && !appStoreView && !onlyUpdate) ||
              forceUninstall ? (
                <Button
                  style={{ padding: 12 }}
                  onClick={onUninstall}
                  event="Manager Uninstall Click"
                  eventProperties={{
                    appName: name,
                    appVersion: app.version,
                  }}
                >
                  <IconTrash color={colors.grey} size={14} />
                </Button>
              ) : null}
            </>
          )
        )}
      </AppActionsWrapper>
    );
  },
);

export default memo<Props>(AppActions);
