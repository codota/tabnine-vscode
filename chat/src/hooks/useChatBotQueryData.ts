import { useState } from "react";
import { useChatState } from "./useChatState";
import { useEditorContext, EditorContext } from "./useEditorContext";
import { useUserDetails } from "./useUserDetails";
import { v4 as uuidv4 } from "uuid";

export type ChatBotQueryData = {
  token: string;
  username: string;
  conversationId: string;
  messageId: string;
  editorContext?: EditorContext;
};

export function useChatBotQueryData(): ChatBotQueryData | null {
  const userDetails = useUserDetails();
  const { editorContext, isEditorContextChanged } = useEditorContext();
  const { conversationMessages, currentConversation } = useChatState();
  const [messageId] = useState(uuidv4());

  if (!userDetails || !editorContext) {
    return null;
  }

  return {
    token: userDetails.token,
    username: userDetails.username,
    conversationId: currentConversation?.id || "",
    messageId,
    editorContext:
      isEditorContextChanged || conversationMessages.length === 1
        ? editorContext
        : undefined,
  };
}
