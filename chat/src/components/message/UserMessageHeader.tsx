import React, { useMemo } from "react";
import styled from "styled-components";
import { UserBadge } from "../profile/UserBadge";
import { getMessageTimestampFormatted } from "../../utils/message";
import { useMessageContext } from "../../hooks/useMessageContext";

export function UserMessageHeader(): React.ReactElement {
  const {
    message: { timestamp },
  } = useMessageContext();
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
