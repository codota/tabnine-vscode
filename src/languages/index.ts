import { getJavaHomePath } from "./java/JavaRuntime";

export function getSDKPath(languageId: string): string | undefined {
  if (languageId === "java") {
    return getJavaHomePath();
  }
  return undefined;
}
