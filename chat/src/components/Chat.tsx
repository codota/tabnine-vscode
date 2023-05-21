import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import { ChatBotMessage } from './ChatBotMessage';
import { ChatInput } from './ChatInput';
import { ChatMessageProps } from '../types/ChatTypes';
import { ExtensionMessageEvent } from '../types/MessageEventTypes';
import { ChatMessage } from './ChatMessage';
// import { WEBVIEW_COMMANDS } from '../shared';

interface VsCodeApi {
  postMessage(msg: unknown): void;
  setState(state: unknown): void;
  getState(): unknown;
}
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export function Chat(): React.ReactElement {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPosition = useRef(-1);

  const [messages, setMessage] = useState<Array<ChatMessageProps>>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const scrollToBottom = () => {
    if (isScrollLocked) {
      messageRef.current?.scrollIntoView(
        {
          behavior: 'auto',
          block: 'end',
        });
    }
  };
  
  useEffect(() => scrollToBottom, [messages, scrollToBottom]);
  const handleScroll = () => {
    const position = messagesContainerRef.current?.scrollTop;
    if (position) {
      if (position < scrollPosition.current) {
        setIsScrollLocked(false);
      }
      scrollPosition.current = position;
    }
  };
  useEffect(() => {
    messagesContainerRef.current?.addEventListener('scroll', handleScroll, { passive: true });
    return () => messagesContainerRef.current?.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    vscode.postMessage({
      command: 'get_jwt'
    });
    function handleMessage(event: ExtensionMessageEvent) {
      const message = event.data;
      switch (message.command) {
        case 'send_jwt':
          console.error(message.payload);
          break;
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Wrapper>
      <ChatMessages ref={messagesContainerRef}>
        {messages.map(({ text, isBot }) => {
          return <ChatMessage key={text} text={text} isBot={isBot} />;
        })}
        {isBotTyping &&
          <ChatBotMessage
            chatContext={messages}
            onTextChange={scrollToBottom}
            onFinish={(finalBotResponse) => {
              setIsBotTyping(false);
              setIsScrollLocked(false);
              setMessage([...messages, {
                text: finalBotResponse,
                isBot: true
              }]);
            }} />
        }
        <ChatBottomBenchmark ref={messageRef} />
      </ChatMessages>
      <Bottom>
        <ClearChatButton onClick={() => setMessage([])}>
          Clear conversation
        </ClearChatButton>
        <ChatInputStyled isDisabled={isBotTyping} onSubmit={async (userText) => {
          setIsBotTyping(true);
          setIsScrollLocked(true);

          setMessage([...messages, {
            text: userText,
            isBot: false
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

const ChatMessages = styled.div`
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