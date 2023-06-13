import React, { useMemo } from "react";
import styled from "styled-components";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { MessageSegment, getMessageSegments } from "../../utils/messageParser";
import Events from "../../utils/events";
import { MessageHeader } from "./MessageHeader";
import { useMessageContext } from "../../hooks/useMessageContext";
import { BulletItem } from "./BulletItem";
import { BulletNumberItem } from "./BulletNumberItem";
import { useChatState } from "../../hooks/useChatState";
import { CodeBlock } from "./CodeBlock";

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
  const { conversationMessages } = useChatState();
  const { message } = useMessageContext();

  return (
    <span
      onCopy={() => {
        Events.sendUserCopiedTextEvent(
          message,
          conversationMessages,
          window.getSelection()?.toString()
        );
      }}
    >
      {textSegments.map((segment, index) => {
        return (
          <span key={segment.content + index}>
            {(() => {
              switch (segment.type) {
                case "bullet":
                  return <BulletItem text={segment.content} />;
                case "bulletNumber":
                  return (
                    <BulletNumberItem
                      text={segment.content}
                      number={segment.number}
                    />
                  );
                case "highlight":
                  return <Highlight>{segment.content}</Highlight>;
                case "bold":
                  return <b>{segment.content}</b>;
                case "link":
                  return <a href={segment.url}>{segment.content}</a>;
                case "code":
                  return (
                    <CodeBlock
                      language={segment.language}
                      code={segment.content}
                      isClosed={segment.isClosed}
                    />
                  );
                default:
                  return <SimpleText>{segment.content}</SimpleText>;
              }
            })()}
          </span>
        );
      })}
    </span>
  );
}

const Wrapper = styled.div`
  overflow: auto;
  line-height: 1.45;
  font-size: 0.88rem;
`;

const Highlight = styled.span`
  font-family: "Courier New", Courier, monospace;
  padding: 0.1em 0.3em;
  white-space: pre-wrap;
  background-color: ${customStyle.hljs.background};
  color: white;
`;

const SimpleText = styled.span`
  white-space: break-spaces;
`;
