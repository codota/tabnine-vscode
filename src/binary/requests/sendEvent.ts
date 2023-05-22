import { tabNineProcess } from "./requests";

export type Event = {
    name: string;
    properties?: { [key: string]: string };
};

export function sendEvent(event: Event): Promise<void | null | undefined> {
    return tabNineProcess.request<void>({Event: event});
}