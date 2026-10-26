// Guangzhou Metro network used by the planner.
//
// IMPORTANT: coordinates below are hand-placed approximations (usually within a
// few hundred metres) and the station lists cover Lines 1, 2, 3 (+ airport
// branch), 5, 6 and 8 only. Verify against official / OpenStreetMap data before
// any public release. Everything else in the app reads from this one file, so
// correcting a station or adding a line here is all that is needed.
//
// Station table format: id | English | 中文 | lat | lng
const STATION_TABLE = `
xilang|Xilang|西朗|23.0610|113.2330
kengkou|Kengkou|坑口|23.0730|113.2340
huadiwan|Huadiwan|花地湾|23.0840|113.2380
fangcun|Fangcun|芳村|23.0960|113.2400
huangsha|Huangsha|黄沙|23.1100|113.2440
changshoulu|Changshou Road|长寿路|23.1140|113.2480
chenjiaci|Chen Clan Academy|陈家祠|23.1255|113.2475
ximenkou|Ximenkou|西门口|23.1290|113.2560
gongyuanqian|Gongyuan Qian|公园前|23.1260|113.2640
nongjiangsuo|Nongjiangsuo|农讲所|23.1265|113.2800
lieshilingyuan|Martyrs' Park|烈士陵园|23.1270|113.2880
dongshankou|Dongshankou|东山口|23.1262|113.2960
yangji|Yangji|杨箕|23.1280|113.3040
tiyuxilu|Tiyu Xilu|体育西路|23.1325|113.3200
tiyuzhongxin|Tianhe Sports Center|体育中心|23.1360|113.3250
gzeast|Guangzhou East Railway Station|广州东站|23.1500|113.3260

jiahewanggang|Jiahewanggang|嘉禾望岗|23.2060|113.2790
huangbian|Huangbian|黄边|23.1945|113.2700
jiangxia|Jiangxia|江夏|23.1855|113.2640
xiaogangn|Xiaogang|萧岗|23.1785|113.2610
baiyunwenhua|Baiyun Cultural Square|白云文化广场|23.1715|113.2580
baiyungongyuan|Baiyun Park|白云公园|23.1650|113.2570
feixiang|Feixiang Park|飞翔公园|23.1595|113.2565
sanyuanli|Sanyuanli|三元里|23.1545|113.2555
gzrailway|Guangzhou Railway Station|广州火车站|23.1490|113.2570
yuexiupark|Yuexiu Park|越秀公园|23.1415|113.2630
jiniantang|Sun Yat-sen Memorial Hall|纪念堂|23.1335|113.2650
haizhu|Haizhu Square|海珠广场|23.1190|113.2640
shierga|Shi'ergong|市二宫|23.1090|113.2630
jiangnanxi|Jiangnanxi|江南西|23.0990|113.2610
changgang|Changgang|昌岗|23.0960|113.2640
jiangtailu|Jiangtailu|江泰路|23.0870|113.2680
dongxiaonan|Dongxiaonan|东晓南|23.0780|113.2700
nanzhou|Nanzhou|南洲|23.0640|113.2730
luoxi|Luoxi|洛溪|23.0485|113.2830
nanpu|Nanpu|南浦|23.0310|113.2770
huijiang|Huijiang|会江|23.0180|113.2730
shibi|Shibi|石壁|23.0060|113.2680
gznan|Guangzhou South Railway Station|广州南站|22.9900|113.2690

panyusquare|Panyu Square|番禺广场|22.9375|113.3600
shiqiao|Shiqiao|市桥|22.9470|113.3540
hanxi|Hanxi Changlong|汉溪长隆|22.9990|113.3260
dashi|Dashi|大石|23.0155|113.3170
xiajiao|Xiajiao|厦滘|23.0480|113.3140
lijiao|Lijiao|沥滘|23.0560|113.3230
datang|Datang|大塘|23.0680|113.3290
kecun|Kecun|客村|23.0972|113.3190
cantontower|Canton Tower|广州塔|23.1060|113.3235
zhujiangnewtown|Zhujiang New Town|珠江新城|23.1195|113.3205
shipaiqiao|Shipaiqiao|石牌桥|23.1380|113.3310
gangding|Gangding|岗顶|23.1390|113.3400
huashi|South China Normal University|华师|23.1420|113.3490
wushan|Wushan|五山|23.1470|113.3560
tianhebus|Tianhe Coach Terminal|天河客运站|23.1620|113.3500
linhexi|Linhexi|林和西|23.1440|113.3220
yantang|Yantang|燕塘|23.1640|113.3300
meihuayuan|Meihuayuan|梅花园|23.1750|113.3250
jingxi|Jingxi Nanfang Hospital|京溪南方医院|23.1840|113.3150
tonghe|Tonghe|同和|23.1930|113.3130
yongtai|Yongtai|永泰|23.2090|113.2940
baiyundadaobei|Baiyun Dadao North|白云大道北|23.2085|113.2870
longgui|Longgui|龙归|23.2480|113.2650
renhe|Renhe|人和|23.2850|113.2780
gaozeng|Gaozeng|高增|23.3250|113.2920
airportsouth|Airport South (T1)|机场南(1号航站楼)|23.3920|113.2995
airportnorth|Airport North (T2)|机场北(2号航站楼)|23.4050|113.3030

jiaokou|Jiaokou|滘口|23.1020|113.2280
tanwei|Tanwei|坦尾|23.1090|113.2350
zhongshanba|Zhongshanba|中山八|23.1170|113.2390
xichang|Xichang|西场|23.1260|113.2420
xicun|Xicun|西村|23.1370|113.2480
xiaobei|Xiaobei|小北|23.1440|113.2770
taojin|Taojin|淘金|23.1405|113.2890
quzhuang|Quzhuang|区庄|23.1380|113.2990
zoo|Guangzhou Zoo|动物园|23.1350|113.3050
wuyangcun|Wuyangcun|五羊邨|23.1250|113.3140
liede|Liede|猎德|23.1170|113.3320
tancun|Tancun|潭村|23.1180|113.3420
keyunlu|Keyunlu|科韵路|23.1210|113.3550
chebeinan|Chebei South|车陂南|23.1180|113.3680
dongpu|Dongpu|东圃|23.1260|113.3880
sanxi|Sanxi|三溪|23.1330|113.4010
yuzhu|Yuzhu|鱼珠|23.1060|113.4200
dashadi|Dashadi|大沙地|23.0990|113.4440
dashadong|Dashadong|大沙东|23.1010|113.4550
wenchong|Wenchong|文冲|23.0920|113.4680

xunfenggang|Xunfenggang|浔峰岗|23.1700|113.2130
hengsha|Hengsha|横沙|23.1560|113.2220
shabei|Shabei|沙贝|23.1480|113.2330
hesha|Hesha|河沙|23.1220|113.2310
ruyifang|Ruyifang|如意坊|23.1115|113.2400
wenhuagongyuan|Cultural Park|文化公园|23.1135|113.2540
yidelu|Yidelu|一德路|23.1160|113.2610
beijinglu|Beijing Road|北京路|23.1250|113.2700
tuanyida|Tuanyida Square|团一大广场|23.1270|113.2770
donghu|Donghu|东湖|23.1285|113.2860
huanghuagang|Huanghuagang|黄花岗|23.1450|113.3000
shahedi|Shahedin|沙河顶|23.1510|113.3080
tianpingjia|Tianpingjia|天平架|23.1570|113.3140
changban|Changban|长湴|23.1700|113.3600
zhiwuyuan|Botanical Garden|植物园|23.1830|113.3650
longdong|Longdong|龙洞|23.1940|113.3600
kemulang|Kemulang|柯木塱|23.2030|113.3690
gaotangshi|Gaotangshi|高塘石|23.2120|113.3830
huangpi|Huangpi|黄陂|23.2210|113.4010
jinfeng|Jinfeng|金峰|23.2300|113.4150
xiangang|Xiangang|暹岗|23.2370|113.4310
suyuan|Suyuan|苏元|23.2470|113.4440
luogang|Luogang|萝岗|23.2540|113.4580
xiangxue|Xiangxue|香雪|23.2620|113.4740

fenghuang|Fenghuang Xincun|凤凰新村|23.1010|113.2440
shayuan|Shayuan|沙园|23.0990|113.2510
baogang|Baogang Dadao|宝岗大道|23.0990|113.2570
xiaogangs|Xiaogang|晓港|23.0970|113.2740
zhongda|Sun Yat-sen University|中大|23.0980|113.2900
lujiang|Lujiang|鹭江|23.0990|113.3010
chigang|Chigang|赤岗|23.0960|113.3300
modiesha|Modiesha|磨碟沙|23.0950|113.3430
xingangdong|Xingang East|新港东|23.0950|113.3510
pazhou|Pazhou|琶洲|23.0990|113.3660
wanshengwei|Wanshengwei|万胜围|23.0970|113.3790
`;

