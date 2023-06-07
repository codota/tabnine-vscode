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
      <Content textSegments={textSegments} />
    </Wrapper>
  );
}

type ContentProps = {
  textSegments: MessageSegment[];
};

function Content({ textSegments }: ContentProps): React.ReactElement {
  const { message } = useMessageContext();
  return (
    <>
      {textSegments.map((segment) => {
        switch (segment.kind) {
          case "listStart":
            return <ListStart key={segment.text} />;
          case "listEnd":
            return <ListEnd key={segment.text} />;
          case "textListItem":
            return segment.text ? (
              <ListItem key={segment.text} text={segment.text} />
            ) : (
              <></>
            );
          case "highlight":
            return <Highlight key={segment.text}>{segment.text}</Highlight>;
          case "bold":
            return (
              <>
                <b key={segment.text}>{segment.text}</b>
              </>
            );
          case "code":
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
                    Events.sendUserClickedOnCopyEvent(
                      message.text,
                      segment.text
                    );
                    navigator.clipboard.writeText(segment.text);
                  }}
                  icon={<CopyIcon />}
                />
              </CodeContainer>
            );
          default:
            return <span key={segment.text}>{segment.text}</span>;
        }
      })}
    </>
  );
}

const Wrapper = styled.div``;

const CodeContainer = styled.div`
  margin: 0.5rem 0 1rem;
`;

const Highlight = styled.span`
  font-family: "Courier New", Courier, monospace;
  padding: 0.2em 0.4em;
  font-size: 0.85em;
  white-space: pre-wrap;
  background-color: ${customStyle.hljs.background};
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

const ListStart = styled.div`
  margin-top: 0.5rem;
`;
const ListEnd = styled.div`
  margin-bottom: 0.5rem;
`;
