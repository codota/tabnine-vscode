import EventEmitterBasedState from "./EventEmitterBasedState";

export default class EventEmitterBasedNonNullState<
  T
> extends EventEmitterBasedState<T> {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(initialValue: T) {
    super(initialValue);
  }

  get(): T {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return super.get()!;
  }
}
