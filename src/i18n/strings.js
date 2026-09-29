export const STRINGS = {
  appName: { en: 'CarriageSense', zh: '车厢感知' },
  navHome: { en: 'Home', zh: '首页' },
  navPlan: { en: 'Plan', zh: '规划' },
  navPlatform: { en: 'Platform', zh: '月台' },
  navOnboard: { en: 'On Board', zh: '车上' },

  // Home screen
  forecast: { en: 'Forecast', zh: '预测' },
  live: { en: 'Live', zh: '实时' },
  confidence: { en: 'confidence', zh: '置信度' },
  networkNow: { en: 'Network right now', zh: '当前网络状况' },
  walkToStation: { en: 'Walk to station', zh: '到车站步行时间' },
  nextTrains: { en: 'Next trains', zh: '下一班列车' },
  suggestion: { en: 'Suggestion', zh: '建议' },
  leaveNow: { en: 'Leave now — clear run ahead', zh: '现在出发 — 前方畅通' },
  waitMinutes: { en: 'Wait {n} min for a quieter train', zh: '等待{n}分钟乘坐较空的列车' },
  min: { en: 'min', zh: '分钟' },
  planTripCta: { en: 'Plan my trip', zh: '规划行程' },

  // Plan screen
  planTitle: { en: 'Plan your trip', zh: '规划您的行程' },
  origin: { en: 'Origin', zh: '起点' },
  destination: { en: 'Destination', zh: '终点' },
  preferredExit: { en: 'Preferred exit', zh: '偏好出口' },
  journeyBreakdown: { en: 'Journey breakdown', zh: '行程细分' },
  walking: { en: 'Walking', zh: '步行' },
  waiting: { en: 'Waiting', zh: '等待' },
  riding: { en: 'Riding', zh: '乘车' },
  totalTime: { en: 'Total time', zh: '总时间' },
  goToPlatform: { en: 'Go to platform', zh: '前往月台' },

  // Platform screen
  platformTitle: { en: 'Approaching train', zh: '列车进站' },
  trainId: { en: 'Train', zh: '列车' },
  arrivesIn: { en: 'Arrives in', zh: '到站时间' },
  sec: { en: 's', zh: '秒' },
  car: { en: 'Car', zh: '车厢' },
  nearestExit: { en: 'Nearest to {exit}', zh: '最靠近{exit}' },
  recommended: { en: 'Recommended', zh: '推荐' },
  full: { en: 'Full', zh: '满载' },
  boardTrain: { en: 'Board train', zh: '登车' },
  liveSince: { en: 'Switched to live data', zh: '已切换为实时数据' },
  toPlatform: { en: 'to platform', zh: '至月台' },
  tradeoffSame: {
    en: 'Car {rec} is closest to {exit} and has the most space.',
    zh: '{rec}号车厢最靠近{exit}，且空间最为宽松。',
  },
  tradeoffDiff: {
    en: 'Car {rec} has space and is a {dist}m walk to {exit}, while Car {near} stops at the exit but is {pct}% full.',
    zh: '{rec}号车厢较空，距{exit}步行约{dist}米；而{near}号车厢直接停靠出口，但载客率已达{pct}%。',
  },

  // On board screen
  onboardTitle: { en: 'On board', zh: '车上' },
  currentStation: { en: 'Current station', zh: '当前车站' },
  stationsRemaining: { en: 'stations remaining', zh: '个车站剩余' },
  doorSide: { en: 'Door side', zh: '车门方向' },
  left: { en: 'Left', zh: '左侧' },
  right: { en: 'Right', zh: '右侧' },
  exitLabel: { en: 'Exit', zh: '出口' },
  reminderCrowded: {
    en: 'This carriage is busy — please move down if you can.',
    zh: '本车厢较为拥挤，请尽量往车厢内移动。',
  },
  reminderDoors: {
    en: 'Doors will open on the {side} at the next station.',
    zh: '下一站车门将在{side}打开。',
  },
  reminderBelongings: {
    en: 'Please mind the gap and take your belongings with you.',
    zh: '请小心间隙，并携带好您的随身物品。',
  },
  arrivingAt: { en: 'Arriving at', zh: '即将到达' },

  // Demo + language
  demoMode: { en: 'Demo mode', zh: '演示模式' },
  stopDemo: { en: 'Stop demo', zh: '停止演示' },
  crowded: { en: 'Crowded', zh: '拥挤' },
  moderate: { en: 'Moderate', zh: '适中' },
  clear: { en: 'Clear', zh: '畅通' },
};

export function t(key, lang, vars) {
  const entry = STRINGS[key];
  let str = entry ? entry[lang] || entry.en : key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v);
    });
  }
  return str;
}
