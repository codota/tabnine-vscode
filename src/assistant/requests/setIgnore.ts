import { request } from "./request";

export default function setIgnore(responseId: string): Promise<string[]> {
  const method = "set_ignore";
  const body = {
    method,
    params: {
      responseId,
    },
  };
  return request(body) as Promise<string[]>;
}
