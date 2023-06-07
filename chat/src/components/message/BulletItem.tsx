import React, { useMemo } from "react";
import styled from "styled-components";
import { MessageContentType } from "./MessageContent";
import { getMessageSegments } from "../../utils/messageFormatter";

type Props = {
  text: string;
};

export function BulletItem({ text }: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper>
      <Bullet />
      <MessageContentType textSegments={textSegments} />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 0.4rem 0 0.4rem 0.4rem;
  display: flex;
`;

const Bullet = styled.div`
  background-color: var(--vscode-editor-foreground);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  margin-right: 5px;
`;
