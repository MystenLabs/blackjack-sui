import { useState, useEffect } from "react";

export const useMouseRandomness = () => {
  const [randomness, setRandomness] = useState<number[]>([]);
  const [gathered, setGathered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const localX = event.clientX - target.getBoundingClientRect().left;
      const localY = event.clientY - target.getBoundingClientRect().top;
      if (randomness.length < 32) {
        const sum = localX * localY * 1223;
        const randomVal = Math.floor(Math.random() * sum) % 256;
        setRandomness((previousRandomness) => [
          ...previousRandomness,
          randomVal,
        ]);
      } else {
        setGathered(true);
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [randomness]);

  return { randomness, gathered };
};
