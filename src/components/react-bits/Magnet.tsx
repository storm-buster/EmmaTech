import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface MagnetProps {
    children: React.ReactNode;
    padding?: number;
    disabled?: boolean;
    magnetStrength?: number;
    activeTransition?: any;
    inactiveTransition?: any;
    wrapperClassName?: string;
    innerClassName?: string;
}

const Wrapper = styled(motion.div)`
  display: inline-block;
  position: relative;
`;

export const Magnet: React.FC<MagnetProps> = ({
    children,
    padding = 100,
    disabled = false,
    magnetStrength = 2,
    activeTransition = { type: 'spring', damping: 10, stiffness: 150, mass: 0.1 },
    inactiveTransition = { type: 'spring', damping: 15, stiffness: 150, mass: 0.1 },
    wrapperClassName,
    innerClassName,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (disabled || !ref.current) return;

        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();

        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const dist = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));

        if (dist < padding) {
            const x = (clientX - centerX) / magnetStrength;
            const y = (clientY - centerY) / magnetStrength;
            setPosition({ x, y });
        } else {
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <Wrapper
            ref={ref}
            className={wrapperClassName}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={position}
            transition={position.x === 0 && position.y === 0 ? inactiveTransition : activeTransition}
        >
            <div className={innerClassName}>{children}</div>
        </Wrapper>
    );
};
