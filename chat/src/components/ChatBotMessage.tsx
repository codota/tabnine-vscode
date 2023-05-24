import { useFetchBotResponse } from "../hooks/useFetchBotResponse";
import { getMessageSegments } from "../utils/message";
import { ChatStyledMessage } from "./ChatStyledMessage";
import { ChatMessages } from "../types/ChatTypes";
import { ChatBotQueryData } from "../hooks/useChatBotQueryData";
import { useEffect } from "react";
import styled from "styled-components";

type Props = {
  chatMessages: ChatMessages;
  chatBotQueryData: ChatBotQueryData;
  onTextChange(partialBotResponse: string): void;
  onFinish(finalBotResponse: string): void;
};

export function ChatBotMessage({
  chatMessages,
  chatBotQueryData,
  onFinish,
  onTextChange,
}: Props): React.ReactElement | null {
  const { data, isLoading, error } = useFetchBotResponse(
    chatMessages,
    chatBotQueryData
  );

  useEffect(() => {
    onTextChange(data);
    if (error) {
      onFinish(error);
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

  const finalText = getMessageSegments(data);

  return (
    <>
      <ChatStyledMessage isBot textSegments={finalText} />
      {!data && <Loader>...</Loader>}
    </>
  );
}

const Loader = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
`;
