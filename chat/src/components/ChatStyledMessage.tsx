import React from 'react';
import styled from "styled-components";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { MessageSegment } from '../utils/message';

type Props = {
    textSegments: MessageSegment[];
    isBot: boolean;
};

export function ChatStyledMessage({ textSegments, isBot, ...props }: Props): React.ReactElement | null {
    return (
        <Wrapper {...props}>
            {textSegments.length > 0 && <MessageContainer isBot={isBot}>{textSegments.map(segment => {
                if (segment.kind === 'text') {
                    return <span key={segment.text}>{segment.text}</span>
                }
                return (
                    <SyntaxHighlighter key={segment.text} language={segment.language} style={vs2015}>
                        {segment.text}
                    </SyntaxHighlighter>
                )
            })}</MessageContainer>}
        </Wrapper>
    );
}

const Wrapper = styled.div`
    padding: 5px 10px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
`;

const MessageContainer = styled.div<{ isBot: boolean }>`
    font-size: 0.9rem;
    line-height: 1.3;
    background-color: ${({ isBot }) => isBot ? "var(--vscode-list-inactiveSelectionBackground)": "var(--vscode-list-activeSelectionBackground)"};
    color: var(--vscode-editor-foreground);
    padding: 10px;
    border-radius: 8px;
    min-height: 2rem;
`;
