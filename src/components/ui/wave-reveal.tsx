import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WaveRevealProps {
  /**
   * The text to animate
   */
  text: string;

  /**
   * Additional classes for the container
   */
  className?: string;

  /**
   * The direction of the animation
   * @default "down"
   */
  direction?: "up" | "down";

  /**
   * Duration of the animation
   * E.g. "2000ms"
   */
  duration?: string;

  /**
   * If true, the text will apply a blur effect
   */
  blur?: boolean;

  /**
   * Delay for each letter in ms
   */
  delay?: number;

  /**
   * Auto-restart animation after completion
   */
  loop?: boolean;
}

interface ReducedValue extends Pick<WaveRevealProps, "direction"> {
  nodes: ReactNode[];
  offset: number;
  duration: string;
  delay: number;
  blur?: boolean;
  textLength: number;
}

const createDelay = ({
  offset,
  index,
  delay,
}: Pick<ReducedValue, "offset" | "delay"> & {
  index: number;
}) => {
  return delay + (index + offset) * 50 + "ms";
};

const createAnimatedNodes = (
  args: ReducedValue,
  letter: string,
  index: number
): ReducedValue => {
  const { nodes, offset, textLength, direction, duration, delay, blur } = args;

  const isUp = direction === "up";
  const isSpace = letter === " ";

  if (isSpace) {
    return {
      ...args,
      nodes: [...nodes, <span key={`space_${index}`}>&nbsp;</span>],
      offset: offset + 1,
    };
  }

  const animationDelay = createDelay({ index, offset, delay });

  const className = cn(
    "inline-block opacity-0 animate-[reveal-up_0.4s_ease-in-out_forwards]",
    {
      "animate-[reveal-down_0.4s_ease-in-out_forwards]": !isUp && !blur,
      "animate-[reveal-up_0.4s_ease-in-out_forwards]": isUp && !blur,
      "animate-[reveal-down_0.4s_ease-in-out_forwards,content-blur_0.4s_ease-in-out_forwards]":
        !isUp && blur,
      "animate-[reveal-up_0.4s_ease-in-out_forwards,content-blur_0.4s_ease-in-out_forwards]":
        isUp && blur,
    }
  );

  const node = (
    <span
      key={`letter_${index}`}
      className={className}
      style={{
        animationDelay: animationDelay,
      }}
    >
      {letter}
    </span>
  );

  return {
    ...args,
    nodes: [...nodes, node],
    offset: offset + 1,
  };
};

export default function WaveReveal({
  text,
  direction = "down",
  className,
  duration = "600ms",
  delay = 0,
  blur = false,
  loop = false,
}: WaveRevealProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!loop) return;

    // Calculate total animation time (duration + delays for all letters) + longer pause
    const totalDuration =
      parseInt(duration.replace("ms", "")) + text.length * 50 + delay + 2000;

    const interval = setInterval(() => {
      setAnimationKey((prev) => prev + 1);
    }, totalDuration);

    return () => clearInterval(interval);
  }, [loop, duration, text.length, delay]);

  if (!text) {
    return null;
  }

  const letters = text.split("");

  const { nodes } = letters.reduce<ReducedValue>(createAnimatedNodes, {
    nodes: [],
    offset: 0,
    textLength: text.length,
    direction,
    duration,
    delay,
    blur,
  });

  return (
    <span
      className={cn("inline-flex", className)}
      key={loop ? animationKey : undefined} // Force re-render for continuous loop
    >
      {nodes}
      <span className="sr-only">{text}</span>
    </span>
  );
}
