import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const phaseColors = {
  Solid: "#4a90e2",
  Liquid: "#7ed957",
  Gas: "#ffa500",
};

function MoleculeSim({ phase, width = 70, height = 70, moleculeRadius, moleculeSpacing }) {
  const MAX_MOLS = 9;
  const count = phase === "Solid" ? 9 : phase === "Liquid" ? 8 : 6;
  const progress = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  const mols = useRef(
    Array.from({ length: MAX_MOLS }).map(() => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      vx: Math.random() * 0.6 + 0.4,
      vy: Math.random() * 0.6 + 0.4,
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: Math.random() > 0.5 ? 1 : -1,
      offset: Math.random() * Math.PI * 2,
      lastPhase: "Solid",
      targetX: useSharedValue(0),
      targetY: useSharedValue(0),
    }))
  ).current;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, []);

  useEffect(() => {
    // Start transition animation
    transitionProgress.value = withTiming(1, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    });

    // Calculate target positions for liquid state
    for (let i = 0; i < MAX_MOLS; i++) {
      if (phase === "Liquid") {
        mols[i].targetX.value = width / 2 + Math.cos((i / count) * 2 * Math.PI) * 12;
        mols[i].targetY.value = height / 2 + Math.sin((i / count) * 2 * Math.PI) * 12;
      }
    }
  }, [phase]);

  function createAnimatedProps(i) {
    return useAnimatedProps(() => {
      if (phase === "Solid") {
        // Calculate grid size for centering
        const gridCount = 3;
        const spacing = moleculeSpacing !== undefined ? moleculeSpacing : 13;
        const gridWidth = (gridCount - 1) * spacing;
        const gridHeight = (gridCount - 1) * spacing;
        const offsetX = (width - gridWidth) / 2;
        const offsetY = (height - gridHeight) / 2;

        // Calculate grid positions around center
        const row = Math.floor(i / 3) - 1;
        const col = (i % 3) - 1;
        // Center the grid in the SVG
        const baseX = offsetX + (col + 1) * spacing;
        const baseY = offsetY + (row + 1) * spacing;

        // Add small random vibration
        const t = progress.value * 2 * Math.PI * 6 + mols[i].offset;
        const vibrateX = Math.sin(t) * 0.2;
        const vibrateY = Math.cos(t) * 0.2;
        
        return {
          cx: baseX + vibrateX,
          cy: baseY + vibrateY,
        };
      } else if (phase === "Liquid") {
        // Calculate center of mass for cohesive movement
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base movement with some randomness but staying near center
        const t = progress.value * 2 * Math.PI + mols[i].offset;
        const baseRadius = 10; // Reduced from 12 to keep molecules closer
        const randomRadius = Math.sin(t * 0.5) * 1.7; // Reduced from 3 to minimize random movement
        const angle = (i / count) * Math.PI * 2 + Math.sin(t * 0.3) * 0.1; // Reduced angle variation
        
        // Calculate target position with cohesive movement
        const targetX = centerX + Math.cos(angle) * (baseRadius + randomRadius);
        const targetY = centerY + Math.sin(angle) * (baseRadius + randomRadius);
        
        // Smooth movement towards target with some resistance
        const dx = targetX - mols[i].x.value;
        const dy = targetY - mols[i].y.value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add small random movement
        const randomMoveX = Math.sin(t * 2 + i) * 0.4; // Reduced from 0.8
        const randomMoveY = Math.cos(t * 2 + i) * 0.4; // Reduced from 0.8
        
        // Update position with smooth movement and small random motion
        mols[i].x.value += dx * 0.03 + randomMoveX; // Increased from 0.02 for faster response
        mols[i].y.value += dy * 0.03 + randomMoveY; // Increased from 0.02 for faster response
        
        // Keep molecules within bounds
        const margin = 10;
        mols[i].x.value = Math.max(margin, Math.min(mols[i].x.value, width - margin));
        mols[i].y.value = Math.max(margin, Math.min(mols[i].y.value, height - margin));

        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      } else {
        let nx = mols[i].x.value + mols[i].vx * mols[i].dirX * 4;
        let ny = mols[i].y.value + mols[i].vy * mols[i].dirY * 4;

        // Bounce off walls
        if (nx < 10 || nx > width - 10) mols[i].dirX *= -1;
        if (ny < 10 || ny > height - 10) mols[i].dirY *= -1;

        // Update position with transition
        const newX = Math.max(10, Math.min(nx, width - 10));
        const newY = Math.max(10, Math.min(ny, height - 10));

        // If transitioning to liquid, gradually move towards target position
        if (mols[i].lastPhase === "Gas" && phase === "Liquid") {
          const transitionX = interpolate(
            transitionProgress.value,
            [0, 1],
            [newX, mols[i].targetX.value]
          );
          const transitionY = interpolate(
            transitionProgress.value,
            [0, 1],
            [newY, mols[i].targetY.value]
          );
          mols[i].x.value = transitionX;
          mols[i].y.value = transitionY;
        } else {
          mols[i].x.value = newX;
          mols[i].y.value = newY;
        }

        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      }
    });
  }

  const animatedPropsArr = [
    createAnimatedProps(0),
    createAnimatedProps(1),
    createAnimatedProps(2),
    createAnimatedProps(3),
    createAnimatedProps(4),
    createAnimatedProps(5),
    createAnimatedProps(6),
    createAnimatedProps(7),
    createAnimatedProps(8),
  ];

  return (
    <Svg width={width} height={height}>
      {[...Array(count)].map((_, i) => (
        <AnimatedCircle
          key={i}
          r={moleculeRadius !== undefined ? moleculeRadius : (phase === "Solid" ? 7 : phase === "Liquid" ? 7 : 6)}
          fill={phaseColors[phase]}
          stroke="#222"
          strokeWidth="1.5"
          opacity={phase === "Gas" ? 0.8 : 1}
          animatedProps={animatedPropsArr[i]}
        />
      ))}
    </Svg>
  );
}

export default function MoleculeSimulator({ phase, width = 70, height = 70, moleculeRadius, moleculeSpacing }) {
  return <MoleculeSim phase={phase} width={width} height={height} moleculeRadius={moleculeRadius} moleculeSpacing={moleculeSpacing} />;
}

const styles = StyleSheet.create({
  moleculeCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#202d56",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "#283987",
    marginBottom: 12,
  },
}); 