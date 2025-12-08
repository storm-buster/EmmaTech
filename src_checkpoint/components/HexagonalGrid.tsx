import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.6;
  }
`;

const GridContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
`;

const HexagonSVG = styled.svg`
  position: absolute;
  opacity: 0.1;
  animation: ${float} 20s ease-in-out infinite;

  &:nth-child(1) {
    top: 10%;
    left: 5%;
    animation-delay: 0s;
  }
  &:nth-child(2) {
    top: 60%;
    left: 80%;
    animation-delay: 3s;
  }
  &:nth-child(3) {
    top: 30%;
    right: 10%;
    animation-delay: 6s;
  }
  &:nth-child(4) {
    bottom: 20%;
    left: 15%;
    animation-delay: 9s;
  }
  &:nth-child(5) {
    top: 70%;
    left: 50%;
    animation-delay: 12s;
  }
`;

export const HexagonalGrid: React.FC = () => {
  return (
    <GridContainer>
      {[...Array(5)].map((_, i) => (
        <HexagonSVG
          key={i}
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M100 10 L170 50 L170 130 L100 170 L30 130 L30 50 Z"
            stroke="url(#hexGradient)"
            strokeWidth="2"
            fill="none"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#7B2FFF" />
            </linearGradient>
          </defs>
        </HexagonSVG>
      ))}
    </GridContainer>
  );
};
