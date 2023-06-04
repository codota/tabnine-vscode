import React, { useMemo } from "react";
import styled from "styled-components";
import { ChatConversation } from "../../types/ChatTypes";

interface Props {
  conversation: ChatConversation;
  onClick: () => void;
}

export const ConversationItem: React.FC<Props> = ({
  conversation,
  onClick,
}) => {
  const formattedTime = useMemo(() => {
    const conversationTimestamp = Number(
      conversation.messages[conversation.messages.length - 1].timestamp
    );
    const conversationTime = new Date(conversationTimestamp);
    const day = conversationTime.getDate();
    const month = conversationTime.toLocaleString("default", {
      month: "short",
    });
    const year = conversationTime.getFullYear();
    const hours = conversationTime.getHours();
    const minutes = conversationTime.getMinutes().toString().padStart(2, "0");
    return `${day} ${month}, ${year} - ${hours}:${minutes}`;
  }, [conversation]);

  return (
    <Wrapper onClick={onClick}>
      <Title>{conversation.messages[0].text}</Title>
      <Time>{formattedTime}</Time>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-color: #323232;
  transition: all 0.1s ease;

  &:hover {
    background-color: #424243;
  }
`;

const Title = styled.div`
  color: #bbbbbb;
  margin-bottom: 0.2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const Time = styled.div`
  color: #7f7f7f;
`;