export const STATIONS = {};
STATION_TABLE.trim()
  .split('\n')
  .filter((l) => l.trim())
  .forEach((row) => {
    const [id, en, zh, lat, lng] = row.split('|');
    STATIONS[id] = { id, name: { en, zh }, lat: Number(lat), lng: Number(lng) };
  });

// headway = minutes between trains: peak / daytime / early-late
// A line may run several service patterns (e.g. Line 3 trunk + airport branch).
export const LINES = [
  {
    id: '1',
    color: '#F3D03E',
    text: '#1d1d1b',
    name: { en: 'Line 1', zh: '1号线' },
    headway: { peak: 2.5, day: 4, late: 7 },
    services: [
      {
        id: '1',
        stations: [
          'xilang', 'kengkou', 'huadiwan', 'fangcun', 'huangsha', 'changshoulu', 'chenjiaci',
          'ximenkou', 'gongyuanqian', 'nongjiangsuo', 'lieshilingyuan', 'dongshankou', 'yangji',
          'tiyuxilu', 'tiyuzhongxin', 'gzeast',
        ],
      },
    ],
  },
  {
    id: '2',
    color: '#00629B',
    text: '#ffffff',
    name: { en: 'Line 2', zh: '2号线' },
    headway: { peak: 3, day: 5, late: 8 },
    services: [
      {
        id: '2',
        stations: [
          'jiahewanggang', 'huangbian', 'jiangxia', 'xiaogangn', 'baiyunwenhua', 'baiyungongyuan',
          'feixiang', 'sanyuanli', 'gzrailway', 'yuexiupark', 'jiniantang', 'gongyuanqian',
          'haizhu', 'shierga', 'jiangnanxi', 'changgang', 'jiangtailu', 'dongxiaonan', 'nanzhou',
          'luoxi', 'nanpu', 'huijiang', 'shibi', 'gznan',
        ],
      },
    ],
  },
  {
    id: '3',
    color: '#ECA154',
    text: '#1d1d1b',
    name: { en: 'Line 3', zh: '3号线' },
    headway: { peak: 3, day: 5, late: 8 },
    services: [
      {
        id: '3',
        stations: [
          'panyusquare', 'shiqiao', 'hanxi', 'dashi', 'xiajiao', 'lijiao', 'datang', 'kecun',
          'cantontower', 'zhujiangnewtown', 'tiyuxilu', 'shipaiqiao', 'gangding', 'huashi',
          'wushan', 'tianhebus',
        ],
      },
      {
        id: '3a',
        label: { en: 'Airport branch', zh: '机场线方向' },
        headwayScale: 1.6,
        stations: [
          'tiyuxilu', 'linhexi', 'gzeast', 'yantang', 'meihuayuan', 'jingxi', 'tonghe', 'yongtai',
          'baiyundadaobei', 'jiahewanggang', 'longgui', 'renhe', 'gaozeng', 'airportsouth',
          'airportnorth',
        ],
      },
    ],
  },
  {
    id: '5',
    color: '#C5003E',
    text: '#ffffff',
    name: { en: 'Line 5', zh: '5号线' },
    headway: { peak: 3, day: 5, late: 8 },
    services: [
      {
        id: '5',
        stations: [
          'jiaokou', 'tanwei', 'zhongshanba', 'xichang', 'xicun', 'gzrailway', 'xiaobei', 'taojin',
          'quzhuang', 'zoo', 'yangji', 'wuyangcun', 'zhujiangnewtown', 'liede', 'tancun', 'keyunlu',
          'chebeinan', 'dongpu', 'sanxi', 'yuzhu', 'dashadi', 'dashadong', 'wenchong',
        ],
      },
    ],
  },
  {
    id: '6',
    color: '#80225F',
    text: '#ffffff',
    name: { en: 'Line 6', zh: '6号线' },
    headway: { peak: 4, day: 6, late: 9 },
    services: [
      {
        id: '6',
        stations: [
          'xunfenggang', 'hengsha', 'shabei', 'hesha', 'tanwei', 'ruyifang', 'huangsha',
          'wenhuagongyuan', 'yidelu', 'haizhu', 'beijinglu', 'tuanyida', 'donghu', 'dongshankou',
          'quzhuang', 'huanghuagang', 'shahedi', 'tianpingjia', 'yantang', 'tianhebus', 'changban',
          'zhiwuyuan', 'longdong', 'kemulang', 'gaotangshi', 'huangpi', 'jinfeng', 'xiangang',
          'suyuan', 'luogang', 'xiangxue',
        ],
      },
    ],
  },
  {
    id: '8',
    color: '#008C95',
    text: '#ffffff',
    name: { en: 'Line 8', zh: '8号线' },
    headway: { peak: 4, day: 6, late: 9 },
    services: [
      {
        id: '8',
        stations: [
          'fenghuang', 'shayuan', 'baogang', 'changgang', 'xiaogangs', 'zhongda', 'lujiang', 'kecun',
          'chigang', 'modiesha', 'xingangdong', 'pazhou', 'wanshengwei',
        ],
      },
    ],
  },
];

