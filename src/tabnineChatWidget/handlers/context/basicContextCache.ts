import { ExtensionContext } from "vscode";
import BasicContext from "./basicContext";

const basicContextCacheKey = "com.tabnine.BasicContextCacheKey";

export type BasicContextCache = {
  save: (basicContext: BasicContext) => void;
  get: () => BasicContext | undefined;
};

export default function getBasicContextCache(
  context: ExtensionContext
): BasicContextCache {
  return {
    save: (basicContext: BasicContext) => {
      void context.globalState.update(basicContextCacheKey, basicContext);
    },
    get: () =>
      context.globalState.get<BasicContext | undefined>(basicContextCacheKey),
  };
}
