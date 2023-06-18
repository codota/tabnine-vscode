import { useState } from "react";
import { useEditorContext, EditorContext } from "./useEditorContext";
import { useUserDetails } from "./useUserDetails";
import { v4 as uuidv4 } from "uuid";
import { useConversationContext } from "./useConversationContext";

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
  const { id: conversationId, messages } = useConversationContext();
  const [messageId] = useState(uuidv4());

  if (!userDetails || !editorContext) {
    return null;
  }

  return {
    token: userDetails.token,
    username: userDetails.username,
    conversationId,
    messageId,
    editorContext:
      isEditorContextChanged || messages.length === 1
        ? editorContext
        : undefined,
  };
}
