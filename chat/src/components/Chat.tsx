import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import { ChatBotMessage } from './ChatBotMessage';
import { ChatInput } from './ChatInput';
import { ChatMessageProps, ChatMessages } from '../types/ChatTypes';
import { ChatMessage } from './ChatMessage';
import Events from '../utils/events';
import { useScrollHandler } from '../hooks/useScrollHandler';
import { ChatBotIsTyping } from './ChatBotIsTyping';

export function Chat(): React.ReactElement {
  const [chatMessages, setChatMessages] = useState<ChatMessages>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useScrollHandler({ onScrollUp: () => setIsScrollLocked(false) });

  const scrollToBottom = () => {
    if (isScrollLocked) {
      messageRef.current?.scrollIntoView(
        {
          behavior: 'auto',
          block: 'end',
        });
    }
  };
  useEffect(() => scrollToBottom, [chatMessages, scrollToBottom]);

  return (
    <Wrapper>
      <ChatMessagesContainer ref={messagesContainerRef}>
        {chatMessages.map(({ text, isBot, timestamp }) => {
          return <ChatMessage key={`${text}-${timestamp}`} text={text} isBot={isBot} />;
        })}
        {isBotTyping &&
          <ChatBotIsTyping
            chatMessages={chatMessages}
            onTextChange={scrollToBottom}
            onFinish={(finalBotResponse) => {
              Events.sendBotSubmittedEvent(finalBotResponse.length);

              setIsBotTyping(false);
              setIsScrollLocked(false);
              setChatMessages([...chatMessages, {
                text: finalBotResponse,
                isBot: true,
                timestamp: Date.now().toString()
              }]);
            }} />
        }
        <ChatBottomBenchmark ref={messageRef} />
      </ChatMessagesContainer>
      <Bottom>
        <ClearChatButton onClick={() => setChatMessages([])}>
          Clear conversation
        </ClearChatButton>
        <ChatInputStyled isDisabled={isBotTyping} onSubmit={async (userText) => {
          Events.sendUserSubmittedEvent(userText.length);
          setIsBotTyping(true);
          setIsScrollLocked(true);

          setChatMessages([...chatMessages, {
            text: userText,
            isBot: false,
            timestamp: Date.now().toString()
          }]);
        }} />
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

const ClearChatButton = styled.button`
  border: none;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  margin: 10px;
  width: 300px;
  height: 30px;
  cursor: pointer;

  &:hover {
    color: var(--vscode-list-focusHighlightForeground);
  }
`;

const ChatInputStyled = styled(ChatInput)`
  height: 100px;
`;

const ChatBottomBenchmark = styled.div``;