import React, { useState } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Events from "../../utils/events";
import { CodeActionButton } from "../general/CodeActionButton";
import { ReactComponent as CopyIcon } from "../../assets/copy-icon.svg";
import { ReactComponent as BreakCodeLinesIcon } from "../../assets/break-code-lines.svg";
import { useMessageContext } from "../../hooks/useMessageContext";
import { useChatState } from "../../hooks/useChatState";
import { CodeActionsFooter } from "../general/CodeActionsFooter";

const customStyle = {
  ...selectedStyle,
  hljs: {
    ...selectedStyle["hljs"],
    fontSize: "0.85rem",
  },
};

type Props = {
  language: string;
  code: string;
};

export function CodeBlock({ language, code }: Props): React.ReactElement {
  const [wrapLines, setWrapLines] = useState(false);
  const { message } = useMessageContext();
  const { conversationMessages } = useChatState();
  return (
    <CodeContainer>
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        PreTag={StyledPre}
        wrapLongLines={wrapLines}
      >
        {code}
      </SyntaxHighlighter>
      <Space />
      <CodeActionsFooter>
        <CodeActionButton
          caption="Copy"
          onClick={() => {
            Events.sendUserClickedOnCopyEvent(
              message,
              conversationMessages,
              code
            );
            navigator.clipboard.writeText(code);
          }}
          icon={<CopyIcon />}
        />
        <CodeActionButton
          caption="Lines"
          onClick={() => {
            setWrapLines((value) => !value);
            Events.sendUserClickedOnWrapLinesEvent(
              message,
              conversationMessages,
              code,
              wrapLines
            );
          }}
          icon={<BreakCodeLinesIcon />}
        />
      </CodeActionsFooter>
    </CodeContainer>
  );
}

const CodeContainer = styled.div`
  margin: 0.5rem 0 0.2rem;
`;

const StyledPre = styled.pre`
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  margin: 0;

  ::-webkit-scrollbar {
    height: 5px;
  }

  ::-webkit-scrollbar-thumb {
    border-right: 5px transparent solid;
    border-left: 5px transparent solid;
    background-clip: padding-box;
    border-radius: 2px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 0px;
    margin-block: 15px;
  }
`;

const Space = styled.div`
  padding: 3px;
  background-color: ${selectedStyle.hljs.background};
`;
