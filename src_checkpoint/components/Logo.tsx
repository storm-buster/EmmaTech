import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
`;

const LogoSVG = styled.svg`
  width: 180px;
  height: 180px;
  filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.6));

  @media (min-width: 768px) {
    width: 220px;
    height: 220px;
  }

  .hexagon-outer {
    fill: none;
    stroke: #3FBF7F;
    stroke-width: 4;
    filter: drop-shadow(0 0 10px rgba(63, 191, 127, 0.8));
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

  .particle-ring {
    fill: #FFFFFF;
    animation: ${pulse} 2s ease-in-out infinite;
  }

  .rotating-ring {
    animation: ${rotate} 20s linear infinite;
    transform-origin: center;
  }
`;

export const Logo: React.FC = () => {
    return (
        <LogoSVG viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Particle Ring - scattered around the circle */}
            <g className="rotating-ring">
                {[...Array(80)].map((_, i) => {
                    const angle = (i / 80) * Math.PI * 2;
                    const baseRadius = 85;
                    const radiusVariation = Math.random() * 8 - 4;
                    const radius = baseRadius + radiusVariation;
                    const x = 100 + Math.cos(angle) * radius;
                    const y = 100 + Math.sin(angle) * radius;
                    const size = Math.random() * 1.2 + 0.4;
                    return (
                        <circle
                            key={i}
                            className="particle-ring"
                            cx={x}
                            cy={y}
                            r={size}
                            style={{ animationDelay: `${i * 0.025}s` }}
                        />
                    );
                })}
            </g>

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

            {/* Text */}
            <defs>
                <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="100%" stopColor="#3FBF7F" />
                </linearGradient>
            </defs>

            <text
                x="100"
                y="160"
                textAnchor="middle"
                fill="url(#textGradient)"
                fontSize="24"
                fontWeight="700"
                fontFamily="'Space Grotesk', sans-serif"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.8))' }}
            >
                EmmaTech
            </text>

            <text
                x="100"
                y="175"
                textAnchor="middle"
                fill="#3FBF7F"
                fontSize="8"
                fontWeight="500"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="2"
            >
                DETECT DECEIVE DEFEND
            </text>
        </LogoSVG>
    );
};
