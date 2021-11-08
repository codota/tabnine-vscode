import { request } from "./request";

export default function getValidLanguages(): Promise<string[]> {
  const method = "get_valid_languages";
  const body = {
    method,
    params: {},
  };
  return request(body) as Promise<string[]>;
}
