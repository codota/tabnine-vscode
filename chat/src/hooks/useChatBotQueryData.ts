import { useEditorContext, EditorContext } from "./useEditorContext";
import { useUserDetails } from "./useUserDetails";

export type ChatBotQueryData = {
  token: string;
  username: string;
  editorContext: EditorContext;
  isEditorContextChanged: boolean;
};

export function useChatBotQueryData(): ChatBotQueryData | null {
  const userDetails = useUserDetails();
  const { editorContext, isEditorContextChanged } = useEditorContext();

  if (!userDetails || !editorContext) {
    return null;
  }

  return {
    token: userDetails.token,
    username: userDetails.username,
    editorContext,
    isEditorContextChanged,
  };
}
