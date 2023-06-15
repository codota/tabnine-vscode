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

  constructor() {
    void tabNineProcess.onReady.then(() => {
      void getState().then((v) => {
        this.currentState = v;
      });
      setInterval(() => {
        void getState().then((newState) => {
          this.previousState = this.currentState;
          this.currentState = newState;
          this.stateEmitter.fire({
            currentState: this.currentState,
            previousState: this.previousState,
          });
        });
      }, BINARY_STATE_POLLING_INTERVAL_MILLISECONDS);
    });
  }

  get state(): StateEmitterProps {
    return {
      currentState: this.currentState,
      previousState: this.previousState,
    };
  }

  get event(): Event<StateEmitterProps> {
    return this.stateEmitter.event;
  }
}

export const statePoller = new StatePoller();
