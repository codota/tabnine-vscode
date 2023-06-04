import React, { useMemo } from "react";
import styled from "styled-components";
import { UserBadge } from "../profile/UserBadge";
import { ChatMessageProps } from "../../types/ChatTypes";
import { getMessageTimestampFormatted } from "../../utils/message";

type Props = {
  message: ChatMessageProps;
};

export function UserMessageHeader({
  message: { timestamp },
}: Props): React.ReactElement {
  const formattedTime = useMemo(() => getMessageTimestampFormatted(timestamp), [
    timestamp,
  ]);
  return (
    <Wrapper>
      <UserBadge />
      <Time>{formattedTime}</Time>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Time = styled.div`
  color: #7f7f7f;
`;
