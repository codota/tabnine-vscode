import { Disposable } from "vscode";
import EventEmitterBasedState from "./EventEmitterBasedState";

export type DerivedState<T> = Disposable & EventEmitterBasedState<T>;

export default function deriveState<I, O, S extends EventEmitterBasedState<I>>(
  state: S,
  mapping: (value: I) => O
): DerivedState<O> {
  class TempDerivedState
    extends EventEmitterBasedState<O>
    implements Disposable {
    useStateDisposabled!: Disposable;

    constructor() {
      super();

      this.useStateDisposabled = state.useState((inputState) => {
        this.set(mapping(inputState));
      });
    }

    dispose() {
      this.useStateDisposabled.dispose();
    }
  }

  return new TempDerivedState();
}

export function useDerviedState<I, O, S extends EventEmitterBasedState<I>>(
  state: S,
  mapping: (value: I) => O,
  onChange: (newValue: O) => void
): Disposable {
  const derviedState = deriveState(state, mapping);
  const disposable = derviedState.useState(onChange);

  return {
    dispose() {
      derviedState.dispose();
      disposable.dispose();
    },
  };
}
