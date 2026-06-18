# Standy

> Standy got your back. Literally.

A local-first, single-user wellness reminder app that nudges desk workers to take healthy micro-breaks: standing up, drinking water, resting their eyes, fixing posture, and doing short stretches.

No registration, no login, no cloud sync. Everything lives on the device.

## Architecture note (important)

The original spec described a separate FastAPI + SQLite backend running on `localhost`, consumed by the React Native app over HTTP. As the spec itself flagged, bundling a Python server inside a mobile app store build is impractical.

This implementation uses the recommended local-first approach instead: **persistence is embedded directly in the app via `expo-sqlite`**, and the REST endpoints from the spec are implemented as a typed internal service layer (`src/services/`). The mapping is one-to-one:

| Spec endpoint | Service function (`src/services`) |
| --- | --- |
| `GET/PUT /profile` | `getProfile` / `updateProfile` |
| `GET/PUT /settings/reminders` | `getReminderSettings` / `updateReminderSettings` / `setDnd` |
| `GET/POST/PUT/DELETE /reminder-types` | `getReminderTypes` / `createReminderType` / `updateReminderType` / `deleteReminderType` |
| `POST /reminders/{id}/done\|skip\|snooze` | `logReminderAction` |
| `GET /exercises` | `getExercises` |
| `GET /exercises/random?body_area=` | `getRandomExercise` |
| `POST /exercises/{id}/done\|skip` | `logExerciseAction` |
| `GET /stats/daily?range=` | `getDailyStats` |
| `GET /stats/streak` | `getStreak` |
| `GET /stats/heatmap?weeks=` | `getHeatmap` |

If you ever do need a real server (e.g. to sync across devices), the service layer is the single seam to swap SQLite calls for `fetch` calls.

## Tech stack

- **Expo (managed) + React Native + TypeScript**
- **React Navigation** — native-stack root + bottom tabs with a custom floating pill bar and center FAB
- **expo-sqlite** — on-device database (schema mirrors the spec's SQLAlchemy models)
- **expo-notifications** — local notifications that fire when the app is backgrounded
- **expo-image-picker** — optional profile photo
- **react-native-reanimated** + **react-native-svg** — animated progress/countdown rings, bar chart, heatmap, press feedback, entrance and completion animations
- **@expo/vector-icons** — monochrome iconography

## Project structure

```
App.tsx                  App bootstrap, navigation, notification listeners
src/
  theme/                 Monochrome design tokens (colors, spacing, radii, shadows)
  db/                    SQLite client, schema (CREATE TABLE), seed data, types
  services/              Data-access layer mirroring the spec endpoints
  notifications/         Reminder scheduler, rotation, quiet hours, DND, snooze
  components/            Reusable UI (Card, ProgressRing, BarChart, Heatmap, FloatingTabBar, ...)
  navigation/            Root stack + tab navigator + param types
  screens/               Onboarding, Home, Reminders, Exercises, ExerciseRun, Stats, ReminderFire
```

## Getting started

```bash
npm install
npx expo start
```

Then press `a` for an Android emulator/device, `i` for iOS (macOS only), or scan the QR code with the Expo Go app / a development build.

To validate a production bundle without a device:

```bash
npx expo export --platform android
```

## Features

- **Onboarding / Profile** — optional display name and photo; a Skip option is always available. Greeting reads "Hello, {name}" or a friendly fallback.
- **Reminders engine** — global interval (30/45/60/90 min), sequential rotation across enabled reminder types, quiet-hours windows, on-demand Do Not Disturb (30/60 min or until resumed), and snooze. All state persists in SQLite.
- **Reminder fire modal** — Done / Skip / Snooze 5 min, with a celebratory checkmark animation; movement reminders offer "Stretch now".
- **Exercise library** — searchable, filterable by body area, with a run screen featuring an animated depleting countdown ring and Done/Skipped logging.
- **Statistics** — summary cards, a monochrome completed-vs-skipped bar chart, a streak counter, and a tappable GitHub-style heatmap.

### Streak rule

A day counts toward the streak when at least one prompt was completed **and** the day's completion rate is **>= 80%** (`STREAK_THRESHOLD` in `src/services/stats.ts`). Today does not break the streak while it is still in progress.

### Rotation logic

`pickNextReminderType()` in `src/notifications/scheduler.ts` defaults to **sequential** rotation over enabled types and is isolated so it can be swapped for random/weighted selection (a `random` mode is already supported via `rotation_mode`).

## Platform limitations (flagged per spec section 8.7)

- **iOS background execution:** iOS does not allow arbitrary background timers. Reminders are delivered through OS-scheduled local notifications (we always pre-schedule exactly one next reminder), not a live in-app countdown running in the background. The on-screen ring is a visual aid only.
- **Quiet hours / DND:** honored by *not scheduling* notifications inside those windows rather than firing-then-suppressing.
- **Notification permissions:** users must grant notification permission; reminders will not fire if denied. The in-app modal still works while the app is open.
- **Single pending reminder:** the scheduler keeps exactly one pending notification and chains the next one when a reminder fires or the user acts. If the OS drops a scheduled notification (e.g. force-quit on some Android OEMs), the chain re-arms the next time the app is opened.
- **No bundled server:** there is intentionally no FastAPI/Python process. See the architecture note above.
