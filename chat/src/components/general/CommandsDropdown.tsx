import styled from "styled-components";
import { CommandItem } from "./CommandItem";
import { useEffect, useMemo, useState } from "react";
import { Intent, slashCommands } from "../../utils/slashCommands";

type Props = {
  filter?: string;
  onSelect(intent: Intent): void;
};

export function CommandsDropdown({
  filter,
  onSelect,
  ...props
}: Props): React.ReactElement {
  const [focusedCommandIndex, setFocusedCommandIndex] = useState(0);

  const filteredCommands = useMemo(() => {
    if (!filter) {
      return slashCommands;
    }
    return slashCommands.filter(
      ({ intent }) => intent.startsWith(filter) && intent !== filter
    );
  }, [filter]);

  useEffect(() => {
    if (filteredCommands.length <= focusedCommandIndex) {
      setFocusedCommandIndex(0);
    }
  }, [filteredCommands, focusedCommandIndex]);

  useEffect(() => {
    const moveFocusDown = () => {
      setFocusedCommandIndex((prevFocusedCommand) =>
        prevFocusedCommand === null ||
        prevFocusedCommand === filteredCommands.length - 1
          ? 0
          : prevFocusedCommand + 1
      );
    };

    const moveFocusUp = () => {
      setFocusedCommandIndex((prevFocusedCommand) =>
        prevFocusedCommand === null || prevFocusedCommand === 0
          ? filteredCommands.length - 1
          : prevFocusedCommand - 1
      );
    };

    const selectCommand = () => {
      onSelect(filteredCommands[focusedCommandIndex]?.intent);
    };

    const keyFunctions: { [key: string]: () => void } = {
      ArrowDown: moveFocusDown,
      ArrowUp: moveFocusUp,
      Enter: selectCommand,
    };

    function handleKeyDown(event: KeyboardEvent) {
      const keyFunction = keyFunctions[event.key];
      if (keyFunction) {
        keyFunction();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, focusedCommandIndex]);

  return (
    <Wrapper {...props}>
      {filteredCommands.map(({ intent, description, icon }, index) => (
        <CommandItem
          key={intent}
          intent={intent}
          isFocused={intent === filteredCommands[focusedCommandIndex]?.intent}
          description={description}
          icon={icon}
          onMouseEnter={() => setFocusedCommandIndex(index)}
          onClick={() => onSelect(intent)}
        />
      ))}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #000000;
  border: solid #303031;
  border-width: 1px 0;
  box-shadow: 0px -9px 8px rgba(0, 0, 0, 0.32);
`;
