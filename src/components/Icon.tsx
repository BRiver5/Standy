import React from 'react';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const ICON_MAP: Record<string, FeatherName> = {
  // reminder types
  stand: 'user',
  water: 'droplet',
  eye: 'eye',
  posture: 'activity',
  bell: 'bell',
  // body areas
  neck: 'user',
  shoulders: 'chevrons-up',
  back: 'refresh-cw',
  eyes: 'eye',
  full: 'maximize',
  stretch: 'maximize',
  // ui
  home: 'home',
  reminders: 'bell',
  exercises: 'activity',
  stats: 'bar-chart-2',
  search: 'search',
  back_arrow: 'chevron-left',
  share: 'share',
  settings: 'sliders',
  play: 'play',
  check: 'check',
  skip: 'x',
  snooze: 'clock',
  flame: 'zap',
  done: 'check-circle',
  moon: 'moon',
  pause: 'pause',
  camera: 'camera',
  plus: 'plus',
  timer: 'clock',
  filter: 'sliders',
  chevron: 'chevron-right',
};

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.textPrimary }: IconProps) {
  const featherName = ICON_MAP[name] ?? 'circle';
  return <Feather name={featherName} size={size} color={color} />;
}
