import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as selectedStyle } from "react-syntax-highlighter/dist/esm/styles/hljs";
import Events from "../../utils/events";
import { CodeActionButton } from "../general/CodeActionButton";
import { ReactComponent as CopyIcon } from "../../assets/copy-icon.svg";
import { useMessageContext } from "../../hooks/useMessageContext";
import { useChatState } from "../../hooks/useChatState";
import { CodeActionsFooter } from "../general/CodeActionsFooter";
import { WrapLinesButton } from "../general/WrapLinesButton";

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
  isClosed: boolean;
};

export function CodeBlock({
  language,
  code,
  isClosed,
}: Props): React.ReactElement {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [wrapLines, setWrapLines] = useState(false);
  const { message } = useMessageContext();
  const { conversationMessages, isBotTyping } = useChatState();
  const [elementWidth, setElementWidth] = useState(0);
  const [showWrapLines, setShowWrapLines] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteCode = isClosed || !isBotTyping;

  useEffect(() => {
    if (!isCompleteCode) {
      return;
    }
    const element = elementRef.current;

    if (element) {
      setElementWidth(element.clientWidth);
      const resizeObserver = new ResizeObserver((entries) => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        timeoutIdRef.current = setTimeout(() => {
          for (let entry of entries) {
            if (entry.target === element) {
              setElementWidth(entry.contentRect.width);
            }
          }
        }, 100);
      });
      resizeObserver.observe(element);

      return () => {
        resizeObserver.unobserve(element);
      };
    }
  }, [isCompleteCode]);

  useEffect(() => {
    if (!isCompleteCode) {
      return;
    }
    const element = elementRef.current;
    if (element) {
      const preElement = element.querySelector("pre");
      const hasScroll =
        preElement && preElement.scrollWidth > preElement.clientWidth;
      setShowWrapLines(!!hasScroll || wrapLines);
    }
  }, [elementWidth, wrapLines, isCompleteCode]);

  return (
    <CodeContainer>
      <div ref={elementRef}>
        <SyntaxHighlighter
          language={language}
          style={customStyle}
          PreTag={StyledPre}
          wrapLongLines={wrapLines}
        >
          {code}
        </SyntaxHighlighter>
      </div>
      <Space />
      <CodeActionsFooterStyled>
        {(!isBotTyping || isClosed) && (
          <>
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
            {showWrapLines && (
              <WrapLinesButton
                enabled={wrapLines}
                onClick={() => {
                  setWrapLines((value) => !value);
                  Events.sendUserClickedOnWrapLinesEvent(
                    message,
                    conversationMessages,
                    code,
                    wrapLines
                  );
                }}
              />
            )}
          </>
        )}
      </CodeActionsFooterStyled>
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

const CodeActionsFooterStyled = styled(CodeActionsFooter)`
  justify-content: space-between;
`;
