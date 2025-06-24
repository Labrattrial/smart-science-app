// TwoPhaseMoleculeSimulator
// Props:
//   - boundary: 'sublimation' | 'vaporization' | 'fusion' | 'triple' (preferred, sets phases automatically)
//   - phaseA, phaseB: (optional, overrides boundary if provided)
//   - width, height: dimensions
//
// Usage:
//   <TwoPhaseMoleculeSimulator boundary="sublimation" />
//   <TwoPhaseMoleculeSimulator boundary="triple" />
//   <TwoPhaseMoleculeSimulator phaseA="Solid" phaseB="Gas" />

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MoleculeSimulator from './MoleculeSimulator';

const boundaryToPhases = {
  sublimation: ['Solid', 'Gas'],
  vaporization: ['Liquid', 'Gas'],
  fusion: ['Solid', 'Liquid'],
  triple: ['Solid', 'Liquid', 'Gas'],
};

export default function TwoPhaseMoleculeSimulator({ boundary, phaseA, phaseB, width = 140, height = 70 }) {
  let phases = [phaseA, phaseB];
  if (boundary && boundaryToPhases[boundary]) {
    phases = boundaryToPhases[boundary];
  }
  if (boundary === 'triple') {
    // Overlap all three phases in the center with different opacities and different scales (only at triple point)
    const triplePhases = [
      { phase: 'Liquid', opacity: 0.8, scale: 0.85 },
      { phase: 'Gas', opacity: 0.7, scale: 0.95 },
      { phase: 'Solid', opacity: 1.0, scale: 0.6, moleculeRadius: 3, moleculeSpacing: 5 },
    ];
    return (
      <View style={[styles.overlapContainer, { width, height }]}>
        <View style={[styles.overlapSimWrapper, { width, height, top: 8 }]}>
          {triplePhases.map(({ phase, opacity, scale, moleculeRadius, moleculeSpacing }) => (
            <View key={phase} style={[styles.absoluteFill, { opacity }]}>
              <MoleculeSimulator 
                phase={phase} 
                width={width * scale} 
                height={height * scale} 
                {...(phase === 'Solid' ? { moleculeRadius, moleculeSpacing } : {})}
              />
            </View>
          ))}
        </View>
        <View style={styles.labelRow}>
          {triplePhases.map(({ phase }, idx) => (
            <React.Fragment key={phase}>
              <Text style={styles.label}>{phase}</Text>
              {idx < triplePhases.length - 1 && <Text style={styles.label}>/</Text>}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }
  // For two-phase boundaries, overlap the two simulators in the center
  // If one phase is Gas, render it on top with full opacity, the other with 0.5
  let lowerPhase = phases[0], upperPhase = phases[1];
  let lowerOpacity = 0.7, upperOpacity = 0.7;
  let lowerWidth = width * 0.95, lowerHeight = height * 0.95;
  let upperWidth = width * 0.95, upperHeight = height * 0.95;

  if (boundary === 'fusion') {
    // For fusion, liquid is always on top with 0.8 opacity, solid is below with 1.0 opacity
    if (phases.includes('Solid') && phases.includes('Liquid')) {
      lowerPhase = 'Solid';
      upperPhase = 'Liquid';
      lowerOpacity = 1.0;
      upperOpacity = 0.7;
    }
  } else if (boundary === 'sublimation') {
    // For sublimation, gas is always on top with 0.7 opacity, solid is below with 1.0 opacity
    if (phases.includes('Solid') && phases.includes('Gas')) {
      lowerPhase = 'Solid';
      upperPhase = 'Gas';
      lowerOpacity = 1.0;
      upperOpacity = 0.7;
    }
  } else if (boundary === 'vaporization') {
    // For vaporization, liquid is fully opaque, gas is 0.7
    if (phases[0] === 'Liquid') {
      lowerOpacity = 1.0;
      upperOpacity = 0.8;
    } else if (phases[1] === 'Liquid') {
      lowerOpacity = 0.7;
      upperOpacity = 1.0;
      // Swap so that liquid is always on top
      [lowerPhase, upperPhase] = [upperPhase, lowerPhase];
      [lowerOpacity, upperOpacity] = [upperOpacity, lowerOpacity];
    }
  } else if (phases.includes('Gas')) {
    upperPhase = 'Gas';
    lowerPhase = phases.find(p => p !== 'Gas');
    lowerOpacity = 0.5;
    upperOpacity = 1.0;
  }

  return (
    <View style={[styles.overlapContainer, { width, height }]}>
      <View style={[styles.overlapSimWrapper, { width, height, top: 8 }]}>
        <View style={[styles.absoluteFill, lowerPhase === 'Solid' && (boundary === 'fusion' || boundary === 'sublimation') ? { opacity: lowerOpacity, top: 8 } : { opacity: lowerOpacity }]}>
          <MoleculeSimulator 
            phase={lowerPhase} 
            width={lowerWidth} 
            height={lowerHeight} 
            {...((boundary === 'triple' && lowerPhase === 'Solid') ? { moleculeRadius: 3, moleculeSpacing: 5 } : {})}
          />
        </View>
        <View style={[styles.absoluteFill, styles.overlapSimTop, { opacity: upperOpacity }]}>
          <MoleculeSimulator 
            phase={upperPhase} 
            width={upperWidth} 
            height={upperHeight} 
            {...((boundary === 'triple' && upperPhase === 'Solid') ? { moleculeRadius: 3, moleculeSpacing: 5 } : {})}
          />
        </View>
      </View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{phases[0]}</Text>
        <Text style={styles.label}>/</Text>
        <Text style={styles.label}>{phases[1]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlapSimWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlapSimTop: {
    zIndex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  simContainer: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  label: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
}); 