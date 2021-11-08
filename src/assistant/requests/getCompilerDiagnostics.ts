import { request } from "./request";

export default function getCompilerDiagnostics(
  code: string,
  fileName: string
): Promise<string[]> {
  const method = "get_compiler_diagnostics";
  const body = {
    method,
    params: {
      code,
      fileName,
    },
  };
  return request(body) as Promise<string[]>;
}
