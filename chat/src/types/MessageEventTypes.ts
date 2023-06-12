export interface ExtensionMessageEvent<T> extends MessageEvent {
  data: {
    command: string;
    payload?: T;
  };
}
