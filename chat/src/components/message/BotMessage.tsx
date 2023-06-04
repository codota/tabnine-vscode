import { useFetchBotResponse } from "../../hooks/useFetchBotResponse";
import { MessageWrapper } from "./MessageWrapper";
import { ChatMessages } from "../../types/ChatTypes";
import { ChatBotQueryData } from "../../hooks/useChatBotQueryData";
import { useEffect } from "react";
import styled from "styled-components";
import { MessageContent } from "./MessageContent";

type Props = {
  chatMessages: ChatMessages;
  chatBotQueryData: ChatBotQueryData;
  onTextChange(partialBotResponse: string): void;
  onFinish(finalBotResponse: string): void;
  onError(errorText: string): void;
};

export function BotMessage({
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

  return (
    <MessageWrapper isBot>
      <MessageContent isBot text={data} />
    </MessageWrapper>
  );
}

const Loader = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;