export const LINE_BY_ID = Object.fromEntries(LINES.map((l) => [l.id, l]));

// Service patterns flattened: each is one directional-capable run of stations.
export const SERVICES = LINES.flatMap((line) =>
  line.services.map((s) => ({
    ...s,
    lineId: line.id,
    headway: line.headway,
    headwayScale: s.headwayScale || 1,
  }))
);
export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

// Well-known places so the planner works offline. Coordinates are approximate.
export const LANDMARKS = [
  { id: 'lm-cantontower', name: { en: 'Canton Tower', zh: '广州塔' }, lat: 23.1065, lng: 113.3245 },
  { id: 'lm-airport', name: { en: 'Baiyun Airport T1', zh: '白云机场T1' }, lat: 23.3925, lng: 113.2990 },
  { id: 'lm-gznan', name: { en: 'Guangzhou South Station', zh: '广州南站' }, lat: 22.9895, lng: 113.2695 },
  { id: 'lm-beijinglu', name: { en: 'Beijing Road Pedestrian Street', zh: '北京路步行街' }, lat: 23.1255, lng: 113.2715 },
  { id: 'lm-chenjiaci', name: { en: 'Chen Clan Academy', zh: '陈氏书院' }, lat: 23.1262, lng: 113.2470 },
  { id: 'lm-shangxiajiu', name: { en: 'Shangxiajiu Walking Street', zh: '上下九步行街' }, lat: 23.1130, lng: 113.2455 },
  { id: 'lm-zjnt', name: { en: 'Huacheng Square', zh: '花城广场' }, lat: 23.1175, lng: 113.3215 },
  { id: 'lm-tianhecity', name: { en: 'Tianhe City Mall', zh: '天河城' }, lat: 23.1345, lng: 113.3225 },
  { id: 'lm-chimelong', name: { en: 'Chimelong Paradise', zh: '长隆欢乐世界' }, lat: 22.9990, lng: 113.3280 },
  { id: 'lm-yuexiu', name: { en: 'Yuexiu Park', zh: '越秀公园' }, lat: 23.1445, lng: 113.2625 },
  { id: 'lm-ssu', name: { en: 'Sun Yat-sen University (South)', zh: '中山大学(南校区)' }, lat: 23.0965, lng: 113.2960 },
];

export const GUANGZHOU_CENTER = [23.13, 113.3];
