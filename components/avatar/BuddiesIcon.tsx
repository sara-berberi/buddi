import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors } from '../../lib/constants';

// Two little buddies standing together — used in empty states for warmth.
// Gently sways so empty states feel alive.
export function BuddiesIcon({ size = 120 }: { size?: number }) {
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);
  const translateY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* ground shadow */}
        <Ellipse cx="60" cy="104" rx="40" ry="6" fill="rgba(0,0,0,0.06)" />

        {/* left buddy */}
        <Path d="M30 100 Q30 72 44 72 Q58 72 58 100 Z" fill={colors.forest} />
        <Circle cx="44" cy="58" r="13" fill="#E8B894" />
        <Path d="M32 56 Q33 42 44 42 Q55 42 56 56 Q52 49 44 49 Q36 49 32 56 Z" fill="#3A2A1A" />
        <Circle cx="40" cy="58" r="1.6" fill="#2B2B2B" />
        <Circle cx="48" cy="58" r="1.6" fill="#2B2B2B" />
        <Path d="M40 63 Q44 66 48 63" stroke="#9A4B3B" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* right buddy */}
        <Path d="M62 100 Q62 70 76 70 Q90 70 90 100 Z" fill={colors.amber} />
        <Circle cx="76" cy="56" r="13" fill="#C68642" />
        <Path d="M64 54 Q65 40 76 40 Q87 40 88 54 Q88 46 76 46 Q64 46 64 54 Z" fill="#1A1310" />
        <Circle cx="72" cy="56" r="1.6" fill="#2B2B2B" />
        <Circle cx="80" cy="56" r="1.6" fill="#2B2B2B" />
        <Path d="M72 61 Q76 64 80 61" stroke="#7A2E22" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* little connecting hearts */}
        <Path d="M60 78 l3 3 l3 -3 a2 2 0 0 0 -3 -2 a2 2 0 0 0 -3 2 Z" fill="#D65A7E" />
      </Svg>
    </Animated.View>
  );
}
