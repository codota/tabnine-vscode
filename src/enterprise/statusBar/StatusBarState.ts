import { Disposable } from "vscode";
import EventEmitterBasedNonNullState from "../../state/EventEmitterBasedNonNullState";
import { tabNineProcess } from "../../binary/requests/requests";
import {
  PromiseStateData,
  convertPromiseToState,
  triggeredPromiseState,
  useDerviedState,
} from "../../state/deriveState";
import BINARY_STATE from "../../binary/binaryStateSingleton";
import { rejectOnTimeout } from "../../utils/utils";
import { completionsState } from "../../state/completionsState";
import { isHealthyServer } from "../update/isHealthyServer";
import { UserInfo } from "../requests/UserInfo";
import USER_INFO_STATE from "../lifecycle/UserInfoState";
import calculateStatusBarState, {
  INITIAL_STATE,
  StatusBarStateData,
} from "./calculateStatusBarState";

export default class StatusBarState extends EventEmitterBasedNonNullState<StatusBarStateData> {
  private toDispose: Disposable;

  private processStartedState = triggeredPromiseState(() =>
    rejectOnTimeout(tabNineProcess.onReady, 10_000)
  );

  constructor() {
    super(INITIAL_STATE);

    const serverHealthOnPluginStartState = convertPromiseToState(
      isHealthyServer()
    );

    const startedProcessDisposable = this.processStartedState.onChange(
      (startedState) => {
        this.updateState(
          BINARY_STATE.get()?.cloud_connection_health_status,
          startedState,
          completionsState.value,
          serverHealthOnPluginStartState.get(),
          USER_INFO_STATE.get()
        );
      }
    );
    const serverHealthDisposable = serverHealthOnPluginStartState.onChange(
      (isHealthy) => {
        this.updateState(
          BINARY_STATE.get()?.cloud_connection_health_status,
          this.processStartedState.get(),
          completionsState.value,
          isHealthy,
          USER_INFO_STATE.get()
        );
      }
    );

    this.updateState(
      BINARY_STATE.get()?.cloud_connection_health_status,
      this.processStartedState.get(),
      completionsState.value,
      serverHealthOnPluginStartState.get(),
      USER_INFO_STATE.get()
    );

    const stateDisposable = useDerviedState(
      BINARY_STATE,
      (s) => s.cloud_connection_health_status,
      (cloudConnection) => {
        this.updateState(
          cloudConnection,
          this.processStartedState.get(),
          completionsState.value,
          serverHealthOnPluginStartState.get(),
          USER_INFO_STATE.get()
        );
      }
    );

    const userInfoStateDisposable = USER_INFO_STATE.onChange((userInfo) => {
      this.updateState(
        BINARY_STATE.get()?.cloud_connection_health_status,
        this.processStartedState.get(),
        completionsState.value,
        serverHealthOnPluginStartState.get(),
        userInfo
      );
    });

    completionsState.on("changed", () => {
      this.updateState(
        BINARY_STATE.get()?.cloud_connection_health_status,
        this.processStartedState.get(),
        completionsState.value,
        serverHealthOnPluginStartState.get(),
        USER_INFO_STATE.get()
      );
    });

    this.toDispose = Disposable.from(
      userInfoStateDisposable,
      stateDisposable,
      startedProcessDisposable,
      serverHealthDisposable,
      this.processStartedState
    );
  }

  private updateState(
    cloudConnection: "Ok" | string | undefined | null,
    processStartedState: PromiseStateData<unknown>,
    isCompletionsEnabled: boolean,
    serverHealthOnPluginStart: PromiseStateData<boolean>,
    userInfo: UserInfo | null
  ) {
    this.set(
      calculateStatusBarState(
        cloudConnection,
        processStartedState,
        isCompletionsEnabled,
        serverHealthOnPluginStart,
        userInfo
      )
    );
  }

  startWaitingForProcess() {
    this.processStartedState.trigger();
  }

  dispose(): void {
    super.dispose();
    this.toDispose.dispose();
  }
}
