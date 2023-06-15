import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ReactComponent as RightArrowIcon } from "../../assets/right-arrow.svg";
import { CommandsDropdown } from "./CommandsDropdown";
import { Intent, slashCommands } from "../../utils/slashCommands";

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
  const [showCommands, setShowCommands] = useState(false);
  const [intent, setIntent] = useState<Intent | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handleResponse(eventMessage: MessageEvent) {
      if (eventMessage.data?.command === "focus-input") {
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("message", handleResponse);
    return () => window.removeEventListener("message", handleResponse);
  }, []);
  useEffect(() => textareaRef.current?.focus(), []);

  useEffect(() => {
    const hasIntent = slashCommands.find(
      ({ intent }) =>
        message.startsWith("/") && message.substring(1).startsWith(intent)
    );
    if (!hasIntent) {
      setIntent(null);
    }
  }, [message]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowCommands(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setShowCommands(
      message.startsWith("/") && !message.includes(" ") && !intent
    );
  }, [message]);

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
        ref={textareaRef}
        autoFocus
        placeholder="Start with '/' for commands, or simply type"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
        }}
        onKeyDown={(e) => {
          if (showCommands && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
            e.preventDefault();
            return;
          }
          if (
            e.key === "Enter" &&
            e.shiftKey === false &&
            message.trim().length > 0 &&
            !isDisabled
          ) {
            e.preventDefault();
            if (showCommands) {
              return;
            }
            onSubmit(message.trim());
            setMessage("");
          }
        }}
      />
      {showCommands && (
        <CommandsDropdownStyled
          filter={message.substring(1)}
          onSelect={(intent) => {
            setMessage((message) => `/${intent} `);
            setIntent(intent);
          }}
        />
      )}
    </Wrapper>
  );
}

const inputHeightPx = 60;

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
  height: ${inputHeightPx}px;
`;

const CommandsDropdownStyled = styled(CommandsDropdown)`
  position: absolute;
  left: 0;
  width: 100%;
  bottom: ${inputHeightPx + 3}px;
`;
