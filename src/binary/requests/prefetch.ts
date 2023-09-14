import { tabNineProcess } from "./requests";

export type PrefetchRequest = {
  filename: string;
};

export function prefetch(
  prefetchReuqest: PrefetchRequest
): Promise<void | null | undefined> {
  return tabNineProcess.request<void>({ Prefetch: prefetchReuqest });
}
