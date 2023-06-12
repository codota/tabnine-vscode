import React, { useMemo } from "react";
import styled from "styled-components";
import { MessageContentType } from "./MessageContent";
import { getMessageSegments } from "../../utils/messageParser";

type Props = {
  text: string;
};

export function BulletItem({ text }: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper>
      <Bullet />
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
  background-color: var(--vscode-editor-foreground);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  margin-right: 5px;
`;
