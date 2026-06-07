import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors } from '../../lib/constants';

// Custom rounded line-icon set — replaces emoji throughout the app for a
// consistent, original, cutesy look. Stroke-based, inherits a single color.
export type IconName =
  | 'home'
  | 'daily'
  | 'tonight'
  | 'garden'
  | 'profile'
  | 'heart'
  | 'heartFilled'
  | 'repost'
  | 'link'
  | 'send'
  | 'mail'
  | 'lock'
  | 'search'
  | 'close'
  | 'edit'
  | 'dice'
  | 'sparkle'
  | 'arrow';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean; // for heart etc.
}

export function Icon({ name, size = 24, color = colors.ink, filled }: Props) {
  const sw = 2.2; // stroke width, rounded
  const common = {
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {render(name, color, common, filled)}
    </Svg>
  );
}

function render(name: IconName, color: string, c: any, filled?: boolean) {
  switch (name) {
    case 'home':
      return (
        <>
          <Path d="M4 11 L12 4 L20 11" {...c} />
          <Path d="M6 10 V19 a1 1 0 0 0 1 1 H17 a1 1 0 0 0 1 -1 V10" {...c} />
        </>
      );
    case 'daily': // sun/sparkle for the daily question
      return (
        <>
          <Circle cx="12" cy="12" r="4.5" {...c} />
          <Line x1="12" y1="2.5" x2="12" y2="5" {...c} />
          <Line x1="12" y1="19" x2="12" y2="21.5" {...c} />
          <Line x1="2.5" y1="12" x2="5" y2="12" {...c} />
          <Line x1="19" y1="12" x2="21.5" y2="12" {...c} />
          <Line x1="5.5" y1="5.5" x2="7.2" y2="7.2" {...c} />
          <Line x1="16.8" y1="16.8" x2="18.5" y2="18.5" {...c} />
        </>
      );
    case 'tonight': // star
      return (
        <Path
          d="M12 3 L14.3 8.6 L20.4 9.1 L15.8 13.1 L17.2 19 L12 15.8 L6.8 19 L8.2 13.1 L3.6 9.1 L9.7 8.6 Z"
          stroke={color}
          strokeWidth={c.strokeWidth}
          strokeLinejoin="round"
          fill={filled ? color : 'none'}
        />
      );
    case 'garden': // sprout / two leaves
      return (
        <>
          <Path d="M12 21 V11" {...c} />
          <Path d="M12 13 C8 13 6 10 6 7 C10 7 12 9 12 13 Z" {...c} />
          <Path d="M12 12 C16 12 18 9 18 6 C14 6 12 8 12 12 Z" {...c} />
        </>
      );
    case 'profile':
      return (
        <>
          <Circle cx="12" cy="8" r="3.6" {...c} />
          <Path d="M5 20 C5 15.5 8.5 13.5 12 13.5 C15.5 13.5 19 15.5 19 20" {...c} />
        </>
      );
    case 'heart':
    case 'heartFilled':
      return (
        <Path
          d="M12 20 C12 20 3.5 14.5 3.5 8.8 C3.5 6 5.6 4 8.2 4 C9.9 4 11.3 5 12 6.2 C12.7 5 14.1 4 15.8 4 C18.4 4 20.5 6 20.5 8.8 C20.5 14.5 12 20 12 20 Z"
          stroke={color}
          strokeWidth={c.strokeWidth}
          strokeLinejoin="round"
          fill={name === 'heartFilled' || filled ? color : 'none'}
        />
      );
    case 'repost':
      return (
        <>
          <Path d="M5 8 H16 a2 2 0 0 1 2 2 V12" {...c} />
          <Path d="M8 5 L5 8 L8 11" {...c} />
          <Path d="M19 16 H8 a2 2 0 0 1 -2 -2 V12" {...c} />
          <Path d="M16 19 L19 16 L16 13" {...c} />
        </>
      );
    case 'link':
      return (
        <>
          <Path d="M9.5 14.5 L14.5 9.5" {...c} />
          <Path d="M8 12 L6.5 13.5 a3.5 3.5 0 0 0 5 5 L13 16" {...c} />
          <Path d="M16 12 L17.5 10.5 a3.5 3.5 0 0 0 -5 -5 L11 8" {...c} />
        </>
      );
    case 'send':
      return (
        <Path d="M4 12 L20 5 L14 20 L11.5 13.5 Z" stroke={color} strokeWidth={c.strokeWidth} strokeLinejoin="round" fill={filled ? color : 'none'} />
      );
    case 'mail':
      return (
        <>
          <Path d="M3.5 6.5 a1 1 0 0 1 1 -1 H19.5 a1 1 0 0 1 1 1 V17.5 a1 1 0 0 1 -1 1 H4.5 a1 1 0 0 1 -1 -1 Z" {...c} />
          <Path d="M4 7 L12 13 L20 7" {...c} />
        </>
      );
    case 'lock':
      return (
        <>
          <Path d="M6.5 11 H17.5 a1 1 0 0 1 1 1 V19 a1 1 0 0 1 -1 1 H6.5 a1 1 0 0 1 -1 -1 V12 a1 1 0 0 1 1 -1 Z" {...c} />
          <Path d="M8.5 11 V8 a3.5 3.5 0 0 1 7 0 V11" {...c} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx="11" cy="11" r="6" {...c} />
          <Line x1="15.5" y1="15.5" x2="20" y2="20" {...c} />
        </>
      );
    case 'close':
      return (
        <>
          <Line x1="6" y1="6" x2="18" y2="18" {...c} />
          <Line x1="18" y1="6" x2="6" y2="18" {...c} />
        </>
      );
    case 'edit':
      return (
        <>
          <Path d="M14 5 L19 10 L9 20 L4 20 L4 15 Z" {...c} />
          <Line x1="13" y1="6" x2="18" y2="11" {...c} />
        </>
      );
    case 'dice':
      return (
        <>
          <Path d="M5 5 H19 a0 0 0 0 1 0 0 V19 H5 Z" {...c} />
          <Circle cx="9" cy="9" r="1.1" fill={color} stroke="none" />
          <Circle cx="15" cy="15" r="1.1" fill={color} stroke="none" />
          <Circle cx="15" cy="9" r="1.1" fill={color} stroke="none" />
          <Circle cx="9" cy="15" r="1.1" fill={color} stroke="none" />
        </>
      );
    case 'sparkle':
      return (
        <Path d="M12 3 C12 8 13 9 18 12 C13 15 12 16 12 21 C12 16 11 15 6 12 C11 9 12 8 12 3 Z" stroke={color} strokeWidth={c.strokeWidth} strokeLinejoin="round" fill={filled ? color : 'none'} />
      );
    case 'arrow':
      return (
        <>
          <Line x1="4" y1="12" x2="19" y2="12" {...c} />
          <Path d="M13 6 L19 12 L13 18" {...c} />
        </>
      );
    default:
      return null;
  }
}
