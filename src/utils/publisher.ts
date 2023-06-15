import { EventEmitter } from "vscode";

export class Publisher<T> {
  private _value: T;
  emitter: EventEmitter<T> = new EventEmitter<T>();
  constructor(value: T) {
    this._value = value;
  }
  public get value() {
    return this._value;
  }

  public set value(v: T) {
    this._value = v;
    this.emitter.fire(v);
  }
}
