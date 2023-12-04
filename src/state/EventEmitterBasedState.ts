import { Mutex } from "await-semaphore";
import { isEqual } from "underscore";
import { Disposable, EventEmitter } from "vscode";

export default class EventEmitterBasedState<T> implements Disposable {
  private value: T | null = null;

  private eventEmitter = new EventEmitter<T>();

  private asyncValueResolveLock = new Mutex();

  constructor(initialValue: T | null = null) {
    this.value = initialValue;
  }

  get(): T | null {
    return this.value;
  }

  set(newValue: T) {
    const changed = !isEqual(this.value, newValue);
    this.value = newValue;

    if (changed) {
      this.eventEmitter.fire(this.value);
    }
  }

  async asyncSet(resolveValue: () => Promise<T | null>) {
    await this.asyncValueResolveLock.use(async () => {
      const newValue = await resolveValue();

      if (newValue !== null) {
        this.set(newValue);
      }
    });
  }

  onChange(subscription: (newValue: T) => unknown): Disposable {
    if (this.value !== null) {
      subscription(this.value);
    }

    return this.eventEmitter.event(subscription);
  }

  dispose() {
    this.eventEmitter.dispose();
  }
}
