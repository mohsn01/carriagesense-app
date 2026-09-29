import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  generateNetworkSnapshot,
  generateTrainSnapshot,
  HOME_STATION,
  DEFAULT_DESTINATION,
  DEFAULT_EXIT,
} from '../data/simulationData';

const SimulationContext = createContext(null);

// A journey moves through these moments; the platform screen is where the
// forecast becomes a live feed (proximity to the physical train).
const SCREENS = ['home', 'plan', 'platform', 'onboard'];

export function SimulationProvider({ children }) {
  const [tick, setTick] = useState(0); // simulated seconds elapsed
  const [screen, setScreen] = useState('home');
  const [origin, setOrigin] = useState(HOME_STATION);
  const [destination, setDestination] = useState(DEFAULT_DESTINATION);
  const [exit, setExit] = useState(DEFAULT_EXIT);
  const [demoMode, setDemoMode] = useState(false);
  // Distance-to-platform in metres; once it drops under this, forecast -> live.
  const [approachDistanceM, setApproachDistanceM] = useState(400);

  const intervalRef = useRef(null);
  const demoTimeoutsRef = useRef([]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
      setApproachDistanceM((d) => (screen === 'platform' ? Math.max(0, d - 35) : d));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [screen]);

  // Reset the approach distance whenever the platform screen is (re)entered.
  useEffect(() => {
    if (screen === 'platform') setApproachDistanceM(400);
  }, [screen]);

  const isLive = screen === 'platform' && approachDistanceM <= 150;

  const network = generateNetworkSnapshot(tick);
  const train = generateTrainSnapshot(tick, destination);

  function startDemo() {
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setDemoMode(true);
    setScreen('home');
    const plan = setTimeout(() => setScreen('plan'), 4000);
    const platform = setTimeout(() => setScreen('platform'), 8500);
    const onboard = setTimeout(() => setScreen('onboard'), 15500);
    const end = setTimeout(() => setDemoMode(false), 22000);
    demoTimeoutsRef.current = [plan, platform, onboard, end];
  }

  function stopDemo() {
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];
    setDemoMode(false);
  }

  useEffect(() => () => demoTimeoutsRef.current.forEach(clearTimeout), []);

  const value = {
    tick,
    screen,
    setScreen,
    origin,
    setOrigin,
    destination,
    setDestination,
    exit,
    setExit,
    network,
    train,
    isLive,
    approachDistanceM,
    demoMode,
    startDemo,
    stopDemo,
    screens: SCREENS,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
