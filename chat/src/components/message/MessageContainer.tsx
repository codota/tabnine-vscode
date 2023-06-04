import React from "react";
import styled from "styled-components";
import { useMessageContext } from "../../hooks/useMessageContext";

type Props = {
  children: React.ReactNode;
};

export function MessageContainer({
  children,
  ...props
}: Props): React.ReactElement {
  const { message } = useMessageContext();
  return (
    <Wrapper {...props}>
      <MessageContainerStyled isBot={message.isBot}>
        {children}
      </MessageContainerStyled>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 5px 12px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const MessageContainerStyled = styled.div<{ isBot: boolean }>`
  font-size: 0.85rem;
  line-height: 1.3;
  background-color: ${({ isBot }) =>
    isBot
      ? "var(--vscode-list-inactiveSelectionBackground)"
      : "var(--vscode-list-activeSelectionBackground)"};
  color: var(--vscode-editor-foreground);
  padding: 10px 16px;
  border-radius: 8px;
  min-height: 2rem;
`;
