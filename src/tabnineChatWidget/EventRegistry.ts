import { ExtensionContext } from "vscode";

let chatEventRegistry: EventRegistry;

type Handler<RequestPayload = unknown, ResponsePayload = unknown> = (
  payload: RequestPayload,
  context?: ExtensionContext
) => Promise<ResponsePayload> | ResponsePayload;

export class EventRegistry {
  // eslint-disable-next-line
  private events: { [key: string]: Handler<any, any> };

  constructor(private context?: ExtensionContext) {
    this.events = {};
  }

  registerEvent<Req, Res>(event: string, handler: Handler<Req, Res>) {
    this.events[event] = handler;
  }

  async handleEvent<Req, Res>(
    event: string,
    requestPayload: Req
  ): Promise<Res> {
    const handler = this.events[event] as Handler<Req, Res>;
    if (handler) {
      return handler(requestPayload, this.context);
    }
    throw new Error(`Event: ${event} does not exist in the registry`);
  }
}

export default function getChatEventRegistry(
  context: ExtensionContext | undefined
): EventRegistry {
  if (!chatEventRegistry) {
    chatEventRegistry = new EventRegistry(context);
  }
  return chatEventRegistry;
}
