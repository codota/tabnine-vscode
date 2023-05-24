import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "../types/ChatTypes";
import { ChatMessage } from "./ChatMessage";
import Events from "../utils/events";
import { ChatBotIsTyping } from "./ChatBotIsTyping";

export function Chat(): React.ReactElement {
  const [chatMessages, setChatMessages] = useState<ChatMessages>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [partialBotResponse, setPartialBotResponse] = useState("");

  return (
    <Wrapper>
      <ChatMessagesContainer>
        <ChatMessagesHolder>
          {chatMessages.map(({ text, isBot, timestamp }) => {
            return <ChatMessage key={timestamp} text={text} isBot={isBot} />;
          })}
          {isBotTyping && (
            <ChatBotIsTyping
              chatMessages={chatMessages}
              onTextChange={setPartialBotResponse}
              onFinish={(finalBotResponse, isError) => {
                if (isError) {
                  Events.sendBotResponseErrorEvent(finalBotResponse);
                } else {
                  Events.sendBotSubmittedEvent(finalBotResponse);
                }

                setIsBotTyping(false);
                setPartialBotResponse("");
                setChatMessages([
                  ...chatMessages,
                  {
                    text: finalBotResponse,
                    isBot: true,
                    timestamp: Date.now().toString(),
                  },
                ]);
              }}
            />
          )}
        </ChatMessagesHolder>
      </ChatMessagesContainer>
      <Bottom>
        {isBotTyping && (
          <CancelResponseButton
            onClick={() => {
              Events.sendUserCancelledResponseEvent(partialBotResponse);
              setIsBotTyping(false);
              setChatMessages([
                ...chatMessages,
                {
                  text: partialBotResponse,
                  isBot: true,
                  timestamp: Date.now().toString(),
                },
              ]);
              setPartialBotResponse("");
            }}
          >
            Cancel response
          </CancelResponseButton>
        )}
        <ClearChatButton
          onClick={() => {
            Events.sendUserCleanedConversationEvent();
            setChatMessages([]);
          }}
        >
          Clear conversation
        </ClearChatButton>
        <ChatInputStyled
          isDisabled={isBotTyping}
          onSubmit={async (userText) => {
            Events.sendUserSubmittedEvent(userText);
            setIsBotTyping(true);
            setChatMessages([
              ...chatMessages,
              {
                text: userText,
                isBot: false,
                timestamp: Date.now().toString(),
              },
            ]);
          }}
        />
      </Bottom>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--vscode-editor-foreground);
  position: relative;
`;

const ChatMessagesContainer = styled.div`
  overflow-y: auto;
  height: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
`;

const ChatMessagesHolder = styled.div``;

const Bottom = styled.div`
  flex-grow: 0;
  width: 100%;
  text-align: left;
`;

const CancelResponseButton = styled.div`
  margin: 10px;
  border: none;
  background-color: transparent;
  color: var(--vscode-editorError-foreground);

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ClearChatButton = styled.div`
  margin: 10px;
  border: none;
  background-color: transparent;
  color: var(--vscode-editor-foreground);

  &:hover {
    cursor: pointer;
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatInputStyled = styled(ChatInput)``;
