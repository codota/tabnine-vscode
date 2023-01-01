import { EventEmitter } from "vscode";
import { State } from "../binary/state";

const onStateChangedEmitter = new EventEmitter<State>();

// eslint-disable-next-line import/prefer-default-export
export { onStateChangedEmitter };
