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
  username?: string;
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
  username,
  ...props
}: Props): React.ReactElement | null {
  const textSegments = useMemo(() => getMessageSegments(text), [text]);
  return (
    <Wrapper {...props}>
      {textSegments.length > 0 && (
        <MessageContainer isBot={isBot}>
          <MessageTopPart isBot={isBot} text={text} username={username} />
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

function MessageTopPart({ isBot, text, username }: Props): React.ReactElement {
  const [selectedThumbs, setSelectedThumbs] = useState<RankOptions>(null);
  return (
    <>
      {isBot && (
        <BotIndicator>
          <IndicatorText>
            <IconContainer src={tabnineBotIcon} alt="Tabnine Bot" />
            Tabnine chat
          </IndicatorText>
          <RateIconsContainer>
            {(!selectedThumbs || selectedThumbs === "down") && (
              <RateIcon
                selectedRank={selectedThumbs}
                onClick={() => {
                  setSelectedThumbs("down");
                  if (!selectedThumbs) {
                    Events.sendUserClickThumbsEvent(text, false);
                  }
                }}
                src={thubmsDownIcon}
                alt="Thumbs down"
              />
            )}
            {(!selectedThumbs || selectedThumbs === "up") && (
              <RateIcon
                selectedRank={selectedThumbs}
                onClick={() => {
                  setSelectedThumbs("up");
                  if (!selectedThumbs) {
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
            <IconContainer src={userChatIcon} alt="Username" />
            {username}
          </IndicatorText>
        </UserIndicator>
      )}
    </>
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
