import { EventEmitter } from "vscode";

export class Publisher<T> {
  private innerValue: T;

  emitter: EventEmitter<T> = new EventEmitter<T>();

  constructor(value: T) {
    this.innerValue = value;
  }

  public get value() {
    return this.innerValue;
  }

  public set value(v: T) {
    this.innerValue = v;
    this.emitter.fire(v);
  }
}
