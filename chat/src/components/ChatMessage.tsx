import styled from "styled-components";
import SyntaxHighlighter from 'react-syntax-highlighter';

type Props = {
    text: string;
    isBot: boolean;
};
export function ChatMessage({ text, isBot, ...props }: Props): React.ReactElement {
    const code = `
    const inputs = buildInputs(req.body.input);
    apiRequest.write(JSON.stringify({
        inputs,
        parameters: {
            max_new_tokens: 500
        }
    }));
    `;
    return (
        <Wrapper {...props}>
            <MessageContainer isBot={isBot}>{text.trim()}
                <SyntaxHighlighter language="javascript">
                    {code}
                </SyntaxHighlighter>
            </MessageContainer>
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
    background-color: ${({ isBot }) => isBot ? "var(--vscode-list-activeSelectionBackground)" : "var(--vscode-list-inactiveSelectionBackground)"};
    color: var(--vscode-editor-foreground);
    padding: 10px;
    border-radius: 8px;
    min-height: 2rem;
`;