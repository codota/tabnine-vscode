import { tabNineProcess } from "./requests";

export type EventArgs = {
  name: string;
  [key: string]: unknown;
};

export async function sendEvent(args: EventArgs): Promise<unknown> {
  return tabNineProcess.request({
    Event: { ...args },
  });
}
