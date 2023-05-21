export interface ExtensionMessageEvent extends MessageEvent {
    data: {
        command: string;
        payload?: object;
    };
}