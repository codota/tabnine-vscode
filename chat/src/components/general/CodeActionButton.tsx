import styled from "styled-components";

type Props = {
  caption: string;
  onClick(): void;
  icon?: React.ReactNode;
};

export function CodeActionButton({
  caption,
  onClick,
  icon,
  ...props
}: Props): React.ReactElement {
  return (
    <Wrapper onClick={onClick}>
      {icon && <IconWrapper>{icon}</IconWrapper>}
      {caption}
    </Wrapper>
  );
}

const IconWrapper = styled.div`
  margin-right: 0.4rem;
  display: flex;
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  color: #40a6ff;

  path {
    fill: #40a6ff;
  }

  &:hover {
    cursor: pointer;
    color: #9ecffa;
    path {
      fill: #9ecffa;
    }
  }

  &:active {
    color: #0458a2;
    path {
      fill: #0458a2;
    }
  }
`;
