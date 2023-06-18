import styled from "styled-components";

type Props = {
  intent: string;
  description: string;
  isFocused: boolean;
  icon: JSX.Element;
  onMouseEnter: () => void;
  onClick: () => void;
};

export function CommandItem({
  intent,
  description,
  icon,
  isFocused,
  onClick,
  onMouseEnter,
}: Props): React.ReactElement {
  return (
    <Wrapper
      isFocused={isFocused}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div>
        <IconWrapper>{icon}</IconWrapper>
      </div>
      <div>
        <Intent>/{intent}</Intent>
        <Description>{description}</Description>
      </div>
    </Wrapper>
  );
}

const IconWrapper = styled.div`
  padding: 0.3rem;
  display: flex;
  background-color: #303031;
  border-radius: 5px;
  margin-top: 2px;
`;

const Intent = styled.div`
  color: #e5e5e5;
  font-size: 0.85rem;
`;

const Description = styled.div`
  color: #7f7f7f;
  font-size: 0.75rem;
`;

const Wrapper = styled.div<{ isFocused: boolean }>`
  display: flex;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  cursor: pointer;

  ${(props) =>
    props.isFocused &&
    `
        background-color: #001F33;
        ${IconWrapper} {
            background-color: #264F78;
        }
    `}
`;
