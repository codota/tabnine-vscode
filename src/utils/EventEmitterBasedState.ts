import { isEqual } from "underscore";
import { Disposable, EventEmitter } from "vscode";

export default class EventEmitterBasedState<T> {
  private value: T | null = null;

  private eventEmitter = new EventEmitter<T>();

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

  useState(onChange: (newValue: T) => void): Disposable {
    if (this.value !== null) {
      onChange(this.value);
    }

    return this.eventEmitter.event(onChange);
  }
}
