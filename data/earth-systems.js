/* 大气环流与洋流（气候态示意）
 *
 * 说明：本层表达的是「大航海时代所依赖的常年气候规律」，不是某一年的逐日气象。
 *  - 信风、西风带、极地东风为常年风带，位置随太阳直射点南北移动（ITCZ 季节位移）。
 *  - 印度洋、南海—东亚、西非季风按月份反向：夏季（约 5—9 月）为西南季风，
 *    冬季（约 11—3 月）为东北季风，转换期（4、10 月）风力弱、方向不稳。
 *  - 洋流为气候态平均流路，暖流偏橙、寒流偏青、季风洋流随季反向。
 * 地理形态均为概化示意，用于解释「为什么这条航线走得通」，不作航海实测依据。
 */
(function (global) {
  'use strict';

  var MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'];

  /* ---------------- 风带 ----------------
   * belt 型：环全球的纬向风带。
   *   lat0/lat1  纬度范围（度）
   *   dir        +1 = 自西向东吹，-1 = 自东向西吹
   *   drift      气流的经向分量（正 = 向北偏），单位：纬度当量/纬度跨度
   *   speed      每秒沿路径推进的比例（1 = 一整圈/秒）
   * monsoon 型：限定经纬范围的季风区。
   *   lon0/lon1  经度范围；夏季自西南向东北，冬季自东北向西南。
   */
  var WINDS = [
    {
      id: 'ne_trade', name: '东北信风', en: 'NE Trade Winds', type: 'belt',
      lat0: 3, lat1: 26, dir: -1, drift: -0.30, speed: 0.030, lanes: 4,
      color: '#7ed2e6', itcz: true,
      note: '北纬 0—30° 常年自东北吹向西南；哥伦布西去、返航北上所借的正是它与其北侧西风带'
    },
    {
      id: 'se_trade', name: '东南信风', en: 'SE Trade Winds', type: 'belt',
      lat0: -26, lat1: -3, dir: -1, drift: 0.30, speed: 0.030, lanes: 4,
      color: '#7ed2e6', itcz: true,
      note: '南纬 0—30° 常年自东南吹向西北；达·伽马横渡南大西洋后借它东去'
    },
    {
      id: 'westerlies_n', name: '北半球盛行西风', en: 'Westerlies (N)', type: 'belt',
      lat0: 34, lat1: 62, dir: 1, drift: 0.28, speed: 0.045, lanes: 4,
      color: '#9ee0bd',
      note: '北纬 30—60° 自西向东；哥伦布、达·伽马返欧、麦哲伦南下后的东归段都靠它'
    },
    {
      id: 'westerlies_s', name: '南半球西风带（咆哮西风带）', en: 'Roaring Forties', type: 'belt',
      lat0: -60, lat1: -34, dir: 1, drift: -0.30, speed: 0.055, lanes: 4,
      color: '#9ee0bd',
      note: '南纬 35—60° 强劲自西向东；塔斯曼、德雷克横渡太平洋靠它，也是「volta do mar」的原理'
    },
    {
      id: 'polar_e_n', name: '北极东风带', en: 'Polar Easterlies (N)', type: 'belt',
      lat0: 66, lat1: 82, dir: -1, drift: 0, speed: 0.022, lanes: 2,
      color: '#a3bed6',
      note: '北纬 60° 以北自东北吹向西南；东北航道与北冰洋探航的主要阻碍之一'
    },
    {
      id: 'polar_e_s', name: '南极东风带', en: 'Polar Easterlies (S)', type: 'belt',
      lat0: -82, lat1: -66, dir: -1, drift: 0, speed: 0.022, lanes: 2,
      color: '#a3bed6',
      note: '南纬 60° 以南自东南吹向西北'
    },
    {
      id: 'monsoon_indian', name: '印度洋季风', en: 'Indian Ocean Monsoon', type: 'monsoon',
      lat0: 2, lat1: 24, lon0: 40, lon1: 98, slope: 0.34, speed: 0.42, lanes: 5,
      color: '#eac96b',
      note: '夏季西南季风（5—9 月）送船自阿拉伯海直趋印度西岸；冬季东北季风（11—3 月）反向。达·伽马 1498 年正是等到了西南季风'
    },
    {
      id: 'monsoon_sea', name: '东亚—南海季风', en: 'East Asian Monsoon', type: 'monsoon',
      lat0: 4, lat1: 30, lon0: 100, lon1: 138, slope: 0.55, speed: 0.40, lanes: 4,
      color: '#eac96b',
      note: '郑和船队冬季乘东北季风出洋、夏季乘西南季风归国，形成「候风」往返的航期制度'
    },
    {
      id: 'monsoon_wafrica', name: '西非季风', en: 'West African Monsoon', type: 'monsoon',
      lat0: 4, lat1: 18, lon0: -18, lon1: 18, slope: 0.5, speed: 0.34, lanes: 3,
      color: '#eac96b',
      note: '几内亚湾一带的季节性风向与沿岸降水'
    }
  ];

  /* ---------------- 洋流 ----------------
   * pts 按【流向】顺序给出，经度可超出 ±180（跨日界线时不要跳号）。
   * kind: warm 暖流 / cold 寒流 / seasonal 季风洋流（随季反向）
   * speed: 每秒推进的世界单位（地球半径 R=2.4）
   */
  var CURRENTS = [
    {
      id: 'eq_pacific_n', name: '北赤道暖流（太平洋）', en: 'N. Equatorial Current', kind: 'warm',
      speed: 0.30,
      pts: [[-95, 10], [-120, 11], [-150, 11], [-175, 11], [-205, 11], [-228, 12]],
      note: '自美洲西岸一路向西，是西班牙大帆船「马尼拉—阿卡普尔科」航线的去程动力'
    },
    {
      id: 'kuroshio', name: '黑潮（日本暖流）', en: 'Kuroshio', kind: 'warm',
      speed: 0.34,
      pts: [[126, 20], [130, 26], [135, 31], [141, 35], [150, 38]]
    },
    {
      id: 'np_drift', name: '北太平洋暖流', en: 'N. Pacific Drift', kind: 'warm',
      speed: 0.32,
      pts: [[150, 39], [180, 42], [210, 44], [232, 45]]
    },
    {
      id: 'california', name: '加利福尼亚寒流', en: 'California Current', kind: 'cold',
      speed: 0.28,
      pts: [[-128, 44], [-124, 36], [-118, 28], [-110, 18], [-102, 12]]
    },
    {
      id: 'oyashio', name: '千岛寒流', en: 'Oyashio', kind: 'cold',
      speed: 0.26,
      pts: [[158, 51], [151, 46], [145, 42], [142, 37]]
    },
    {
      id: 'eq_atlantic_n', name: '北赤道暖流（大西洋）', en: 'N. Equatorial Current (Atl.)', kind: 'warm',
      speed: 0.30,
      pts: [[-24, 10], [-40, 10], [-55, 11], [-70, 12]]
    },
    {
      id: 'gulf_stream', name: '墨西哥湾暖流', en: 'Gulf Stream', kind: 'warm',
      speed: 0.36,
      pts: [[-82, 25], [-77, 31], [-70, 35], [-60, 39], [-46, 42], [-32, 45]]
    },
    {
      id: 'na_drift', name: '北大西洋暖流', en: 'North Atlantic Drift', kind: 'warm',
      speed: 0.30,
      pts: [[-32, 46], [-22, 52], [-10, 58], [2, 63], [10, 68]]
    },
    {
      id: 'canary', name: '加那利寒流', en: 'Canary Current', kind: 'cold',
      speed: 0.28,
      pts: [[-11, 36], [-17, 30], [-21, 22], [-24, 14]],
      note: '沿西非北岸南下，与东北信风叠加，正是葡萄牙人「沿海岸南下」的天然助力'
    },
    {
      id: 'eq_atlantic_s', name: '南赤道暖流（大西洋）', en: 'S. Equatorial Current (Atl.)', kind: 'warm',
      speed: 0.30,
      pts: [[8, -3], [-6, -4], [-20, -5], [-32, -7]]
    },
    {
      id: 'brazil', name: '巴西暖流', en: 'Brazil Current', kind: 'warm',
      speed: 0.28,
      pts: [[-36, -9], [-41, -17], [-46, -25], [-51, -33]]
    },
    {
      id: 'benguela', name: '本格拉寒流', en: 'Benguela Current', kind: 'cold',
      speed: 0.26,
      pts: [[16, -34], [13, -27], [11, -19], [9, -11]]
    },
    {
      id: 'agulhas', name: '厄加勒斯暖流', en: 'Agulhas Current', kind: 'warm',
      speed: 0.30,
      pts: [[42, -20], [37, -26], [30, -32], [24, -36]]
    },
    {
      id: 'acc', name: '西风漂流（南极环流）', en: 'Antarctic Circumpolar', kind: 'cold',
      speed: 0.30,
      pts: [[-180, -55], [-140, -57], [-100, -57], [-60, -56], [-20, -55],
        [20, -54], [60, -54], [100, -54], [140, -55], [180, -55]]
    },
    {
      id: 'eq_pacific_s', name: '南赤道暖流（太平洋）', en: 'S. Equatorial Current', kind: 'warm',
      speed: 0.28,
      pts: [[-85, -4], [-110, -5], [-140, -6], [-170, -6], [-198, -7]]
    },
    {
      id: 'humboldt', name: '秘鲁寒流', en: 'Humboldt Current', kind: 'cold',
      speed: 0.26,
      pts: [[-76, -42], [-76, -33], [-79, -23], [-82, -13], [-86, -5]]
    },
    {
      id: 'west_aus', name: '西澳大利亚寒流', en: 'West Australian Current', kind: 'cold',
      speed: 0.24,
      pts: [[113, -33], [111, -26], [108, -18], [105, -11]]
    },
    {
      id: 'east_aus', name: '东澳大利亚暖流', en: 'East Australian Current', kind: 'warm',
      speed: 0.26,
      pts: [[153, -20], [154, -26], [152, -33], [150, -38]]
    },
    {
      id: 'somali', name: '索马里—季风洋流', en: 'Somali / Monsoon Current', kind: 'seasonal',
      speed: 0.30,
      pts: [[46, 2], [50, 7], [55, 11], [62, 14]],
      note: '夏季随西南季风流向东北，冬季随东北季风反向流向西南——印度洋航期的另一半答案'
    }
  ];

  /* 季节指数：+1 ≈ 七月中（北半球盛夏），-1 ≈ 一月中（北半球隆冬） */
  function seasonIndex(month) {
    var m = (month == null ? 6 : month) + 0.5;
    return Math.cos((m - 6.5) / 12 * Math.PI * 2);
  }

  /* 季风状态文案 + 强度，供 UI 与渲染共用 */
  function monsoonState(month) {
    var s = seasonIndex(month);
    var summer = Math.max(0, s), winter = Math.max(0, -s);
    var label = summer > 0.35 ? '西南季风'
      : (winter > 0.35 ? '东北季风'
        : (summer >= winter ? '季风转换（偏西南）' : '季风转换（偏东北）'));
    return { summer: summer, winter: winter, index: s, label: label };
  }

  global.EARTH_SYSTEMS = {
    months: MONTHS,
    winds: WINDS,
    currents: CURRENTS,
    seasonIndex: seasonIndex,
    monsoonState: monsoonState,
    note: '风带与洋流为气候态示意：方向、季节反转依常年规律，非某一年的实测气象与海流。'
  };
})(window);
