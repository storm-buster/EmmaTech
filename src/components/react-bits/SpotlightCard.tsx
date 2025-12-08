import { useRef, useState } from 'react';
import styled from 'styled-components';

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

const Card = styled.div<{ $spotlightColor: string; $x: number; $y: number; $opacity: number }>`
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at ${({ $x }) => $x}px ${({ $y }) => $y}px,
      ${({ $spotlightColor }) => $spotlightColor},
      transparent 80%
    );
    opacity: ${({ $opacity }) => $opacity};
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    background: ${({ theme }) => theme.colors.background.card};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    z-index: 2;
  }
`;

const Content = styled.div`
  position: relative;
  z-index: 3;
  height: 100%;
`;

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
    children,
    className,
    spotlightColor = 'rgba(255, 255, 255, 0.1)',
}) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <Card
            ref={divRef}
            className={className}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            $spotlightColor={spotlightColor}
            $x={position.x}
            $y={position.y}
            $opacity={opacity}
        >
            <Content>{children}</Content>
        </Card>
    );
};
