import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const moleculeCount = 30;

function getRandomColor() {
  const colors = ['#4CC9F0', '#3A0CA3', '#4361EE', '#4895EF'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

export default function MoleculeBackground() {
  const molecules = useRef(
    Array.from({ length: moleculeCount }).map(() => {
      const x = new Animated.Value(getRandom(0, width));
      const y = new Animated.Value(getRandom(0, height));
      const size = getRandom(6, 14);
      const opacity = getRandom(0.3, 0.7);
      const color = getRandomColor();

      return { x, y, size, opacity, color };
    })
  ).current;

  useEffect(() => {
    molecules.forEach((molecule) => {
      const animate = () => {
        Animated.parallel([
          Animated.timing(molecule.x, {
            toValue: getRandom(0, width),
            duration: getRandom(8000, 12000),
            useNativeDriver: true,
          }),
          Animated.timing(molecule.y, {
            toValue: getRandom(0, height),
            duration: getRandom(8000, 12000),
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {molecules.map((m, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: m.size,
              height: m.size,
              borderRadius: m.size / 2,
              backgroundColor: m.color,
              opacity: m.opacity,
              transform: [
                { translateX: m.x },
                { translateY: m.y },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
  },
});
