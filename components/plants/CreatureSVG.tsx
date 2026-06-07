import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { healthColors, type HealthState } from '../../lib/constants';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  health: HealthState;
  stemColor?: string; // reuse the health color from the API for the body tint
  size?: number;
}

// A googly-eyed blob buddy — the alternative to the plant. Same 5 health states:
// energetic & bright when in touch, droopy/grey/asleep when neglected.
interface Look {
  body: string;
  squash: number; // vertical squash (sad = flatter)
  mouth: 'grin' | 'smile' | 'flat' | 'frown' | 'sleep';
  eyes: 'happy' | 'open' | 'half' | 'sleepy' | 'shut';
  bob: number; // animation amplitude
}

const LOOKS: Record<HealthState, Look> = {
  flourishing: { body: '#7CC6F2', squash: 1.0, mouth: 'grin', eyes: 'happy', bob: 1 },
  good: { body: '#9BD0E8', squash: 0.98, mouth: 'smile', eyes: 'open', bob: 0.6 },
  fading: { body: '#AFC2C9', squash: 0.92, mouth: 'flat', eyes: 'half', bob: 0.35 },
  wilting: { body: '#B4AEA6', squash: 0.84, mouth: 'frown', eyes: 'sleepy', bob: 0.18 },
  critical: { body: '#A6A6A6', squash: 0.74, mouth: 'sleep', eyes: 'shut', bob: 0.06 },
};

export function CreatureSVG({ health, stemColor, size = 120 }: Props) {
  const bob = useRef(new Animated.Value(0)).current;
  const look = LOOKS[health];
  const body = look.body;

  useEffect(() => {
    const amp = look.bob;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: amp, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: -amp, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [health, bob, look.bob]);

  const translateY = bob.interpolate({ inputRange: [-1, 1], outputRange: [3, -3] });

  const cy = 56;
  const ry = 34 * look.squash;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* shadow grows softer as it sinks */}
        <Ellipse cx="60" cy="104" rx={28 * look.squash} ry="6" fill="rgba(0,0,0,0.08)" />

        <AnimatedG
          // @ts-expect-error react-native-svg accepts transform style on web/native
          style={{ transform: [{ translateY }] }}
        >
          {/* body */}
          <Ellipse cx="60" cy={cy} rx="34" ry={ry} fill={body} />

          {/* little feet */}
          <Ellipse cx="48" cy={cy + ry - 2} rx="7" ry="5" fill={body} />
          <Ellipse cx="72" cy={cy + ry - 2} rx="7" ry="5" fill={body} />

          {/* eyes (googly) */}
          <Eyes kind={look.eyes} cy={cy} />

          {/* mouth */}
          <Mouth kind={look.mouth} cy={cy} />

          {/* a little blush when flourishing */}
          {health === 'flourishing' && (
            <>
              <Circle cx="44" cy={cy + 8} r="3.5" fill="#F7A8C4" opacity={0.7} />
              <Circle cx="76" cy={cy + 8} r="3.5" fill="#F7A8C4" opacity={0.7} />
            </>
          )}
        </AnimatedG>
      </Svg>
    </View>
  );
}

function Eyes({ kind, cy }: { kind: Look['eyes']; cy: number }) {
  const lx = 50;
  const rx = 70;
  const ey = cy - 6;
  if (kind === 'shut') {
    return (
      <>
        <Path d={`M${lx - 5} ${ey} q5 4 10 0`} stroke="#2B2B2B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <Path d={`M${rx - 5} ${ey} q5 4 10 0`} stroke="#2B2B2B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (kind === 'sleepy') {
    return (
      <>
        <Circle cx={lx} cy={ey} r="6" fill="#FFF" />
        <Circle cx={rx} cy={ey} r="6" fill="#FFF" />
        <Circle cx={lx} cy={ey + 2} r="3" fill="#2B2B2B" />
        <Circle cx={rx} cy={ey + 2} r="3" fill="#2B2B2B" />
        <Path d={`M${lx - 6} ${ey - 5} q6 -3 12 0`} stroke="#2B2B2B" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d={`M${rx - 6} ${ey - 5} q6 -3 12 0`} stroke="#2B2B2B" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  const white = kind === 'happy' ? 8 : kind === 'half' ? 6 : 7;
  const pupil = kind === 'half' ? 3 : 3.6;
  const py = kind === 'happy' ? ey - 1 : ey;
  return (
    <>
      <Circle cx={lx} cy={ey} r={white} fill="#FFF" />
      <Circle cx={rx} cy={ey} r={white} fill="#FFF" />
      <Circle cx={lx + 1} cy={py} r={pupil} fill="#1A1A1A" />
      <Circle cx={rx + 1} cy={py} r={pupil} fill="#1A1A1A" />
      <Circle cx={lx + 2.5} cy={py - 1.5} r="1.2" fill="#FFF" />
      <Circle cx={rx + 2.5} cy={py - 1.5} r="1.2" fill="#FFF" />
    </>
  );
}

function Mouth({ kind, cy }: { kind: Look['mouth']; cy: number }) {
  const my = cy + 12;
  const stroke = '#5A3A2A';
  switch (kind) {
    case 'grin':
      return <Path d={`M50 ${my} q10 12 20 0 q-10 5 -20 0 Z`} fill="#7A2E3A" />;
    case 'smile':
      return <Path d={`M52 ${my} q8 7 16 0`} stroke={stroke} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
    case 'flat':
      return <Path d={`M53 ${my} h14`} stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'frown':
      return <Path d={`M52 ${my + 3} q8 -7 16 0`} stroke={stroke} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'sleep':
      return <Path d={`M55 ${my} q5 3 10 0`} stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}
