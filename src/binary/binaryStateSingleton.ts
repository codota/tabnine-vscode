import { Disposable } from "vscode";
import EventEmitterBasedState from "../utils/EventEmitterBasedState";
import { State } from "./state";
import { getState, tabNineProcess } from "./requests/requests";
import { Logger } from "../utils/logger";

const SESSION_POLL_INTERVAL = 10_000;

export class BinaryState extends EventEmitterBasedState<State> {
  private intervalDisposabled: Disposable | null = null;

  start(): Disposable {
    if (!this.intervalDisposabled) {
      let interval: NodeJS.Timeout | undefined;
      void tabNineProcess.onReady.then(() => {
        interval = setInterval(() => {
          void this.checkForUpdates();
        }, SESSION_POLL_INTERVAL);
      });

      this.intervalDisposabled = new Disposable(() => {
        if (interval) {
          clearInterval(interval);
        }
      });
    }

    return this.intervalDisposabled;
  }

  private async checkForUpdates() {
    try {
      await this.asyncSet(getStateOrNull);
    } catch (error) {
      Logger.warn("Failed to refetch state", error);
    }
  }
}

async function getStateOrNull() {
  return (await getState()) || null;
}

const BINARY_STATE = new BinaryState();
export default BINARY_STATE;
