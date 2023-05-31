import React, { useMemo } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { getMessageSegments } from "../utils/message";
import Events from "../utils/events";
import { ChatStyledMessageHeader } from "./ChatStyledMessageHeader";

type Props = {
  text: string;
  isBot: boolean;
};

const customStyle = {
  ...vs2015,
  hljs: {
    ...vs2015["hljs"],
    fontSize: "0.85rem",
  },
};

export function ChatStyledMessage({
  text,
  isBot,
  ...props
}: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper {...props}>
      {textSegments.length > 0 && (
        <MessageContainer isBot={isBot}>
          <ChatStyledMessageHeader isBot={isBot} text={text} />
          {textSegments.map((segment) => {
            if (segment.kind === "text") {
              return <span key={segment.text}>{segment.text}</span>;
            }
            return (
              <CodeContainer>
                <SyntaxHighlighter
                  key={segment.text}
                  language={segment.language}
                  style={customStyle}
                  PreTag={StyledPre}
                >
                  {segment.text}
                </SyntaxHighlighter>
                <CopyButtonContainer>
                  <CopyButton
                    onClick={() => {
                      Events.sendUserClickedOnCopyEvent(text, segment.text);
                      navigator.clipboard.writeText(segment.text);
                    }}
                  >
                    Copy
                  </CopyButton>
                </CopyButtonContainer>
              </CodeContainer>
            );
          })}
        </MessageContainer>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding: 5px 12px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

const MessageContainer = styled.div<{ isBot: boolean }>`
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

const CodeContainer = styled.div`
  margin: 1rem 0;
`;

const StyledPre = styled.pre`
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  margin: 0;

  ::-webkit-scrollbar {
    height: 5px;
  }

  ::-webkit-scrollbar-thumb {
    border-right: 6px transparent solid;
    border-left: 6px transparent solid;
    background-clip: padding-box;
    border-radius: 2px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 0px;
    margin-block: 15px;
  }
`;

const CopyButtonContainer = styled.div`
  background-color: ${vs2015.hljs.background};
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  padding-top: 0.3rem;
`;

const CopyButton = styled.div`
  border-top: solid 1px var(--vscode-list-inactiveSelectionBackground);
  text-align: left;
  color: var(--vscode-inputValidation-infoBorder);
  padding: 0.4rem 1rem;

  &:hover {
    cursor: pointer;
  }

  &:active {
    color: var(--vscode-list-activeSelectionBackground);
  }
`;
