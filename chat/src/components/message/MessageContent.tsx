import React, { useMemo } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";
import {
  MessageSegment,
  getMessageSegments,
} from "../../utils/messageFormatter";
import Events from "../../utils/events";
import { MessageHeader } from "./MessageHeader";
import { useMessageContext } from "../../hooks/useMessageContext";
import { CodeButton } from "../general/CodeButton";
import { ReactComponent as CopyIcon } from "../../assets/copy-icon.svg";
import { ListItem } from "./ListItem";

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
      <MessageContentType textSegments={textSegments} />
    </Wrapper>
  );
}

type MessageContentTypeProps = {
  textSegments: MessageSegment[];
};

export function MessageContentType({
  textSegments,
}: MessageContentTypeProps): React.ReactElement {
  const { message } = useMessageContext();
  return (
    <>
      {textSegments.map((segment, index) => {
        return (
          <span key={segment.content + index}>
            {(() => {
              switch (segment.type) {
                case "bullet":
                  return <ListItem text={segment.content} />;
                case "highlight":
                  return <Highlight>{segment.content}</Highlight>;
                case "bold":
                  return <b>{segment.content}</b>;
                case "code":
                  return (
                    <CodeContainer>
                      <SyntaxHighlighter
                        language={segment.language}
                        style={customStyle}
                        PreTag={StyledPre}
                      >
                        {segment.content}
                      </SyntaxHighlighter>
                      <StyledButton
                        caption="Copy"
                        onClick={() => {
                          Events.sendUserClickedOnCopyEvent(
                            message.text,
                            segment.content
                          );
                          navigator.clipboard.writeText(segment.content);
                        }}
                        icon={<CopyIcon />}
                      />
                    </CodeContainer>
                  );
                default:
                  return <span>{segment.content}</span>;
              }
            })()}
          </span>
        );
      })}
    </>
  );
}

const Wrapper = styled.div``;

const CodeContainer = styled.div`
  margin: 0.5rem 0 0.2rem;
`;

const Highlight = styled.span`
  font-family: "Courier New", Courier, monospace;
  padding: 0.2em 0.4em;
  font-size: 0.85em;
  white-space: pre-wrap;
  background-color: ${customStyle.hljs.background};
  color: white;
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
