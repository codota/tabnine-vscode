type Handler<requestPayload = unknown, ResponsePayload = unknown> = (
  payload: requestPayload
) => Promise<ResponsePayload>;

export class EventRegistry {
  private events: { [key: string]: Handler<any, any> };

  constructor() {
    this.events = {};
  }

  registerEvent<Req, Res>(event: string, handler: Handler<Req, Res>) {
    this.events[event] = handler;
  }

  async handleEvent<Req, Res>(
    event: string, //command
    requestPayload: Req
  ): Promise<Res> {
    const handler = this.events[event] as Handler<Req, Res>;
    if (handler) {
      return handler(requestPayload);
    }
    throw new Error(`Event: ${event} does not exist in the registry`);
  }
}
