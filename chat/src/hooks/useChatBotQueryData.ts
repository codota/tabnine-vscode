import { useChatState } from "./useChatState";
import { useEditorContext, EditorContext } from "./useEditorContext";
import { useUserDetails } from "./useUserDetails";

export type ChatBotQueryData = {
  token: string;
  username: string;
  editorContext?: EditorContext;
};

export function useChatBotQueryData(): ChatBotQueryData | null {
  const userDetails = useUserDetails();
  const { editorContext, isEditorContextChanged } = useEditorContext();
  const { conversationMessages } = useChatState();

  if (!userDetails || !editorContext) {
    return null;
  }

  return {
    token: userDetails.token,
    username: userDetails.username,
    editorContext:
      isEditorContextChanged || conversationMessages.length === 1
        ? editorContext
        : undefined,
  };
}
