import { useFetchBotResponse } from "../../hooks/useFetchBotResponse";
import { MessageContainer } from "./MessageContainer";
import { ChatMessages } from "../../types/ChatTypes";
import { ChatBotQueryData } from "../../hooks/useChatBotQueryData";
import { useEffect } from "react";
import styled from "styled-components";
import { MessageContent } from "./MessageContent";
import { AbstractMessage } from "./AbstractMessage";

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
  }, [data, isLoading, error]);

  if (error) {
    return null;
  }

  if (!data) {
    return <Loader>...</Loader>;
  }

  return <AbstractMessage message={{ text: data, isBot: true }} />;
}

const Loader = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;
