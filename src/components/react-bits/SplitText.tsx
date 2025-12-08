import { motion } from 'framer-motion';
import styled from 'styled-components';

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
}

const Container = styled.span`
  display: inline-block;
  overflow: hidden;
`;

const Word = styled(motion.span)`
  display: inline-block;
  margin-right: 0.25em;
  white-space: normal;
`;

const Character = styled(motion.span)`
  display: inline-block;
`;

export const SplitText: React.FC<SplitTextProps> = ({ text, className, delay = 0 }) => {
    const words = text.split(' ');

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.04 * i + delay },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            } as any,
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
            } as any,
        },
    };

    return (
        <Container className={className}>
            <motion.span
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                {words.map((word, index) => (
                    <Word key={index} style={{ marginRight: index === words.length - 1 ? 0 : '0.25em' }}>
                        {word.split('').map((char, charIndex) => (
                            <Character variants={child} key={charIndex}>
                                {char}
                            </Character>
                        ))}
                    </Word>
                ))}
            </motion.span>
        </Container>
    );
};
