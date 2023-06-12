import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ReactComponent as RightArrowIcon } from "../../assets/right-arrow.svg";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <Wrapper {...props}>
      <RightArrowContainer
        onClick={() => {
          onSubmit(message);
          setMessage("");
        }}
      >
        <RightArrowPadding>
          <RightArrowIcon />
        </RightArrowPadding>
      </RightArrowContainer>
      <Textarea
        ref={(textareaRef) => textareaRef && textareaRef.focus()}
        autoFocus
        placeholder="Type here what you need, or select some code"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyPress={(e) => {
          if (
            e.key === "Enter" &&
            e.shiftKey === false &&
            message.trim().length > 0 &&
            !isDisabled
          ) {
            e.preventDefault();
            onSubmit(message.trim());
            setMessage("");
          }
        }}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: relative;
  border-top: 1px solid #433f47;
`;

const RightArrowContainer = styled.div`
  position: absolute;
  right: 8px;
  top: 9px;
  background-color: #303031;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: #6a6a6a;
  }
`;

const RightArrowPadding = styled.div`
  display: flex;
  padding: 4px;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 100%;
  background-color: var(--vscode-editor-background);
  color: var(--vscode-editor-foreground);
  &&& {
    outline: none;
    border: none;
  }
  resize: none;
  padding: 11px 30px 11px 13px;
  font-size: 0.9rem;
  font-family: sans-serif;
  height: 60px;
`;
