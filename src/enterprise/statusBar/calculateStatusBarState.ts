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
    return {
      type: "loading",
    };
  }

  if (serverHealthOnPluginStart.isError || !serverHealthOnPluginStart.data) {
    return {
      type: "error",
      message: "Please set your Tabnine server URL",
      command: StatusState.SetServer,
    };
  }

  if (cloudConnection !== "Ok") {
    return {
      type: "warning",
      message: "Connectivity issue - Tabnine is unable to reach the server",
      command: StatusState.ConnectivityIssue,
    };
  }

  if (!isCompletionsEnabled) {
    return {
      type: "warning",
      command: StatusState.Ready,
    };
  }

  if (!userInfo) {
    return {
      type: "loading",
    };
  }

  if (!userInfo.isLoggedIn) {
    return {
      type: "warning",
      message: "Please sign in to access Tabnine",
      command: StatusState.LogIn,
    };
  }

  if (!userInfo.team) {
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
