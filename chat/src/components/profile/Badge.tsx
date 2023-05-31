import styled from "styled-components";

type Props = {
  icon: string;
  text: string;
};

export const Badge: React.FC<Props> = ({ icon, text }) => {
  return (
    <Wrapper>
      <IndicatorText>
        <IconContainer src={icon} alt="Badge" />
        {text}
      </IndicatorText>
    </Wrapper>
  );
};

const Indicator = styled.div`
  color: var(--vscode-input-placeholderForeground);
`;

const IconContainer = styled.img`
  margin-right: 6px;
`;

const IndicatorText = styled.div`
  display: flex;
  align-items: center;
`;

const Wrapper = styled(Indicator)``;
