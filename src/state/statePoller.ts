import { Disposable, Event, EventEmitter } from "vscode";
import { State } from "../binary/state";

import { BINARY_STATE_POLLING_INTERVAL_MILLISECONDS } from "../globals/consts";
import { getState, tabNineProcess } from "../binary/requests/requests";

export type StateEmitterProps = {
  currentState: State | null | undefined;
  previousState: State | null | undefined;
};

export class StatePoller implements Disposable {
  private currentState: State | null | undefined;

  private previousState: State | null | undefined;

  private stateEmitter = new EventEmitter<StateEmitterProps>();

  private interval: NodeJS.Timeout | null = null;

  constructor() {
    void tabNineProcess.onReady.then(() => {
      void getState().then(
        (firstState) => {
          this.currentState = firstState;
          this.interval = setInterval(() => {
            void getState().then(
              (state) => {
                this.previousState = this.currentState;
                this.currentState = state;
                this.stateEmitter.fire({
                  currentState: this.currentState,
                  previousState: this.previousState,
                });
              },
              (error) => console.error(error)
            );
          }, BINARY_STATE_POLLING_INTERVAL_MILLISECONDS as number);
        },
        (error) => console.error(error)
      );
    });
  }

  dispose() {
    if (this.interval) {
      clearInterval(this.interval);
    }
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
