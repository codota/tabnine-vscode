import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components'
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

// declare var acquireVsCodeApi: any;
// const vscode = acquireVsCodeApi();

type Message = {
  text: string;
  isBot: boolean;
}

type BotResponse = {
  isFinished: boolean;
  text: string;
}

export function Chat(): React.ReactElement {

  // const addCategory = () => () => vscode.postMessage({ command: 'add-category' });
  // console.log(vscode.getState();

  const messageRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessage] = useState<Array<Message>>([]);
  const [botCurrentText, setBotCurrentText] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  const scrollToBottom = () => {
    messageRef.current?.scrollIntoView(
      {
        behavior: 'smooth',
        block: 'end',
      });
  };

  useEffect(() => {
    if (messages.length > 0) {
      const newMessages = [...messages];
      newMessages[messages.length - 1].text = botCurrentText;
      setMessage(newMessages);
    }
  }, [botCurrentText]);

  useEffect(() => scrollToBottom, [botCurrentText, messages]);

  return (
    <Wrapper>
      <ChatMessages>
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