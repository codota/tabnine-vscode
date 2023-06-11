import { ChatMessages, MessageResponse } from "../../types/ChatTypes";
import { BotIsTypingMessage } from "./BotIsTypingMessage";
import { useChatBotQueryData } from "../../hooks/useChatBotQueryData";
import { useChatState } from "../../hooks/useChatState";

type Props = {
  chatMessages: ChatMessages;
  onTextChange(response: MessageResponse): void;
  onFinish(response: MessageResponse): void;
  onError(response: MessageResponse): void;
};

export function BotIsTyping({
  chatMessages,
  onFinish,
  onError,
  onTextChange,
}: Props): React.ReactElement | null {
  const chatBotQueryData = useChatBotQueryData();
  const { updateLastMessageWithEditorContext } = useChatState();

  if (!chatBotQueryData) {
    return null;
  }

  if (chatBotQueryData.editorContext) {
    updateLastMessageWithEditorContext(chatBotQueryData.editorContext);
  }

  return (
    <BotIsTypingMessage
      chatMessages={chatMessages}
      chatBotQueryData={chatBotQueryData}
      onFinish={onFinish}
      onError={onError}
      onTextChange={onTextChange}
    />
  );
}
