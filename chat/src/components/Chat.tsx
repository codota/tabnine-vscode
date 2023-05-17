import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

type Message = {
  text: string;
  isBot: boolean;
}

type BotResponse = {
  isFinished: boolean;
  text: string;
}

export function Chat(): React.ReactElement {
  const messageRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessage] = useState<Array<Message>>([]);
  const [botCurrentText, setBotCurrentText] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scrollPosition = useRef(-1);
  const [isScrollLocked, setIsScrollLocked] = useState(false);


  const scrollToBottom = () => {
    if (isScrollLocked) {
      messageRef.current?.scrollIntoView(
        {
          behavior: 'smooth',
          block: 'end',
        });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = [...messages];
      newMessages[messages.length - 1].text = botCurrentText;
      setMessage(newMessages);
    }
  }, [botCurrentText]);

  useEffect(() => scrollToBottom, [botCurrentText, messages]);

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
  }, []);

  return (
    <Wrapper>
      <ChatMessages ref={messagesContainerRef}>
        {messages.map(({ text, isBot }) => {
          return <ChatMessage key={text} text={text} isBot={isBot} />;
        })}
        <ChatBottomBenchmark ref={messageRef} />
      </ChatMessages>
      <Bottom>
        <ClearChatButton onClick={() => setMessage([])}>
          Clear conversation
        </ClearChatButton>
        <ChatInputStyled isDisabled={isBotTyping} onSubmit={async (userText) => {
          if (isBotTyping) {
            return;
          }
          setIsBotTyping(true);
          setIsScrollLocked(true);

          setMessage([...messages, {
            text: userText,
            isBot: false
          }, {
            text: "",
            isBot: true
          }]);

          let isBotFinished = false;
          let numberOfBotResponses = 0;
          let botResponseText = "";
          while (!isBotFinished) {
            const { text, isFinished } = await mockBotResponse(userText, numberOfBotResponses++);
            isBotFinished = isFinished;
            botResponseText = botResponseText + text;
            setBotCurrentText(botResponseText);
          }

          setIsBotTyping(false);
          setIsScrollLocked(false);
        }} />
      </Bottom>
    </Wrapper>
  );
}

async function mockBotResponse(text: string, index: number): Promise<BotResponse> {
  const response = ("This is what you wrote: " + text).split(' ');
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    isFinished: index == response.length - 1,
    text: response[index] + " "
  }
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