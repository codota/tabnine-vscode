import { request } from "./request";

export default function clearCache(): Promise<string[]> {
  const method = "clear_cache";
  const body = {
    method,
    params: {},
  };

  return request(body) as Promise<string[]>;
}
