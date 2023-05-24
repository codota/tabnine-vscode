import { useEditorContext } from "./useEditorContext";
import { useJwt } from "./useJwt";

export type ChatBotQueryData = {
  token: string;
  editorContext: string;
};

export function useChatBotQueryData(): ChatBotQueryData | null {
  const token = useJwt();
  const [editorContext, isReady] = useEditorContext();

  if (!token || !isReady) {
    return null;
  }

  return {
    token,
    editorContext,
  };
}
