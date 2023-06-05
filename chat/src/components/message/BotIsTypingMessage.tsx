import { useFetchBotResponse } from "../../hooks/useFetchBotResponse";
import { ChatMessages } from "../../types/ChatTypes";
import { ChatBotQueryData } from "../../hooks/useChatBotQueryData";
import { useEffect } from "react";
import styled from "styled-components";
import { AbstractMessage } from "./AbstractMessage";
import { MessageContextProvider } from "../../hooks/useMessageContext";

type Props = {
  chatMessages: ChatMessages;
  chatBotQueryData: ChatBotQueryData;
  onTextChange(partialBotResponse: string): void;
  onFinish(finalBotResponse: string): void;
  onError(errorText: string): void;
};

export function BotIsTypingMessage({
  chatMessages,
  chatBotQueryData,
  onFinish,
  onError,
  onTextChange,
}: Props): React.ReactElement | null {
  const { data, isLoading, error } = useFetchBotResponse(
    chatMessages,
    chatBotQueryData
  );

  useEffect(() => {
    onTextChange(data);
    if (error) {
      onError(error);
      return;
    }
    if (!isLoading) {
      onFinish(data);
      return;
    }
  }, [data, isLoading, error, onTextChange, onError, onFinish]);

  if (error) {
    return null;
  }

  if (!data) {
    return <Loader>...</Loader>;
  }

  return (
    <MessageContextProvider message={{ text: data, isBot: true }}>
      <AbstractMessage />
    </MessageContextProvider>
  );
}

const Loader = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;
