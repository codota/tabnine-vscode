import React, { useMemo } from "react";
import styled from "styled-components";
import { MessageContentType } from "./MessageContent";
import { getMessageSegments } from "../../utils/messageParser";

type Props = {
  text: string;
  number: string;
};

export function BulletNumberItem({ text, number }: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper>
      <Bullet>{number}.</Bullet>
      <div>
        <MessageContentType textSegments={textSegments} />
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  padding: 0.4rem 0 0.4rem 0.4rem;
`;

const Bullet = styled.div`
  flex-shrink: 0;
  margin-right: 7px;
  font-weight: bold;
  width: 1rem;
  display: flex;
  justify-content: end;
`;
