import React, { useMemo } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { MessageSegment } from "../utils/message";
import tabnineBotIcon from '../assets/tabnine-bot.png';
import userChatIcon from '../assets/user-chat-icon.png';
import thubmsUpIcon from '../assets/thumbs-up.png';
import thubmsDownIcon from '../assets/thumbs-down.png';
import Events from '../utils/events';


type Props = {
  textSegments: MessageSegment[];
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
  textSegments,
  isBot,
  ...props
}: Props): React.ReactElement | null {
  // TODO: add info about every segment to the event
  const messageLength = useMemo(() => textSegments.join("").length, [textSegments]);
  return (
    <Wrapper {...props}>
      {textSegments.length > 0 && (
        <MessageContainer isBot={isBot}>
          {isBot && (
            <BotIndicator>
              <IndicatorText>
                <IconContainer src={tabnineBotIcon} alt="Tabnine Bot" />
                Tabnine chat
              </IndicatorText>
              <RateIconsContainer>
                <RateIcon onClick={() => {
                  Events.sendUserThumbsDownEvent(messageLength);
                }} src={thubmsDownIcon} alt="Thumbs down" />
                <RateIcon onClick={() => {
                  Events.sendUserThumbsUpEvent(messageLength);
                }} src={thubmsUpIcon} alt="Thumbs up" />
              </RateIconsContainer>
            </BotIndicator>
          )}
          {!isBot && (
            <UserIndicator>
              <IndicatorText>
                <IconContainer src={userChatIcon} alt="Tabnine Bot" />
                Me
              </IndicatorText>
            </UserIndicator>
          )}
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
                >
                  {segment.text}
                </SyntaxHighlighter>
                <CopyButtonContainer>
                  <CopyButton onClick={() => {
                    Events.sendUserClickedOnCopyEvent(segment.text.length);
                    navigator.clipboard.writeText(segment.text);
                  }}>Copy</CopyButton>
                </CopyButtonContainer>
              </CodeContainer>
            );
          })}
        </MessageContainer>
      )}
    </Wrapper>
  );
}

const Indicator = styled.div`
  color: var(--vscode-input-placeholderForeground);
  margin-bottom: 10px;
`;

const IconContainer = styled.img`
  margin-right: 6px;
`;

const IndicatorText = styled.div`
  display: flex;
  align-items: center;
`;

const BotIndicator = styled(Indicator)`
  display: flex;
  justify-content: space-between;
`;

const CodeContainer = styled.div``;
const CopyButtonContainer = styled.div`
  text-align: right;
  height: 28px; //TODO fix this
`;
const CopyButton = styled.span`
  color: var(--vscode-inputValidation-infoBorder);
  border: 1px solid var(--vscode-inputValidation-infoBorder);
  padding: 4px 16px;
  border-radius: 9px;
  
  &:hover {
    cursor: pointer;
  }
`;

const UserIndicator = styled(Indicator)``;
const RateIconsContainer = styled.div`
  & > *:not(:last-child) {
    padding: 0 0.5rem;
  }
`;
const RateIcon = styled.img`
  &:hover {
    cursor: pointer;
  }
`;

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
