import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
`;

export const Hyperspeed: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 1;
        camera.rotation.x = Math.PI / 2;

        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);

        const starGeo = new THREE.BufferGeometry();
        const starCount = 4000;
        const positions = new Float32Array(starCount * 3);
        const velocities = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = Math.random() * 600 - 300;
            positions[i * 3 + 1] = Math.random() * 600 - 300;
            positions[i * 3 + 2] = Math.random() * 600 - 300;
            velocities[i] = 0;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const sprite = new THREE.TextureLoader().load('https://assets.codepen.io/127738/dot.png');
        const starMaterial = new THREE.PointsMaterial({
            color: 0xaaaaaa, // Light grey stars
            size: 0.5,
            map: sprite,
            transparent: true,
            alphaTest: 0.5,
            opacity: 0.8,
        });

        const stars = new THREE.Points(starGeo, starMaterial);
        scene.add(stars);

        const animate = () => {
            const positions = starGeo.attributes.position.array as Float32Array;

            for (let i = 0; i < starCount; i++) {
                velocities[i] += 0.005; // Much slower acceleration
                positions[i * 3 + 1] -= velocities[i];

                if (positions[i * 3 + 1] < -200) {
                    positions[i * 3 + 1] = 200;
                    velocities[i] = 0;
                }
            }

            starGeo.attributes.position.needsUpdate = true;
            stars.rotation.y += 0.0005; // Very slow rotation

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return <Container ref={containerRef} />;
};
