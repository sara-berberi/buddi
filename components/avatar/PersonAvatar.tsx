import Svg, { Circle, Ellipse, G, Path, Rect, Defs, ClipPath } from 'react-native-svg';
import { View } from 'react-native';
import type { AvatarConfig } from '../../types';
import { DEFAULT_AVATAR } from '../../types';

interface Props {
  config?: AvatarConfig | null;
  size?: number;
  ring?: boolean; // draw a subtle border ring
}

// A friendly, Bitmoji-style person head rendered entirely in SVG so it works
// on web + native and matches the design system. Drawn in a 100x100 viewBox.
export function PersonAvatar({ config, size = 64, ring = false }: Props) {
  const a = config ?? DEFAULT_AVATAR;
  const skinShadow = shade(a.skin, -18);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id="circle">
            <Circle cx="50" cy="50" r="50" />
          </ClipPath>
        </Defs>

        <G clipPath="url(#circle)">
          {/* Background */}
          <Rect x="0" y="0" width="100" height="100" fill={a.bg} />

          {/* Shoulders / body */}
          <Ellipse cx="50" cy="104" rx="34" ry="30" fill={shade(a.bg, -22)} />
          <Ellipse cx="50" cy="106" rx="28" ry="26" fill={a.skin} />

          {/* Neck */}
          <Rect x="42" y="62" width="16" height="20" rx="7" fill={skinShadow} />

          {/* Ears */}
          <Circle cx="28" cy="46" r="6" fill={a.skin} />
          <Circle cx="72" cy="46" r="6" fill={a.skin} />

          {/* Head */}
          <Ellipse cx="50" cy="44" rx="24" ry="26" fill={a.skin} />

          {/* Hair (behind/over head depending on style) */}
          <Hair style={a.hair} color={a.hairColor} />

          {/* Eyebrows */}
          <Path d="M34 38 Q39 35 44 38" stroke={shade(a.hairColor, -10)} strokeWidth="2" fill="none" strokeLinecap="round" />
          <Path d="M56 38 Q61 35 66 38" stroke={shade(a.hairColor, -10)} strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Eyes */}
          <Ellipse cx="40" cy="45" rx="3.4" ry="4" fill="#2B2B2B" />
          <Ellipse cx="60" cy="45" rx="3.4" ry="4" fill="#2B2B2B" />
          <Circle cx="41.2" cy="43.6" r="1" fill="#FFF" />
          <Circle cx="61.2" cy="43.6" r="1" fill="#FFF" />

          {/* Nose */}
          <Path d="M50 47 Q52 52 49 53" stroke={skinShadow} strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* Smile */}
          <Path d="M42 57 Q50 64 58 57" stroke="#9A4B3B" strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {/* Accessory on top */}
          <Accessory kind={a.accessory} hairColor={a.hairColor} />
        </G>

        {ring && <Circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />}
      </Svg>
    </View>
  );
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'bald':
      return null;
    case 'buzz':
      return <Path d="M26 40 Q50 14 74 40 Q70 26 50 24 Q30 26 26 40 Z" fill={color} opacity={0.85} />;
    case 'short':
      return (
        <Path
          d="M25 44 Q24 18 50 17 Q76 18 75 44 Q70 30 60 28 Q55 33 50 33 Q45 33 40 28 Q30 30 25 44 Z"
          fill={color}
        />
      );
    case 'curly':
      return (
        <G fill={color}>
          <Circle cx="30" cy="28" r="9" />
          <Circle cx="42" cy="22" r="9" />
          <Circle cx="54" cy="21" r="9" />
          <Circle cx="66" cy="26" r="9" />
          <Circle cx="72" cy="36" r="8" />
          <Circle cx="26" cy="38" r="8" />
        </G>
      );
    case 'bun':
      return (
        <G fill={color}>
          <Circle cx="50" cy="14" r="8" />
          <Path d="M25 44 Q24 18 50 17 Q76 18 75 44 Q70 30 60 28 Q55 33 50 33 Q45 33 40 28 Q30 30 25 44 Z" />
        </G>
      );
    case 'long':
      return (
        <G fill={color}>
          {/* long hair falls along the sides */}
          <Path d="M22 44 Q20 16 50 15 Q80 16 78 44 L78 74 Q72 70 70 50 Q66 32 50 31 Q34 32 30 50 Q28 70 22 74 Z" />
        </G>
      );
    default:
      return (
        <Path d="M25 44 Q24 18 50 17 Q76 18 75 44 Q70 30 60 28 Q55 33 50 33 Q45 33 40 28 Q30 30 25 44 Z" fill={color} />
      );
  }
}

function Accessory({ kind, hairColor }: { kind: string; hairColor: string }) {
  switch (kind) {
    case 'glasses':
      return (
        <G stroke="#33332E" strokeWidth="2" fill="none">
          <Circle cx="40" cy="45" r="7" />
          <Circle cx="60" cy="45" r="7" />
          <Path d="M47 45 L53 45" />
        </G>
      );
    case 'sunglasses':
      return (
        <G>
          <Circle cx="40" cy="45" r="7.5" fill="#26262B" />
          <Circle cx="60" cy="45" r="7.5" fill="#26262B" />
          <Path d="M47 45 L53 45" stroke="#26262B" strokeWidth="2" />
        </G>
      );
    case 'earrings':
      return (
        <G fill="#E6B84B">
          <Circle cx="28" cy="54" r="2.4" />
          <Circle cx="72" cy="54" r="2.4" />
        </G>
      );
    case 'hat':
      return (
        <G fill={shade(hairColor, -30)}>
          <Rect x="24" y="20" width="52" height="8" rx="4" />
          <Path d="M30 22 Q50 4 70 22 Z" />
        </G>
      );
    default:
      return null;
  }
}

// Lighten/darken a hex color by a percentage (-100..100).
function shade(hex: string, percent: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const amt = Math.round(2.55 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
