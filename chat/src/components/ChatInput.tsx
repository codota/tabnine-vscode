import { useState } from "react";
import styled from "styled-components";

type Props = {
  onSubmit: (message: string) => void;
  isDisabled: boolean;
};
export function ChatInput({
  onSubmit,
  isDisabled,
  ...props
}: Props): React.ReactElement {
  const [message, setMessage] = useState("");
  return (
    <Wrapper {...props}>
      <Textarea
        placeholder="Type here what you need, or select some code"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            e.shiftKey === false &&
            message.length > 0 &&
            !isDisabled
          ) {
            e.preventDefault();
            onSubmit(message);
            setMessage("");
          }
        }}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div``;

const Textarea = styled.textarea`
  width: 100%;
  height: 100%;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  outline: none !important;
  border: none !important;
  resize: none;
  padding: 11px 26px;
  font-size: 0.8rem;
  font-family: sans-serif;
`;
