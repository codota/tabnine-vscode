import React, { useState } from "react";
import styled from "styled-components";
import { ChatMessage } from "../components/ChatMessage";
import Events from "../utils/events";
import { ChatBotIsTyping } from "../components/ChatBotIsTyping";
import { useChatState } from "../hooks/useChatState";

export function ChatConversationView(): React.ReactElement {
  const {
    conversationMessages,
    addMessage,
    isBotTyping,
    setIsBotTyping,
  } = useChatState();
  const [partialBotResponse, setPartialBotResponse] = useState("");
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
        {conversationMessages.map(({ text, isBot, timestamp }) => {
          return <ChatMessage key={timestamp} text={text} isBot={isBot} />;
        })}
        {isBotTyping && (
          <ChatBotIsTyping
            chatMessages={conversationMessages}
            onTextChange={setPartialBotResponse}
            onFinish={(finalBotResponse, isError) => {
              if (isError) {
                Events.sendBotResponseErrorEvent(finalBotResponse);
              } else {
                Events.sendBotSubmittedEvent(finalBotResponse);
              }
              setIsBotTyping(false);
              setPartialBotResponse("");
              addMessage({
                text: finalBotResponse,
                isBot: true,
                timestamp: Date.now().toString(),
              });
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
