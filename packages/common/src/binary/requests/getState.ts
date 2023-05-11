import { State } from "./state";
import { tabNineProcess } from "./requests";

export function getState(
  content: Record<string | number | symbol, unknown> = {}
): Promise<State | null | undefined> {
  return tabNineProcess.request<State>({ State: content });
}
