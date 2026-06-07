import { PlantSVG } from './PlantSVG';
import { CreatureSVG } from './CreatureSVG';
import type { CompanionType, HealthState } from '../../types';

interface Props {
  type: CompanionType;
  health: HealthState;
  stemColor?: string;
  size?: number;
}

// Renders the user's chosen companion (plant or creature) for a friendship.
// Health drives the visual the same way for both.
export function Companion({ type, health, stemColor, size }: Props) {
  if (type === 'creature') {
    return <CreatureSVG health={health} stemColor={stemColor} size={size} />;
  }
  return <PlantSVG health={health} stemColor={stemColor} size={size} />;
}
