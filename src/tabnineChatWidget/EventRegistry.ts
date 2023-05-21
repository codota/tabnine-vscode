type Response<T = unknown> = {
    command: string;
    payload: T;
};
type Handler<Req = unknown, Res = unknown> = (payload: Req) => Promise<Response<Res>>;

export class EventRegistry {
    private events: { [key: string]: Handler<any, any> };

    constructor() {
        this.events = {};
    }

    registerEvent<Req, Res>(event: string, handler: Handler<Req, Res>) {
        this.events[event] = handler;
    }

    async handleEvent<Req, Res>(event: string, payload: Req): Promise<Response<Res>> {
        const handler = this.events[event] as Handler<Req, Res>;
        if (handler) {
            return handler(payload);
        }
        throw new Error(`Event: ${event} does not exist in the registry`);
    }
}