import { tabNineProcess } from "./requests";

export function startLoginServer(): Promise<string | null | undefined> {
  return tabNineProcess.request(
    {
      StartLoginServer: {},
    },
    5000
  );
}
