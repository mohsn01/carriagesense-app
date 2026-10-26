# CarriageSense

A Guangzhou Metro journey planner with live GPS tracking. Tell it where you are
(or where home is) and where you are going, and it shows:

- the **nearest stations** and which **lines** serve them
- which line and direction to take, where to **change**, and which **exit** to use
- the **next train** and the **arrival time** if you leave now, in 5, 10, 15, 20 or 30 minutes
- the **next trains** with minutes until each one, ride time, door-to-door time and an **estimated crowding level** (Quiet / Moderate / Busy / Very crowded)
- **rush hour** at a station: is it busy now, when does it ease, and when is the quietest time in the next 3 hours
- a **departure board** for any station you tap on the map
- a live **trip tracker**: your GPS position on the map, distance to the station,
  stops left, and an ETA that updates as you move

English and 中文, light and dark mode, larger-text mode, phone and tablet layouts.

## Run it

```bash
npm install
npm run dev
```

On a laptop the app appears in a device frame with a **Phone / Tablet** switch.
Press **Demo** in the header to try a whole journey (home near Tiyu Xilu → Baiyun
Airport) with a simulated GPS. No travelling needed. The demo never starts a trip by itself:
it waits, with time paused, until you decide.

## Deciding whether to go

Before you scan in at a gate you can check whether the trip is worth it:

- **Should you go?** shows how crowded the station should be when you arrive and how crowded your train
  should be, with a reminder that once you tap in it is hard to turn back. If it will be busy, the main button
  turns into a red **Go anyway**, and the app suggests leaving later.
- **Other ways to get there** compares the metro with a taxi / ride-hail, bus, bike and walking (time, arrival,
  approximate price, traffic). These are **estimates from distance and time of day** with no live bus or traffic
  data, and taxi prices are approximate.

## Presenting the demo

- **Time of day (demo only):** while the demo is waiting for your decision, chips let you jump between
  *Morning rush, Lunch, Before the rush, Evening rush* and *Late* to show how the same trip changes. Time stays
  paused until you press **Start trip**, then it runs at 14x.

- **Leave time:** on Plan, pick *Leave now*, 5, 10, 15, 20 or 30 minutes, or type any number of
  minutes. The next train at your station, the arrival time and the crowding are all calculated for that
  moment. If the metro is closed, it shows the first train (*"tomorrow 06:02"* when that is the next day).
- **Demo controls (Trip tab):** buttons such as *I arrived at the station*, *I boarded the train*, *Next stop*,
  *Skip to my stop* and *Finish trip* jump the clock forward, so every time, ETA and stop count updates without waiting.
- **Station sensor (demo):** pick *Quiet / Moderate / Busy / Packed* to simulate a reading from the station's crowd
  sensor. The plan reacts: it recommends leaving later, and on the platform it can suggest waiting for a calmer train.
  The effect eases back to the normal estimate within about 15 minutes. It is labelled **Demo** on screen.
- Demo controls and the station sensor appear automatically while the **Demo** button is running. To use them on
  your own trips, turn on **Me → Presenter tools**.

## Connecting real crowd data later

Crowding today is an estimate (see below). When a station or transit agency can provide measurements, the app
already has the plumbing:

1. Provide an endpoint that returns the latest readings:
   `[ { "station": "tiyuxilu", "pct": 78, "ts": 1760000000000 } ]`
   (`station` is an id from `src/data/gzMetro.js`, `pct` is 0-100 for how full it is now, `ts` is optional).
2. Set `VITE_CROWD_API_URL` to that URL (for example in a `.env` file) and rebuild. The app polls it every 30 seconds
   ([`src/lib/crowdFeed.js`](src/lib/crowdFeed.js)).
3. Readings override the model for that station, then ease back to it if the feed goes quiet. Everything (next trains,
   rush hour chart, recommendations, "wait for a calmer train") already reacts to them.

From your own code you can also call `setStationReading(stationId, pct, { source: 'live' })` from
[`src/lib/crowd.js`](src/lib/crowd.js).

## How the trip tracker works

| Situation | What the app uses |
| --- | --- |
| Walking to the station | Live GPS. Distance and walking time are re-measured every fix; a slow walk can mean a later train |
| Waiting on the platform | Timetable (next departure) |
| On the train | Timetable estimate. GPS rarely works underground, so the app says *"GPS weak · estimating from timetable"* and counts stops |
| Leaving the station | Exit guidance, then GPS for the final walk |

"Get off at the next stop" and "change trains" make the phone vibrate. The screen is kept awake during a trip.

## Data: what is real and what is approximate

- **Network:** Lines 1, 2, 3 (+ airport branch), 5, 6 and 8, in [`src/data/gzMetro.js`](src/data/gzMetro.js).
  Station coordinates are **hand-placed approximations** (usually within a few hundred metres) and the
  station lists should be verified before any public release. Adding or fixing a station is one line in that file.
- **Crowding and rush hour:** an **estimate**, not live passenger counts (none are publicly available). It models the weekday morning and evening peaks, quieter midday and weekends, the direction of travel (towards the centre in the morning, away in the evening) and how central or interchange-heavy a station is. See [`src/lib/crowd.js`](src/lib/crowd.js); the constants are easy to tune against real ridership data.
- **Train times:** **timetable estimates** from per-line headways (peak / daytime / late). There is no free
  real-time arrivals feed, so these are not live. The UI says so.
- **Map:** OpenStreetMap tiles (needs internet; the metro lines still draw offline).
- **Address search:** OpenStreetMap Nominatim (internet). Stations and landmarks search works offline.
- **Exit letters:** looked up live from OpenStreetMap station entrances (Overpass, internet). If a station has no
  mapped exits, the app falls back to a compass direction ("exit on the north-east side").

## Build the Android APK

Needs Android Studio (or the Android SDK) and JDK 21.

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. The app asks for
location permission the first time you use **My location**.

## iPhone / iPad

- **Now, no Mac needed:** deploy the built `dist/` folder to any **HTTPS** host, open it in Safari and
  choose **Share → Add to Home Screen**. GPS requires HTTPS.
- **Native iOS app:** needs a Mac with Xcode. Run `npm i @capacitor/ios`, `npx cap add ios`,
  `npm run build && npx cap sync ios`, then `npx cap open ios`. Add a
  `NSLocationWhenInUseUsageDescription` entry to `Info.plist`.

## Limits worth knowing

- Tracking runs while the app is open. Continuing in the background with the screen off needs a native
  background-location plugin.
- Only the lines listed above are included.
