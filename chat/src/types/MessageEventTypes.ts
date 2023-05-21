export interface ExtensionMessageEvent extends MessageEvent {
    data: {
        command: string;
        content?: object;
    };
}