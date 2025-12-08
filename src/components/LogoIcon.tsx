import styled from 'styled-components';

const IconSVG = styled.svg`
  width: 30px;
  height: 30px;
  filter: drop-shadow(0 0 5px rgba(63, 191, 127, 0.6));

  .hexagon-outer {
    fill: none;
    stroke: #3FBF7F;
    stroke-width: 4;
  }

  .hexagon-middle {
    fill: #2C3E50;
    stroke: #1A2332;
    stroke-width: 2;
  }

  .hexagon-inner {
    fill: #1A2332;
    stroke: #3FBF7F;
    stroke-width: 1.5;
  }
`;

export const LogoIcon: React.FC = () => {
  return (
    <IconSVG viewBox="50 30 100 110" xmlns="http://www.w3.org/2000/svg">
      {/* Outer Green Hexagon */}
      <path
        className="hexagon-outer"
        d="M 100 40 L 140 62 L 140 106 L 100 128 L 60 106 L 60 62 Z"
      />

      {/* Middle Dark Hexagon (filled) */}
      <path
        className="hexagon-middle"
        d="M 100 50 L 130 68 L 130 100 L 100 118 L 70 100 L 70 68 Z"
      />

      {/* Inner Small Hexagon (center) */}
      <path
        className="hexagon-inner"
        d="M 100 76 L 110 82 L 110 94 L 100 100 L 90 94 L 90 82 Z"
      />
    </IconSVG>
  );
};
