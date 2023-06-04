import React, { useMemo } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { getMessageSegments } from "../../utils/message";
import Events from "../../utils/events";
import { MessageHeader } from "./MessageHeader";
import { useMessageContext } from "../../hooks/useMessageContext";
import { CodeButton } from "../general/CodeButton";
import { ReactComponent as CopyIcon } from "../../assets/copy-icon.svg";

const customStyle = {
  ...selectedStyle,
  hljs: {
    ...selectedStyle["hljs"],
    fontSize: "0.85rem",
  },
};

export function MessageContent(): React.ReactElement {
  const { message } = useMessageContext();
  const textSegments = useMemo(() => getMessageSegments(message.text), [
    message.text,
  ]);
  return (
    <Wrapper>
      <MessageHeader />
      {textSegments.map((segment) => {
        if (segment.kind === "text") {
          return <span key={segment.text}>{segment.text}</span>;
        }
        return (
          <CodeContainer>
            <SyntaxHighlighter
              key={`${segment.language}-${segment.text}`}
              language={segment.language}
              style={customStyle}
              PreTag={StyledPre}
            >
              {segment.text}
            </SyntaxHighlighter>
            <StyledButton
              caption="Copy"
              onClick={() => {
                Events.sendUserClickedOnCopyEvent(message.text, segment.text);
                navigator.clipboard.writeText(segment.text);
              }}
              icon={<CopyIcon />}
            />
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

const StyledButton = styled(CodeButton)`
  background-color: ${customStyle.hljs.background};
`;
