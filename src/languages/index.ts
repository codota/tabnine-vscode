import { getJavaHomePath } from "./java/JavaHome";

export function getSDKPath(languageId: string): string | undefined {
  if (languageId === "java") {
    return getJavaHomePath();
  }
  return undefined;
}
