import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BodyArea } from '../db/types';

export type TabParamList = {
  Home: undefined;
  Reminders: undefined;
  Exercises: undefined;
  Stats: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Profile: undefined;
  ExerciseRun: { exerciseId?: number; random?: boolean; bodyArea?: BodyArea } | undefined;
  ReminderFire: { reminderTypeId: number; scheduledAt?: string } | undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
