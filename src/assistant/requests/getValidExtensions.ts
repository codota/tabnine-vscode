import { request } from "./request";

export default function getValidExtensions(): Promise<string[]> {
  const method = "get_valid_extensions";
  const body = {
    method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}
