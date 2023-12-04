import { Disposable } from "vscode";
import EventEmitterBasedState from "../state/EventEmitterBasedState";
import { State } from "./state";
import { getState, tabNineProcess } from "./requests/requests";
import { Logger } from "../utils/logger";
import { BINARY_STATE_POLLING_INTERVAL_MILLISECONDS } from "../globals/consts";

export class BinaryState extends EventEmitterBasedState<State> {
  private intervalDisposable: Disposable | null = null;

  constructor() {
    super();

    let interval: NodeJS.Timeout | undefined;
    void tabNineProcess.onReady.then(() => {
      interval = setInterval(() => {
        void this.checkForUpdates();
      }, BINARY_STATE_POLLING_INTERVAL_MILLISECONDS);
    });

    this.intervalDisposable = new Disposable(() => {
      if (interval) {
        clearInterval(interval);
      }
    });
  }

  private async checkForUpdates() {
    try {
      await this.asyncSet(getStateOrNull);
    } catch (error) {
      Logger.warn("Failed to refetch state", error);
    }
  }

  dispose(): void {
    super.dispose();

    if (this.intervalDisposable) {
      this.intervalDisposable.dispose();
    }
  }
}

async function getStateOrNull() {
  return (await getState()) || null;
}

const BINARY_STATE = new BinaryState();
export default BINARY_STATE;
