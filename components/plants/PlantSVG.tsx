import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Ellipse, Path, Circle, G } from 'react-native-svg';
import { healthColors, type HealthState } from '../../lib/constants';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  health: HealthState;
  stemColor?: string; // from API; falls back to local map
  size?: number;
}

// Per-state geometry. Healthier = taller stem, more/greener leaves, a flower.
interface Shape {
  stemTopY: number; // smaller y = taller
  leafColor: string;
  leafScale: number;
  hasFlower: boolean;
  droop: number; // leaf droop in degrees
  potColor: string;
}

const SHAPES: Record<HealthState, Shape> = {
  flourishing: { stemTopY: 30, leafColor: '#3FA063', leafScale: 1.0, hasFlower: true, droop: 0, potColor: '#B5734A' },
  good: { stemTopY: 45, leafColor: '#4E9A66', leafScale: 0.92, hasFlower: false, droop: 2, potColor: '#B5734A' },
  fading: { stemTopY: 60, leafColor: '#9FB24A', leafScale: 0.8, hasFlower: false, droop: 8, potColor: '#B5734A' },
  wilting: { stemTopY: 74, leafColor: '#C2A24A', leafScale: 0.65, hasFlower: false, droop: 16, potColor: '#A86A45' },
  critical: { stemTopY: 88, leafColor: '#9A6B43', leafScale: 0.5, hasFlower: false, droop: 26, potColor: '#9A5E3E' },
};

export function PlantSVG({ health, stemColor, size = 120 }: Props) {
  const sway = useRef(new Animated.Value(0)).current;
  const shape = SHAPES[health];
  const stem = stemColor ?? healthColors[health];

  useEffect(() => {
    // Healthier plants sway more; critical barely moves.
    const amplitude = health === 'flourishing' ? 1 : health === 'critical' ? 0.15 : 0.5;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: amplitude,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -amplitude,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [health, sway]);

  const rotate = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* Pot */}
        <Path
          d="M40 96 L80 96 L74 116 L46 116 Z"
          fill={shape.potColor}
        />
        <Ellipse cx="60" cy="96" rx="20" ry="4.5" fill="#C98A5E" />

        {/* Animated plant body (sways from the soil line) */}
        <AnimatedG
          // @ts-expect-error react-native-svg accepts transform style on web/native
          style={{ transform: [{ rotate }] }}
          originX={60}
          originY={96}
        >
          {/* Stem */}
          <Path
            d={`M60 96 Q58 ${(96 + shape.stemTopY) / 2} 60 ${shape.stemTopY}`}
            stroke={stem}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />

          {/* Left leaf */}
          <G originX={60} originY={70} rotation={shape.droop}>
            <Ellipse
              cx={60 - 16 * shape.leafScale}
              cy={70}
              rx={16 * shape.leafScale}
              ry={8 * shape.leafScale}
              fill={shape.leafColor}
              transform={`rotate(-25 ${60 - 16 * shape.leafScale} 70)`}
            />
          </G>

          {/* Right leaf */}
          <G originX={60} originY={62} rotation={-shape.droop}>
            <Ellipse
              cx={60 + 16 * shape.leafScale}
              cy={62}
              rx={16 * shape.leafScale}
              ry={8 * shape.leafScale}
              fill={shape.leafColor}
              transform={`rotate(25 ${60 + 16 * shape.leafScale} 62)`}
            />
          </G>

          {/* Flower (flourishing only) */}
          {shape.hasFlower && (
            <G>
              <Circle cx={60} cy={shape.stemTopY} r={5} fill="#E7B6C9" />
              <Circle cx={60 - 7} cy={shape.stemTopY} r={4.5} fill="#E7B6C9" />
              <Circle cx={60 + 7} cy={shape.stemTopY} r={4.5} fill="#E7B6C9" />
              <Circle cx={60} cy={shape.stemTopY - 7} r={4.5} fill="#E7B6C9" />
              <Circle cx={60} cy={shape.stemTopY + 4} r={4.5} fill="#E7B6C9" />
              <Circle cx={60} cy={shape.stemTopY} r={3} fill="#C87828" />
            </G>
          )}
        </AnimatedG>
      </Svg>
    </View>
  );
}
