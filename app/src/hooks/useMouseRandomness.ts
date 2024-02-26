import { useState, useEffect } from "react";

export const useMouseRandomness = () => {
  const [randomness, setRandomness] = useState<number[]>([]);
  const [gathered, setGathered] = useState(false);

  useEffect(() => {
    const handleMoveEvent = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      let x = 0;
      let y = 0;
      if (event instanceof MouseEvent) {
        x = event.clientX;
        y = event.clientY;
      } else if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      }
      const localX = x - rect.left;
      const localY = y - rect.top;
      if (randomness.length < 32) {
        const sum = localX * localY * 1223;
        const randomVal = Math.floor(Math.random() * sum) % 256;
        setRandomness((previousRandomness) => [
          ...previousRandomness,
          randomVal,
        ]);
      } else {
        setGathered(true);
        document.removeEventListener("mousemove", handleMoveEvent);
        document.removeEventListener("touchmove", handleMoveEvent);
      }
    };
    document.addEventListener("mousemove", handleMoveEvent);
    document.addEventListener("touchmove", handleMoveEvent, { passive: true });
    return () => {
      document.removeEventListener("mousemove", handleMoveEvent);
      document.removeEventListener("touchmove", handleMoveEvent);
    };
  }, [randomness]);

  return { randomness, gathered };
};
