// eslint-disable-next-line max-classes-per-file
import { Disposable } from "vscode";
import EventEmitterBasedState from "./EventEmitterBasedState";
import EventEmitterBasedNonNullState from "./EventEmitterBasedNonNullState";

export type DerivedState<T> = Disposable & EventEmitterBasedState<T>;
export type DerivedNonNullState<T> = Disposable &
  EventEmitterBasedNonNullState<T>;

export default function deriveState<I, O>(
  state: EventEmitterBasedState<I>,
  mapping: (value: I) => O
): DerivedState<O> {
  class TempDerivedState
    extends EventEmitterBasedState<O>
    implements Disposable {
    useStateDisposabled!: Disposable;

    constructor() {
      super();

      this.useStateDisposabled = state.onChange((inputState) => {
        this.set(mapping(inputState));
      });
    }

    dispose() {
      this.useStateDisposabled.dispose();
    }
  }

  return new TempDerivedState();
}

export function deriveNonNullState<I, O>(
  state: EventEmitterBasedState<I>,
  mapping: (value: I, self: O) => O,
  initailValue: O
): DerivedNonNullState<O> {
  class TempDerivedNonNullState
    extends EventEmitterBasedNonNullState<O>
    implements Disposable {
    useStateDisposabled!: Disposable;

    constructor() {
      super(initailValue);

      this.useStateDisposabled = state.onChange((inputState) => {
        this.set(mapping(inputState, this.get()));
      });
    }

    dispose() {
      this.useStateDisposabled.dispose();
    }
  }

  return new TempDerivedNonNullState();
}

export function useDerviedState<I, O>(
  state: EventEmitterBasedState<I>,
  mapping: (value: I) => O,
  onChange: (newValue: O) => void
): Disposable {
  const derviedState = deriveState(state, mapping);
  const disposable = derviedState.onChange(onChange);

  return {
    dispose() {
      derviedState.dispose();
      disposable.dispose();
    },
  };
}
