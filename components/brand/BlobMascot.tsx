import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '../../lib/constants';

type Mood = 'happy' | 'wink' | 'sleepy' | 'excited';

interface Props {
  size?: number;
  color?: string; // blob body color
  mood?: Mood;
  animated?: boolean; // idle bounce + blink (default on)
}

// A friendly googly-eyed blob, in the spirit of the reference branding.
// Idle-animated (gentle bounce + occasional blink) so the app feels alive.
export function BlobMascot({ size = 96, color = colors.bubble, mood = 'happy', animated = true }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated, bounce]);

  useEffect(() => {
    if (!animated || mood === 'sleepy' || mood === 'wink') return;
    let alive = true;
    const schedule = () => {
      const next = 2200 + Math.random() * 2600;
      return setTimeout(() => {
        if (!alive) return;
        setBlinking(true);
        setTimeout(() => alive && setBlinking(false), 130);
        timer = schedule();
      }, next);
    };
    let timer = schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [animated, mood]);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const effectiveMood: Mood = blinking ? 'sleepy' : mood;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {/* soft shadow */}
          <Ellipse cx="50" cy="92" rx="30" ry="5" fill="rgba(0,0,0,0.06)" />

          {/* blob body — a rounded dome with a slightly wobbly base */}
          <Path
            d="M50 14
               C24 14 16 38 16 56
               C16 78 30 90 50 90
               C70 90 84 78 84 56
               C84 38 76 14 50 14 Z"
            fill={color}
          />

          <Eyes mood={effectiveMood} />
          <Mouth mood={mood} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'wink') {
    return (
      <>
        <Path d="M34 50 q5 -5 10 0" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Circle cx="62" cy="50" r="6" fill="#1A1A1A" />
        <Circle cx="64" cy="48" r="2" fill="#FFF" />
      </>
    );
  }
  if (mood === 'sleepy') {
    return (
      <>
        <Path d="M32 52 q6 4 12 0" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M56 52 q6 4 12 0" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  }
  const r = mood === 'excited' ? 8 : 6;
  return (
    <>
      <Circle cx="38" cy="50" r={r} fill="#1A1A1A" />
      <Circle cx="62" cy="50" r={r} fill="#1A1A1A" />
      <Circle cx="40" cy="48" r="2" fill="#FFF" />
      <Circle cx="64" cy="48" r="2" fill="#FFF" />
    </>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'excited':
      return <Path d="M40 64 q10 12 20 0 q-10 4 -20 0 Z" fill="#7A1238" />;
    case 'sleepy':
      return <Path d="M44 66 q6 4 12 0" stroke="#7A1238" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    default:
      return <Path d="M40 64 q10 8 20 0" stroke="#7A1238" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}
