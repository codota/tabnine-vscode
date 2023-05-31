import React, { useMemo } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { getMessageSegments } from "../../utils/message";
import Events from "../../utils/events";
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

export function ChatStyledMessageContent({
  text,
  isBot,
}: Props): React.ReactElement {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper>
      <ChatStyledMessageHeader isBot={isBot} text={text} withThumbs />
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
    </Wrapper>
  );
}

const Wrapper = styled.div``;

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
