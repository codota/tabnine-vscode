import React, { useMemo } from "react";
import styled from "styled-components";
import { ChatConversation } from "../../types/ChatTypes";
import { getMessageTimestampFormatted } from "../../utils/times";

interface Props {
  conversation: ChatConversation;
  onClick: () => void;
}

export const ConversationItem: React.FC<Props> = ({
  conversation,
  onClick,
}) => {
  const formattedTime = useMemo(
    () =>
      getMessageTimestampFormatted(
        conversation.messages[conversation.messages.length - 1].timestamp
      ),
    [conversation]
  );

  return (
    <Wrapper onClick={onClick}>
      <Title>{conversation.messages[0].text}</Title>
      {formattedTime && <Time>{formattedTime}</Time>}
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
