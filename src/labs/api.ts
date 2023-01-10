import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 30000,
});

export interface TestEntry {
  text: string;
}

export interface GenTestRequest {
  code: string;
  language?: string;
  filename?: string;
  framework?: string;
}

export type GenTestResponse = {
  tests: TestEntry[];
};

export async function generateTests(
  payload: GenTestRequest
): Promise<GenTestResponse> {
  return (await instance.post<GenTestResponse>("testgen", payload)).data;
}
