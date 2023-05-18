import styled from "styled-components";
import { useFetchStream } from "../hooks/useGetBotResponse";

type Props = {
    text: string;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};
export function ChatBotMessage({text, onFinish, onTextChange, ...props}: Props): React.ReactElement {
    const { data, isLoading, error } = useFetchStream(text);

    if (!isLoading) {
        onFinish(data);
    } else {
        onTextChange();
    }

    return (
        <Wrapper {...props}>
            <MessageContainer>{data}</MessageContainer>
        </Wrapper>
    );
}

const Wrapper = styled.div`
    padding: 5px 10px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
`;

const MessageContainer = styled.div`
    font-size: 0.9rem;
    line-height: 1.3;
    background-color: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-editor-foreground);
    padding: 10px;
    border-radius: 8px;
    min-height: 2rem;
`;