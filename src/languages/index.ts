import { getJavaRuntime } from "./java/JavaRuntime";

export function getSDKVersion(languageId: string): string | undefined {
  if (languageId === "java") {
    return getJavaRuntime();
  }
  return undefined;
}
