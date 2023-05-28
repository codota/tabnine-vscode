import React, { useMemo, useState } from "react";
import styled from "styled-components";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { getMessageSegments, MessageSegment } from "../utils/message";
import tabnineBotIcon from "../assets/tabnine-bot.png";
import userChatIcon from "../assets/user-chat-icon.png";
import thubmsUpIcon from "../assets/thumbs-up.png";
import thubmsDownIcon from "../assets/thumbs-down.png";
import Events from "../utils/events";

type Props = {
  text: string;
  isBot: boolean;
};

type RankOptions = "up" | "down" | null;

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
}: Props): React.ReactElement | null {
  const [selectedRank, setSelectedRank] = useState<RankOptions>(null);
  const textSegments = useMemo(() => getMessageSegments(text), [text]);

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
                {(!selectedRank || selectedRank === "down") && (
                  <RateIcon
                    selectedRank={selectedRank}
                    onClick={() => {
                      setSelectedRank("down");
                      if (!selectedRank) {
                        Events.sendUserClickThumbsEvent(text, false);
                      }
                    }}
                    src={thubmsDownIcon}
                    alt="Thumbs down"
                  />
                )}
                {(!selectedRank || selectedRank === "up") && (
                  <RateIcon
                    selectedRank={selectedRank}
                    onClick={() => {
                      setSelectedRank("up");
                      if (!selectedRank) {
                        Events.sendUserClickThumbsEvent(text, true);
                      }
                    }}
                    src={thubmsUpIcon}
                    alt="Thumbs up"
                  />
                )}
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
                  <CopyButton
                    onClick={() => {
                      Events.sendUserClickedOnCopyEvent(text);
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
    margin: 0 0.5rem;
  }
`;
const RateIcon = styled.img<{ selectedRank: RankOptions }>`
  &:hover {
    cursor: ${({ selectedRank }) => (!selectedRank ? "pointer" : "initial")};
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
