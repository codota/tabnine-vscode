import { useFetchBotResponse } from "../../hooks/useFetchBotResponse";
import { ChatMessages, MessageResponse } from "../../types/ChatTypes";
import { ChatBotQueryData } from "../../hooks/useChatBotQueryData";
import { useEffect } from "react";
import styled from "styled-components";
import { AbstractMessage } from "./AbstractMessage";
import { MessageContextProvider } from "../../hooks/useMessageContext";
import { useConversationContext } from "../../hooks/useConversationContext";

type Props = {
  chatMessages: ChatMessages;
  chatBotQueryData: ChatBotQueryData;
  onTextChange(response: MessageResponse): void;
  onFinish(response: MessageResponse): void;
  onError(response: MessageResponse): void;
};

export function BotIsTypingMessage({
  chatMessages,
  chatBotQueryData,
  onFinish,
  onError,
  onTextChange,
}: Props): React.ReactElement | null {
  const { id: conversationId } = useConversationContext();
  const { data, isLoading, error } = useFetchBotResponse(
    chatMessages,
    chatBotQueryData
  );
  const { messageId } = chatBotQueryData;

  useEffect(() => {
    onTextChange({
      id: messageId,
      content: data,
    });
  }, [messageId, data, onTextChange]);

  useEffect(() => {
    if (error) {
      onError({
        id: messageId,
        content: error,
      });
      return;
    }
  }, [messageId, error, onError]);

  useEffect(() => {
    if (!isLoading) {
      onFinish({
        id: messageId,
        content: data,
      });
      return;
    }
  }, [messageId, isLoading, onFinish]);

  if (error) {
    return null;
  }

  if (!data) {
    return <Loader>...</Loader>;
  }

  return (
    <MessageContextProvider
      message={{ conversationId, text: data, isBot: true }}
    >
      <AbstractMessage />
    </MessageContextProvider>
  );
}

const Loader = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;
