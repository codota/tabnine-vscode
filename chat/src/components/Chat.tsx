import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "../types/ChatTypes";
import { ChatMessage } from "./ChatMessage";
import Events from "../utils/events";
import { useScrollHandler } from "../hooks/useScrollHandler";
import { ChatBotIsTyping } from "./ChatBotIsTyping";

export function Chat(): React.ReactElement {
  const [chatMessages, setChatMessages] = useState<ChatMessages>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [partialBotResponse, setPartialBotResponse] = useState("");
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useScrollHandler({
    onScrollUp: () => setIsScrollLocked(false),
  });

  const scrollToBottom = () => {
    if (isScrollLocked) {
      messageRef.current?.scrollIntoView({
        behavior: "auto",
        block: "end",
      });
    }
  };
  useEffect(() => scrollToBottom, [chatMessages, scrollToBottom]);

  return (
    <Wrapper>
      <ChatMessagesContainer ref={messagesContainerRef}>
        {chatMessages.map(({ text, isBot, timestamp }) => {
          return <ChatMessage key={timestamp} text={text} isBot={isBot} />;
        })}
        {isBotTyping && (
          <ChatBotIsTyping
            chatMessages={chatMessages}
            onTextChange={(partialBotResponse) => {
              setPartialBotResponse(partialBotResponse);
              scrollToBottom();
            }}
            onFinish={(finalBotResponse) => {
              Events.sendBotSubmittedEvent(finalBotResponse.length);

              setIsBotTyping(false);
              setIsScrollLocked(false);
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
        <ChatBottomBenchmark ref={messageRef} />
      </ChatMessagesContainer>
      <Bottom>
        {isBotTyping && (
          <CancelResponseButton
            onClick={() => {
              Events.sendUserCancelledResponseEvent(partialBotResponse.length);
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
        <ClearChatButton onClick={() => setChatMessages([])}>
          Clear conversations
        </ClearChatButton>
        <ChatInputStyled
          isDisabled={isBotTyping}
          onSubmit={async (userText) => {
            Events.sendUserSubmittedEvent(userText.length);
            setIsBotTyping(true);
            setIsScrollLocked(true);
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
`;

const Bottom = styled.div`
  flex-grow: 0;
  width: 100%;
  padding: 10px;
  text-align: center;
`;

const CancelResponseButton = styled.button`
  border: none;
  background-color: var(--vscode-editor-background);
  color: red;
  width: 100%;
  height: 25px;
  cursor: pointer;

  &:hover {
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ClearChatButton = styled.button`
  border: none;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  width: 100%;
  height: 25px;
  cursor: pointer;

  &:hover {
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatInputStyled = styled(ChatInput)`
  height: 100px;
`;

const ChatBottomBenchmark = styled.div``;
