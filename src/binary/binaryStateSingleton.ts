import { Disposable } from "vscode";
import { Mutex } from "await-semaphore";
import EventEmitterBasedState from "../utils/EventEmitterBasedState";
import { State } from "./state";
import { getState, tabNineProcess } from "./requests/requests";
import { Logger } from "../utils/logger";

const SESSION_POLL_INTERVAL = 10_000;

export class BinaryState extends EventEmitterBasedState<State> {
  private updateStateLock = new Mutex();

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

  async checkForUpdates() {
    try {
      await this.updateStateLock.use(async () => {
        const state = await getState();

        if (state) {
          this.set(state);
        }
      });
    } catch (error) {
      Logger.warn("Failed to refetch state", error);
    }
  }
}

const BINARY_STATE = new BinaryState();
export default BINARY_STATE;
