type Response = {
    command: string;
    payload?: unknown;
};
type Handler = (payload?: unknown) => Promise<Response>;

export class EventRegistry {
    private events: { [key: string]: Handler };

    constructor() {
        this.events = {};
    }

    registerEvent(event: string, handler: Handler) {
        this.events[event] = handler;
    }

    async handleEvent(event: string, payload?: unknown): Promise<Response> {
        const handler = this.events[event];
        if (handler) {
            const response = await handler(payload);
            return response;
        }
        throw new Error(`Event: ${event} does not exist in the registry`);
    }
}
