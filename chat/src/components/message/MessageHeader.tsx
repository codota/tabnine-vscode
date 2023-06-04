import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { UserBadge } from "../profile/UserBadge";
import { ChatMessageProps } from "../../types/ChatTypes";
import { getMessageTimestampFormatted } from "../../utils/message";
import { BotMessageHeader } from "./BotMessageHeader";
import { UserMessageHeader } from "./UserMessageHeader";

type Props = {
  message: ChatMessageProps;
};

export function MessageHeader({ message }: Props): React.ReactElement {
  return (
    <Wrapper>
      {message.isBot && <BotMessageHeader message={message} />}
      {!message.isBot && <UserMessageHeader message={message} />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  margin-bottom: 0.5rem;
`;
