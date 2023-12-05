// eslint-disable-next-line max-classes-per-file
import { Disposable } from "vscode";
import EventEmitterBasedState from "./EventEmitterBasedState";
import EventEmitterBasedNonNullState from "./EventEmitterBasedNonNullState";

function deriveState<I, O>(
  state: EventEmitterBasedState<I>,
  mapping: (value: I) => O
): EventEmitterBasedState<O> {
  return new (class extends EventEmitterBasedState<O> implements Disposable {
    useStateDisposabled!: Disposable;

    constructor() {
      super();

      this.useStateDisposabled = state.onChange((inputState) => {
        this.set(mapping(inputState));
      });
    }

    dispose() {
      super.dispose();
      this.useStateDisposabled.dispose();
    }
  })();
}

export function deriveNonNullState<I, O>(
  state: EventEmitterBasedState<I>,
  mapping: (value: I, self: O) => O,
  initailValue: O
): EventEmitterBasedNonNullState<O> {
  return new (class
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
      super.dispose();
      this.useStateDisposabled.dispose();
    }
  })();
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

export type PromiseStateData<T> =
  | { resolved: false; isError: false }
  | { resolved: true; isError: false; data: T }
  | { resolved: true; isError: true; error: unknown };

export function convertPromiseToState<T>(
  promise: Promise<T>
): EventEmitterBasedNonNullState<PromiseStateData<T>> {
  return new (class extends EventEmitterBasedNonNullState<PromiseStateData<T>> {
    constructor() {
      super({ resolved: false, isError: false });

      promise
        .then((data) => {
          this.set({ resolved: true, isError: false, data });
        })
        .catch((error) => {
          this.set({ resolved: true, isError: true, error: error as unknown });
        });
    }
  })();
}

export function triggeredPromiseState<T>(
  toTrigger: () => Promise<T>
): EventEmitterBasedNonNullState<PromiseStateData<T>> & {
  trigger: () => void;
} {
  return new (class extends EventEmitterBasedNonNullState<PromiseStateData<T>> {
    toTrigger = toTrigger;

    toDispose: Disposable | null = null;

    constructor() {
      super({ resolved: false, isError: false });
    }

    trigger() {
      const state = convertPromiseToState(this.toTrigger());

      this.toDispose = Disposable.from(
        state,
        state.onChange((s) => {
          this.set(s);
        })
      );
    }

    dispose(): void {
      super.dispose();
      this.toDispose?.dispose();
    }
  })();
}
