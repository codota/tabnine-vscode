import React, { useMemo } from "react";
import styled from "styled-components";
import { MessageContentType } from "./MessageContent";
import { getMessageSegments } from "../../utils/messageFormatter";

type Props = {
  text: string;
  number: string;
};

export function BulletNumberItem({ text, number }: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper>
      <Bullet>{number}.</Bullet>
      <MessageContentType textSegments={textSegments} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 0.4rem 0 0.4rem 0.4rem;
  display: flex;
`;

const Bullet = styled.div`
  flex-shrink: 0;
  margin-right: 5px;
  font-weight: bold;
`;
