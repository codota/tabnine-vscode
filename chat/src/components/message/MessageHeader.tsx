import React from "react";
import styled from "styled-components";
import { BotMessageHeader } from "./BotMessageHeader";
import { UserMessageHeader } from "./UserMessageHeader";
import { useMessageContext } from "../../hooks/useMessageContext";

export function MessageHeader(): React.ReactElement {
  const { message } = useMessageContext();
  return (
    <Wrapper>
      {message.isBot && <BotMessageHeader />}
      {!message.isBot && <UserMessageHeader />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  margin-bottom: 0.5rem;
`;
