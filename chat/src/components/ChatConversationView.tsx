import React, { useState } from "react";
import styled from "styled-components";
import { ChatMessage } from "./message/ChatMessage";
import Events from "../utils/events";
import { ChatBotIsTyping } from "./message/ChatBotIsTyping";
import { useChatState } from "../hooks/useChatState";
import { ChatBotErrorMessage } from "./message/ChatBotErrorMessage";

export function ChatConversationView(): React.ReactElement {
  const {
    conversationMessages,
    addMessage,
    isBotTyping,
    setIsBotTyping,
  } = useChatState();
  const [partialBotResponse, setPartialBotResponse] = useState("");
  const [errorText, setErrorText] = useState("");
  return (
    <Wrapper>
      {isBotTyping && (
        <CancelResponseButton
          onClick={() => {
            Events.sendUserCancelledResponseEvent(partialBotResponse);
            setIsBotTyping(false);
            addMessage({
              text: partialBotResponse,
              isBot: true,
              timestamp: Date.now().toString(),
            });
            setPartialBotResponse("");
          }}
        >
          Cancel response
        </CancelResponseButton>
      )}
      <ChatMessagesHolder>
        <>
          {conversationMessages.map(({ text, isBot, timestamp }) => {
            return <ChatMessage key={timestamp} text={text} isBot={isBot} />;
          })}
          {errorText && (
            <ChatBotErrorMessage
              onRegenerate={() => {
                setIsBotTyping(true);
                setErrorText("");
              }}
            />
          )}
        </>
        {isBotTyping && (
          <ChatBotIsTyping
            chatMessages={conversationMessages}
            onTextChange={setPartialBotResponse}
            onFinish={(finalBotResponse) => {
              Events.sendBotSubmittedEvent(finalBotResponse);
              setIsBotTyping(false);
              setPartialBotResponse("");
              addMessage({
                text: finalBotResponse,
                isBot: true,
                timestamp: Date.now().toString(),
              });
            }}
            onError={(errorText) => {
              Events.sendBotResponseErrorEvent(errorText);
              setErrorText(errorText);
              setIsBotTyping(false);
              setPartialBotResponse("");
            }}
          />
        )}
      </ChatMessagesHolder>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  padding-bottom: 0.4rem;
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column-reverse;
  flex-grow: 1;
`;

const ChatMessagesHolder = styled.div``;

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
