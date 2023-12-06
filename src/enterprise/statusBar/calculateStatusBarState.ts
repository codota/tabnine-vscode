import { PromiseStateData } from "../../state/deriveState";
import { Logger } from "../../utils/logger";
import { UserInfo } from "../requests/UserInfo";
import { StatusState } from "./statusAction";

export type StatusBarStateData = {
  type: "loading" | "error" | "warning" | "default";
  command?: StatusState;
  message?: string;
};

export const INITIAL_STATE: StatusBarStateData = {
  type: "loading",
  command: StatusState.WaitingForProcess,
};

export default function calculateStatusBarState(
  cloudConnection: "Ok" | string | undefined | null,
  processStartedState: PromiseStateData<unknown>,
  isCompletionsEnabled: boolean,
  serverHealthOnPluginStart: PromiseStateData<boolean>,
  userInfo: UserInfo | null
): StatusBarStateData {
  if (!processStartedState.resolved) {
    Logger.info("Waiting for process to start...");

    return INITIAL_STATE;
  }

  if (processStartedState.isError) {
    Logger.error("Timedout waiting for Tabnine process to become ready.");

    return {
      type: "error",
      message: "Tabnine failed to start, view logs for more details",
      command: StatusState.ErrorWaitingForProcess,
    };
  }

  if (!serverHealthOnPluginStart.resolved) {
    Logger.info("Waiting for Tabnine server to be ready...");

    return {
      type: "loading",
    };
  }

  if (serverHealthOnPluginStart.isError || !serverHealthOnPluginStart.data) {
    Logger.error("Tabnine server is unhealthy.");

    return {
      type: "error",
      message: "Please set your Tabnine server URL",
      command: StatusState.SetServer,
    };
  }

  if (cloudConnection === undefined || cloudConnection === null) {
    Logger.info("Waiting for Tabnine cloud connection...");

    return {
      type: "loading",
    };
  }

  if (cloudConnection !== "Ok") {
    Logger.warn(
      `Tabnine is not connected to your cloud. Connection status: ${cloudConnection}`
    );

    return {
      type: "warning",
      message: "Connectivity issue - Tabnine is unable to reach the server",
      command: StatusState.ConnectivityIssue,
    };
  }

  if (!isCompletionsEnabled) {
    Logger.debug("Showing completions disabled status.");

    return {
      type: "warning",
      command: StatusState.Ready,
    };
  }

  if (!userInfo) {
    Logger.info("Waiting for user info...");

    return {
      type: "loading",
    };
  }

  if (!userInfo.isLoggedIn) {
    Logger.debug("User is logged out. Showing logged out status.");

    return {
      type: "warning",
      message: "Please sign in to access Tabnine",
      command: StatusState.LogIn,
    };
  }

  if (!userInfo.team) {
    Logger.debug("User is not part of a team. Showing logged out status.");

    return {
      type: "warning",
      message: "You are not part of a team",
      command: StatusState.NotPartOfTheTeam,
    };
  }

  return {
    type: "default",
    command: StatusState.Ready,
  };
}
