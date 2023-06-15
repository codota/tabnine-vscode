import { Event, EventEmitter } from "vscode";
import { State } from "../binary/state";

import { BINARY_STATE_POLLING_INTERVAL_MILLISECONDS } from "../globals/consts";
import { getState, tabNineProcess } from "../binary/requests/requests";

export type StateEmitterProps = {
  currentState: State | null | undefined;
  previousState: State | null | undefined;
};

export class StatePoller {
  private currentState: State | null | undefined;
  private previousState: State | null | undefined;
  private stateEmitter = new EventEmitter<StateEmitterProps>();
  private static instance = new StatePoller();
  constructor() {
    void tabNineProcess.onReady.then(async () => {
      this.currentState = await getState();
      setInterval(async () => {
        const thisState = await getState();
        this.previousState = this.currentState;
        this.currentState = thisState;
        this.stateEmitter.fire({
          currentState: this.currentState,
          previousState: this.previousState,
        });
      }, BINARY_STATE_POLLING_INTERVAL_MILLISECONDS);
    });
  }

  static get state(): StateEmitterProps {
    return {
      currentState: StatePoller.instance.currentState,
      previousState: StatePoller.instance.previousState,
    };
  }

  static get event(): Event<StateEmitterProps> {
    return StatePoller.instance.stateEmitter.event;
  }
}
