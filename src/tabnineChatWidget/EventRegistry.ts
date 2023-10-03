type Handler<RequestPayload = unknown, ResponsePayload = unknown> = (
  payload: RequestPayload
) => Promise<ResponsePayload> | ResponsePayload;

export class EventRegistry {
  // eslint-disable-next-line
  private events: { [key: string]: Handler<any, any> };

  constructor() {
    this.events = {};
  }

  registerEvent<Req, Res>(event: string, handler: Handler<Req, Res>) {
    this.events[event] = handler;
    return this;
  }

  async handleEvent<Req, Res>(
    event: string,
    requestPayload: Req
  ): Promise<Res> {
    const handler = this.events[event] as Handler<Req, Res>;
    if (handler) {
      return handler(requestPayload);
    }
    throw new Error(`Event: ${event} does not exist in the registry`);
  }
}
