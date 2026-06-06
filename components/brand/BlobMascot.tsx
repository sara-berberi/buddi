import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { View } from 'react-native';
import { colors } from '../../lib/constants';

type Mood = 'happy' | 'wink' | 'sleepy' | 'excited';

interface Props {
  size?: number;
  color?: string; // blob body color
  mood?: Mood;
}

// A friendly googly-eyed blob, in the spirit of the reference branding.
// Used as the app mascot in headers, empty states, and the feed composer.
export function BlobMascot({ size = 96, color = colors.bubble, mood = 'happy' }: Props) {
  return (
    <View style={{ width: size, height: size }}>
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

        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </Svg>
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
