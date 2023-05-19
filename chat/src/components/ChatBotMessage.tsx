import { useState } from "react";
import styled from "styled-components";
import { useFetchStream } from "../hooks/useGetBotResponse";
import { ChatContext } from "./Message";

type Props = {
    chatContext: ChatContext;
    onTextChange: () => void;
    onFinish: (finalBotResponse: string) => void;
};

export function ChatBotMessage({ chatContext, onFinish, onTextChange, ...props }: Props): React.ReactElement | null {
    const { data, isLoading, error } = useFetchStream(chatContext);
    onTextChange();
    if (error) {
        onFinish(error);
    }
    if (!isLoading) {
        onFinish(data);
    }

    return (
        <Wrapper {...props}>
            {data && <MessageContainer>{data.trim()}</MessageContainer>}
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
