/* 探险队总表
 *
 * 1. 复用 data/voyages.js 中已逐条核查过的 5 支远洋队（郑和、迪亚士、哥伦布、
 *    达·伽马、麦哲伦–埃尔卡诺），在此补齐「纲目/任务/成果/类型」字段；
 * 2. 新增覆盖《透过地理看历史·大航海时代》其余章节的海洋与陆地探险队；
 * 3. 统一成 EXPEDITIONS 模型，按全局年份推进。
 *
 * 日期说明：有确切史料日期的航点用精确日期；只记年份的用该年中间月份占位，
 * 仅用于时间轴排序与插值，label 一律写「约 XXXX 年」，不构成日期断言。
 * 标注「合成」的队伍是同一主题下多支分队/多次航行的进程线，不是单船单航次。
 */
(function (global) {
  'use strict';

  /* ---------- 为原有 5 支队伍补齐纲目字段 ---------- */
  var META = {
    zhenghe: {
      type: 'sea', chapter: '第三章 · 寻找通往东方的道路',
      mission: '奉明成祖之命率舟师出使「西洋」，确立朝贡—贸易网络并宣示国威；与后来欧洲人寻找香料海路形成对照。',
      gains: [
        '七下西洋（1405–1433），贯通西太平洋—印度洋季风航路',
        '旧港擒海盗陈祖义、锡兰山立三语布施碑，均为《明史》与碑刻可证事迹',
        '前三次抵古里，后四次西进忽鲁谟斯、亚丁并遣分队至东非斯瓦希里海岸',
        '留下《郑和航海图》与马欢、费信、巩珍三种行纪',
        '航线位于早已通航的印度洋—南海季风贸易网内，性质为朝贡外交与海运控制，并未建立殖民贸易帝国'
      ]
    },
    dias: {
      type: 'sea', chapter: '第三章 · 寻找通往东方的道路 / 第十五章 · 印度航线',
      mission: '奉若昂二世之命沿非洲西岸继续南下，寻找非洲南端与通往印度洋的海路。',
      gains: [
        '1488 年在风暴中绕过非洲南端而未见陆地，实证大西洋与印度洋相通',
        '推翻托勒密「印度洋为内海」的地理框架',
        '最远抵大鱼河（Rio do Infante），返程才首次望见好望角',
        '其航路经验直接支撑 1497 年达·伽马的 volta do mar'
      ]
    },
    columbus: {
      type: 'sea', chapter: '第八—十一章 · 哥伦布 / 新大陆 / 信风 / 回到西班牙',
      mission: '受卡斯蒂利亚双王资助，向西横渡大西洋寻找通往亚洲的航路。',
      gains: [
        '1492-10-12 登陆 Guanahani，开启欧洲与加勒比的持续接触',
        '发现并利用东北信风带西去、西风带东返的跨大西洋风向规律',
        '首航只到巴哈马、古巴、伊斯帕尼奥拉等岛屿；1498 年第三次航行才首次触及南美大陆',
        '建 La Navidad 殖民据点；他至死仍认为所到之地属亚洲，并未认识到这是一片「新大陆」'
      ]
    },
    dagama: {
      type: 'sea', chapter: '第十二章 · 达·伽马 / 第十五章 · 印度航线',
      mission: '率四船由大西洋绕非洲南端直航印度，打通不经过威尼斯与马穆鲁克中介的香料海路。',
      gains: [
        '1498-05-20 抵卡利卡特，成为首位由海路到达印度的欧洲人',
        '采用南大西洋 volta do mar 西风弧线，三个月不见陆地',
        '在马林迪取得熟悉季风的古吉拉特领航员，横渡阿拉伯海',
        '虽未签成商约且损失过半船员，带回的香料证实航路价值，开启 Carreira da Índia'
      ]
    },
    magellan: {
      type: 'sea', chapter: '第二十一—二十三章 · 发现太平洋 / 麦哲伦 / 环球航行',
      mission: '寻西行通往香料群岛的海路，绕过或穿越南美大陆进入「南海」。',
      gains: [
        '1520 年发现并穿越南美南端海峡，11 月 28 日驶入太平洋',
        '以约 98 天无补给横渡太平洋，实证地球尺度远超当时估算',
        '1522-09-06 由埃尔卡诺率 Victoria 号 18 人生还返抵，完成首次环球',
        '船员在佛得角发现日期差一天，为后来国际日期变更线提供经验依据'
      ]
    }
  };

  /* ---------- 新增探险队 ---------- */
  var NEW = [
    {
      id: 'henry', name: '葡萄牙西非探航（亨利王子—王室接续）', shortName: '葡 · 西非探航',
      en: 'Portuguese West African Reconnaissance', polity: '葡萄牙王国 · 阿维斯王朝',
      span: '1415 — 1471', type: 'sea', color: '#4fa3d1',
      chapter: '第四—五章 · 亨利王子 / 穿过佛得角的世界',
      mission: '沿非洲西岸逐段南探，寻找黄金、象牙与绕开撒哈拉—威尼斯香料链的海路；以连续航次累积风、流与海岸资料。',
      gains: [
        '1415 年占领休达，取得欧洲在非洲的第一个桥头堡',
        '1419/1420 年抵马德拉、1427/1431 年抵亚速尔，开启大西洋群岛殖民',
        '1434 年吉尔·埃亚内斯绕过博哈多尔角，突破中世纪欧洲海图的南界',
        '1445 年抵佛得角半岛、1456 年抵佛得角群岛，西非黄金与奴隶贸易由此展开',
        '1471 年抵 A Mina（黄金海岸），1482 年建埃尔米纳堡（São Jorge da Mina）'
      ],
      disputes: [
        '「萨格里什航海学校」主要是 19 世纪以来的建构，现代史学认为并无正式学校；亨利王子本人从未亲自远航。',
        '马德拉、亚速尔的确切发现年份与发现者各史料不一（1419/1420、1427/1431）。',
        '亨利王子 1460 年去世后，探航由王室接续并一度承包给里斯本商人 Fernão Gomes；因此本线是 1415–1471 年多位船长的连续推进合成，不是单船单航次。'
      ],
      sources: [
        ['Britannica · Henry the Navigator', 'https://www.britannica.com/biography/Henry-the-Navigator-prince-of-Portugal'],
        ['Britannica · Gil Eanes', 'https://www.britannica.com/biography/Gil-Eanes']
      ],
      points: [
        { name: '里斯本', lat: 38.72, lon: -9.14, date: '1415-07-01', label: '约 1415 年', kind: 'start', title: '休达远征启程', desc: '葡萄牙越过直布罗陀海峡，1415 年 8 月攻取休达。' },
        { name: '休达 Ceuta', lat: 35.89, lon: -5.32, date: '1415-08-21', label: '1415 年 8 月 21 日', kind: 'discovery', title: '占据休达', desc: '欧洲在非洲的第一个永久据点；亨利王子由此接触撒哈拉商路情报。' },
        { name: '马德拉（丰沙尔）', lat: 32.65, lon: -16.91, date: '1420-06-01', label: '约 1419—1420 年', kind: 'discovery', title: '发现并殖民马德拉', desc: '若昂·贡萨尔维斯·扎尔科等发现，随后引入甘蔗种植。' },
        { name: '亚速尔 · 圣玛丽亚岛', lat: 36.97, lon: -25.09, date: '1427-06-01', label: '约 1427—1431 年', kind: 'way', title: '发现亚速尔群岛', desc: '远离大陆的大西洋群岛，成为后来返航的重要风向节点。' },
        { name: '博哈多尔角 Cape Bojador', lat: 26.13, lon: -14.50, date: '1434-06-01', label: '1434 年', kind: 'discovery', title: '越过博哈多尔角', desc: '吉尔·埃亚内斯成功绕过此前欧洲人视为航行极限的海角，破除「沸水之海」传说。' },
        { name: '布朗角 Cape Blanco', lat: 20.77, lon: -17.05, date: '1441-06-01', label: '1441 年', kind: 'way', title: '努诺·特里斯唐南进', desc: '葡萄牙航行推进到今毛里塔尼亚海岸，开始掳掠与奴隶贸易。' },
        { name: '佛得角半岛 Cap-Vert', lat: 14.73, lon: -17.53, date: '1445-06-01', label: '1445 年', kind: 'milestone', title: '抵非洲最西端', desc: '迪尼斯·迪亚士抵达。此处是书第五章「穿过佛得角的世界」的地理节点。' },
        { name: '佛得角群岛 · 圣地亚哥', lat: 14.92, lon: -23.51, date: '1456-06-01', label: '约 1456 年', kind: 'way', title: '外洋群岛', desc: '卡达莫斯托与迪奥戈·戈麦斯等航抵，成为后来印度航线的补给点。' },
        { name: '塞拉利昂海岸', lat: 8.50, lon: -13.20, date: '1460-06-01', label: '约 1460 年', kind: 'way', title: '亨利王子去世时的南界', desc: '佩德罗·德·辛特拉抵此一带；同年亨利王子去世，探航由王室接续。' },
        { name: 'A Mina / 黄金海岸', lat: 5.08, lon: -1.35, date: '1471-06-01', label: '1471 年', kind: 'end', title: '抵黄金海岸', desc: '若昂·德·桑塔伦与佩罗·埃斯科巴尔抵此，后来成为埃尔米纳堡所在地。' }
      ],
      detours: {
        0: [[36.2, -8.0], [35.8, -6.4]],
        1: [[31.0, -13.5], [29.0, -15.5]],
        2: [[35.0, -21.0], [37.0, -24.0]],
        3: [[30.0, -16.0], [26.5, -15.0]],
        4: [[23.0, -16.5], [21.0, -17.2]],
        5: [[17.5, -17.0], [15.0, -17.6]],
        6: [[13.5, -20.0], [14.0, -22.5]],
        7: [[12.0, -18.0], [9.5, -15.0]],
        8: [[7.0, -10.0], [5.5, -5.0], [5.2, -2.0]]
      }
    },

    {
      id: 'congo', name: '迪奥戈·康 · 刚果河口与西南非标柱', shortName: '迪奥戈·康 · 刚果',
      en: 'Diogo Cão, 1482–1486', polity: '葡萄牙王国 · 若昂二世',
      span: '1482 — 1486', type: 'sea', color: '#5ec4b6',
      chapter: '第六章 · 撒哈拉以南的非洲',
      mission: '沿几内亚湾继续南探，寻找通往印度洋的非洲南端，并以石柱（padrão）逐段宣示抵达最南界。',
      gains: [
        '1482 年抵达并勘察刚果河口，与刚果王国建立接触',
        '1483 年南进至安哥拉海岸，1485/1486 年抵纳米比亚十字角一带',
        '以 padrão 石柱标记最南界，为迪亚士 1487 年的远航铺路',
        '把西非海岸线的已知范围推进到南回归线附近'
      ],
      disputes: [
        '康的航行次数（两次或三次）、最南抵达年份（1484 / 1486）与是否卒于第二次航行，记载不一。',
        '十字角（Cape Cross）石柱为后世移置与复制，原始树立位置有争议。',
        '本线为两次航行的进程合成。'
      ],
      sources: [
        ['Britannica · Diogo Cão', 'https://www.britannica.com/biography/Diogo-Cao'],
        ['Wikipedia · Diogo Cão', 'https://en.wikipedia.org/wiki/Diogo_C%C3%A3o']
      ],
      points: [
        { name: '里斯本', lat: 38.72, lon: -9.14, date: '1482-05-01', label: '1482 年', kind: 'start', title: '奉若昂二世之命南探', desc: '携带石柱（padrão）用于在登陆处立标。' },
        { name: '埃尔米纳', lat: 5.08, lon: -1.35, date: '1482-07-01', label: '1482 年', kind: 'way', title: '黄金海岸据点', desc: '此期葡萄牙正在此处建造 São Jorge da Mina 堡。' },
        { name: '刚果河口', lat: -6.05, lon: 12.40, date: '1482-08-01', label: '1482 年 8 月', kind: 'discovery', title: '发现刚果河口', desc: '立第一根 padrão 石柱，并派使者溯河赴刚果王廷。' },
        { name: '安哥拉海岸', lat: -15.20, lon: 12.10, date: '1483-06-01', label: '约 1483 年', kind: 'way', title: '第二次航行南进', desc: '沿岸继续南下并立第二根石柱。' },
        { name: '十字角 Cape Cross', lat: -21.77, lon: 14.17, date: '1486-01-01', label: '约 1485—1486 年', kind: 'milestone', title: '已知海岸最南界', desc: '立石柱标出葡萄牙探航的新极限，此后由迪亚士接续。' },
        { name: '里斯本（返回）', lat: 38.72, lon: -9.14, date: '1486-07-01', label: '约 1486 年', kind: 'end', title: '回报非洲南端仍未找到', desc: '海岸仍持续南延，促使若昂二世筹备迪亚士远航。' }
      ],
      detours: {
        0: [[25.0, -18.0], [10.0, -16.0], [3.0, 2.0]],
        2: [[-8.0, 10.0], [-12.0, 11.0]],
        3: [[-18.0, 11.5], [-20.0, 12.5]],
        4: [[-20.0, 2.0], [-6.0, -2.0], [8.0, -14.0], [25.0, -16.0], [36.2, -8.2]]
      }
    },

    {
      id: 'covilha', name: '佩罗·达·科维良陆路探察', shortName: '科维良 · 陆路探察',
      en: 'Pêro da Covilhã Overland Mission', polity: '葡萄牙王国 · 若昂二世',
      span: '1487 — 1493', type: 'land', color: '#c58fd8',
      chapter: '第三章 · 寻找通往东方的道路',
      mission: '受若昂二世密派，经地中海—红海—印度洋的穆斯林商路，侦察印度香料贸易与「祭司王约翰」（埃塞俄比亚）所在，为海路远征集情报。',
      gains: [
        '实地走通亚历山大—开罗—亚丁—印度的穆斯林贸易链',
        '确认绕过非洲后可由海路接入印度洋季风网络',
        '其密报被视为达·伽马远航的重要情报来源之一',
        '后转赴埃塞俄比亚，被扣留终老，1520 年代为葡萄牙使团所寻获'
      ],
      disputes: [
        '其行程主要见于 16 世纪 Francisco Álvares 的转述，报告原件已佚，路线细节与年份存疑。',
        '与迪亚士 1487–1488 年的海路探航同期并行——一陆一海，构成葡萄牙「双线侦察」。'
      ],
      sources: [
        ['Britannica · Pêro da Covilhã', 'https://www.britannica.com/biography/Pero-da-Covilha'],
        ['Wikipedia · Pêro da Covilhã', 'https://en.wikipedia.org/wiki/P%C3%AAro_da_Covilh%C3%A3']
      ],
      points: [
        { name: '里斯本', lat: 38.72, lon: -9.14, date: '1487-05-01', label: '1487 年', kind: 'start', title: '受密令东行', desc: '与阿丰索·德·派瓦同行，化装为商人经陆路东去。' },
        { name: '亚历山大', lat: 31.20, lon: 29.92, date: '1487-09-01', label: '约 1487 年', kind: 'way', title: '进入马穆鲁克商路', desc: '由地中海转入伊斯兰世界的香料转运体系。' },
        { name: '开罗', lat: 30.04, lon: 31.24, date: '1487-12-01', label: '约 1487 年', kind: 'way', title: '随商队赴红海', desc: '经苏伊士方向南下，取得印度洋季风航路的地理认知。' },
        { name: '亚丁', lat: 12.79, lon: 45.03, date: '1488-04-01', label: '约 1488 年', kind: 'way', title: '印度洋入口', desc: '红海与印度洋的转口枢纽。' },
        { name: '卡利卡特 Calicut', lat: 11.25, lon: 75.78, date: '1488-12-01', label: '约 1488—1489 年', kind: 'discovery', title: '抵印度西岸', desc: '葡萄牙人由陆路先行摸清十年后达·伽马的目标港与香料价格。' },
        { name: '忽鲁谟斯 Hormuz', lat: 27.10, lon: 56.45, date: '1489-06-01', label: '约 1489 年', kind: 'way', title: '波斯湾枢纽', desc: '考察波斯湾—印度洋的另一条香料支线。' },
        { name: '索法拉 Sofala', lat: -20.15, lon: 34.75, date: '1490-02-01', label: '约 1489—1490 年', kind: 'way', title: '东非黄金口岸', desc: '报告所述东非行程之一，与迪亚士的海路南端形成互补情报。' },
        { name: '开罗（复命）', lat: 30.04, lon: 31.24, date: '1491-01-01', label: '约 1490—1491 年', kind: 'way', title: '派瓦已死，转赴埃塞俄比亚', desc: '在开罗得知同伴死讯，奉新命寻找「祭司王约翰」。' },
        { name: '埃塞俄比亚高原', lat: 9.03, lon: 38.74, date: '1493-06-01', label: '约 1490 年代', kind: 'end', title: '被留居终老', desc: '受埃塞俄比亚皇帝礼遇但不准离境，其后半生留在该地。' }
      ]
    },

    {
      id: 'cabot', name: '约翰·卡博特 · 西北航道首探', shortName: '卡博特 · 西北航道',
      en: 'John Cabot, 1497', polity: '英格兰 · 亨利七世特许',
      span: '1497 — 1497', type: 'sea', color: '#7fc9a8',
      chapter: '第二十章 · 西北航道',
      mission: '受亨利七世特许，自布里斯托向西横渡北大西洋，寻找通往亚洲的西北短航路。',
      gains: [
        '1497 年 6 月 24 日前后抵北美东北海岸，为英格兰日后北美主张的依据',
        '报告该海域鳕鱼密集，揭示纽芬兰大渔场的经济价值',
        '1498 年二次远航后船队失踪，结局不明'
      ],
      disputes: [
        '1497 年登陆点在纽芬兰、布雷顿角、拉布拉多之间长期争议，无一手航海日志。',
        '不宜称「发现北美大陆」：北欧人约公元 1000 年已抵文兰，且原住民早已定居。'
      ],
      sources: [
        ['Britannica · John Cabot', 'https://www.britannica.com/biography/John-Cabot'],
        ['Wikipedia · John Cabot', 'https://en.wikipedia.org/wiki/John_Cabot']
      ],
      points: [
        { name: '布里斯托 Bristol', lat: 51.45, lon: -2.59, date: '1497-05-02', label: '1497 年 5 月', kind: 'start', title: 'Matthew 号启航', desc: '约 18–20 人，持亨利七世特许状西航。' },
        { name: '爱尔兰西岸外海', lat: 52.50, lon: -11.00, date: '1497-05-25', label: '约 1497 年 5 月', kind: 'way', title: '离欧洲大陆', desc: '沿高纬度大圆航线西渡。' },
        { name: '北大西洋高纬航段', lat: 55.00, lon: -32.00, date: '1497-06-10', label: '横渡段', kind: 'way', title: '北大西洋横渡', desc: '示意点，非停靠；取北路以缩短航程。', note: '示意点' },
        { name: '「新发现之地」', lat: 47.50, lon: -54.00, date: '1497-06-24', label: '1497 年 6 月 24 日前后', kind: 'discovery', title: '抵北美东北海岸', desc: '插上英格兰与威尼斯旗，见人迹与渔网但未见居民。具体地点存疑。' },
        { name: '布里斯托（返回）', lat: 51.45, lon: -2.59, date: '1497-08-06', label: '1497 年 8 月', kind: 'end', title: '归报「亚洲海岸」', desc: '误以为已抵亚洲东北，随即筹备次年更大规模远航。' }
      ],
      detours: { 0: [[52.0, -6.5], [52.8, -9.5]], 3: [[51.0, -40.0], [51.5, -20.0]] }
    },

    {
      id: 'cabrals', name: '卡布拉尔舰队 · 巴西与印度', shortName: '卡布拉尔 · 巴西/印度',
      en: 'Pedro Álvares Cabral, 1500–1501', polity: '葡萄牙王国 · 曼努埃尔一世',
      span: '1500 — 1501', type: 'sea', color: '#e08a6a',
      chapter: '第十七章 · 发现巴西 / 第十五章 · 印度航线',
      mission: '率 13 船赴印度建商站、结盟并订立商约；沿达·伽马航路南下时大幅西偏。',
      gains: [
        '1500-04-22 抵巴西海岸（蒙特帕斯夸尔／塞古鲁港），欧洲人明确记录巴西',
        '《托德西利亚斯条约》分界线以西归葡萄牙，奠定巴西版图',
        '与科钦王公结盟、设商站，为葡属印度奠基',
        '与卡利卡特扎莫林交恶并炮击该城，返程损失多船'
      ],
      disputes: [
        '「意外发现巴西」有争议：葡方可能此前已知该海岸（1494 年条约划线、Duarte Pacheco Pereira 的记载），另有「刻意确认」说。',
        '迪亚士作为该舰队船长之一，1500 年 5 月 29 日在好望角附近风暴中随船遇难。'
      ],
      sources: [
        ['Britannica · Pedro Álvares Cabral', 'https://www.britannica.com/biography/Pedro-Alvares-Cabral'],
        ['Wikipedia · Pedro Álvares Cabral', 'https://en.wikipedia.org/wiki/Pedro_%C3%81lvares_Cabral']
      ],
      points: [
        { name: '里斯本', lat: 38.72, lon: -9.14, date: '1500-03-09', label: '1500 年 3 月 9 日', kind: 'start', title: '十三船启碇', desc: '约 1,200–1,500 人，规模远超达·伽马首航。' },
        { name: '佛得角 · 圣地亚哥', lat: 14.92, lon: -23.51, date: '1500-03-22', label: '3 月下旬', kind: 'way', title: '最后补给', desc: '此后进入南大西洋外海弧线。' },
        { name: '南大西洋西偏段', lat: -10.00, lon: -28.00, date: '1500-04-10', label: '4 月', kind: 'way', title: 'volta do mar 西偏', desc: '为借南大西洋环流而西行，越过条约分界线。示意点。', note: '示意点' },
        { name: '塞古鲁港 / 巴西海岸', lat: -16.44, lon: -39.06, date: '1500-04-22', label: '1500 年 4 月 22 日', kind: 'discovery', title: '望见蒙特帕斯夸尔', desc: '命名为「圣十字架之地」；随即派船回报葡王。' },
        { name: '好望角', lat: -34.36, lon: 18.47, date: '1500-05-29', label: '1500 年 5 月底', kind: 'milestone', title: '风暴损失四船', desc: '绕过好望角时遇风暴，迪亚士等随船罹难。' },
        { name: '莫桑比克岛', lat: -15.03, lon: 40.73, date: '1500-07-16', label: '1500 年 7 月', kind: 'way', title: '进入斯瓦希里海岸', desc: '补给并取水。' },
        { name: '马林迪', lat: -3.22, lon: 40.12, date: '1500-08-02', label: '1500 年 8 月', kind: 'way', title: '取得领航员', desc: '循达·伽马航路横渡阿拉伯海。' },
        { name: '卡利卡特', lat: 11.25, lon: 75.78, date: '1500-09-13', label: '1500 年 9 月', kind: 'milestone', title: '商约破裂', desc: '与扎莫林冲突，葡方炮击该城，转往科钦。' },
        { name: '科钦 Cochin', lat: 9.93, lon: 76.27, date: '1500-12-24', label: '1500 年 12 月', kind: 'discovery', title: '结盟并设商站', desc: '与科钦王公结盟，葡萄牙在印度获得第一个稳定据点。' },
        { name: '里斯本（返回）', lat: 38.72, lon: -9.14, date: '1501-06-23', label: '1501 年 6 月 23 日', kind: 'end', title: '仅四船归来', desc: '损失多船，但香料与巴西情报使此行具有决定性意义。' }
      ],
      detours: {
        0: [[25.0, -18.0]],
        3: [[-24.0, -10.0], [-34.5, 8.0], [-35.0, 16.0]],
        4: [[-34.8, 24.0], [-26.0, 35.0], [-18.0, 40.0]],
        5: [[-8.0, 42.0], [-2.0, 46.0]],
        6: [[4.0, 58.0], [9.0, 70.0]],
        8: [[6.0, 74.0], [-6.0, 82.0], [-24.0, 62.0], [-34.0, 30.0], [-35.0, 18.0],
            [-20.0, 0.0], [-5.0, -16.0], [14.0, -22.0], [30.0, -13.0], [36.2, -8.2]]
      }
    },

    {
      id: 'vespucci', name: '亚美利哥·韦斯普奇 · 南美海岸考察', shortName: '韦斯普奇 · 南美海岸',
      en: 'Amerigo Vespucci, 1501–1502', polity: '葡萄牙王国 · 曼努埃尔一世（受聘随行）',
      span: '1501 — 1502', type: 'sea', color: '#e6a0b8',
      chapter: '第十六章 · 阿美利加洲',
      mission: '以随行观察员／领航身份参加葡萄牙南美海岸考察，判断所到陆地不属于亚洲，而是欧洲地图之外的一整块「新世界」。',
      gains: [
        '1501–1502 年沿巴西东岸南下，记录海岸、星空与原住民社会',
        '提出「新世界（Mundus Novus）」判断，区别于哥伦布的「亚洲近海」解释',
        '1507 年洛林圣迪耶的瓦尔德泽米勒《宇宙志导论》及世界地图以 Amerigo 之名标注新大陆，「阿美利加」由此进入地图',
        '为「这是一块独立大陆」的概念定型提供关键文本依据'
      ],
      disputes: [
        '韦斯普奇 1497–1504 年四次航行的次数、身份与所写书信的真伪长期争议；部分学者认为 1497 年首航系伪造。',
        '「因韦斯普奇而得名美洲」是 1507 年制图者的选择，不是他本人命名；1507 年的命名事件发生在欧洲，不是航行。',
        '其宣称南抵约南纬 50° 的说法在学界存疑，本线只取巴西—拉普拉塔一线。'
      ],
      sources: [
        ['Britannica · Amerigo Vespucci', 'https://www.britannica.com/biography/Amerigo-Vespucci'],
        ['Britannica · Waldseemüller map', 'https://www.britannica.com/topic/Waldseemuller-map']
      ],
      points: [
        { name: '里斯本', lat: 38.72, lon: -9.14, date: '1501-05-01', label: '1501 年 5 月', kind: 'start', title: '随葡舰队西行', desc: '此行目的为沿卡布拉尔所报海岸继续测绘。' },
        { name: '佛得角 · 圣地亚哥', lat: 14.92, lon: -23.51, date: '1501-06-01', label: '1501 年 6 月', kind: 'way', title: '补给后西南向', desc: '借信风与南赤道流横渡。' },
        { name: '圣奥古斯丁角 / 巴西东北岸', lat: -8.35, lon: -34.95, date: '1501-08-01', label: '1501 年 8 月', kind: 'discovery', title: '接上卡布拉尔的岸线', desc: '沿岸南下，确认海岸线连续延伸而非群岛。' },
        { name: '瓜纳巴拉湾（今里约）', lat: -22.91, lon: -43.17, date: '1502-01-01', label: '1502 年 1 月 1 日', kind: 'way', title: '命名「一月之河」', desc: '葡人误认湾口为大河河口，此即里约热内卢名称由来。' },
        { name: '拉普拉塔河口以南', lat: -36.00, lon: -56.50, date: '1502-04-01', label: '1502 年', kind: 'milestone', title: '海岸持续南延', desc: '越往南走，越不可能是亚洲半岛；此为其「新世界」判断的地理依据。' },
        { name: '里斯本（返回）', lat: 38.72, lon: -9.14, date: '1502-09-01', label: '1502 年 9 月', kind: 'end', title: '书信与概念传播', desc: '《新世界》等文本在欧洲流传，1507 年被制图者采用于命名。' }
      ],
      detours: {
        0: [[25.0, -18.0]],
        1: [[5.0, -25.0], [-5.0, -32.0]],
        2: [[-12.0, -36.0], [-18.0, -39.0]],
        3: [[-28.0, -48.0], [-34.0, -53.0]],
        4: [[-33.0, -32.0], [-15.0, -15.0], [5.0, -22.0], [25.0, -15.0], [36.2, -8.2]]
      }
    },

    {
      id: 'albuquerque', name: '葡萄牙印度洋经略（阿尔梅达—阿尔布克尔克）', shortName: '葡萄牙 · 征服印度洋',
      en: 'Portuguese Indian Ocean Campaign', polity: '葡萄牙王国 · 葡属印度',
      span: '1509 — 1511', type: 'sea', color: '#f0c56a',
      chapter: '第十八—十九章 · 征服印度洋 / 马六甲',
      mission: '以舰队控制印度洋咽喉节点，击破穆斯林—威尼斯香料链，夺取果阿与马六甲并建立要塞—商站体系。',
      gains: [
        '1509-02-03 第乌海战击溃古吉拉特—马穆鲁克联合舰队，确立葡萄牙制海权',
        '1510 年攻取果阿，后成为葡属印度首府',
        '1511-08 攻占马六甲，扼住香料转口咽喉',
        '随后派出船队抵达摩鹿加（香料群岛），完成产地—航线全链控制'
      ],
      disputes: [
        '第乌海战由总督 Francisco de Almeida 指挥，并非阿尔布克尔克；本线是「经略进程」合成，不是单次航行。',
        '果阿 1510 年 3 月首度攻取、5 月失守、11 月 25 日再度夺回，不宜写成一次占领。',
        '「征服印度洋」是结果性概括：阿拉伯、古吉拉特、马来商船仍大量运行，只是被迫纳入通行证（cartaz）体系。'
      ],
      sources: [
        ['Britannica · Afonso de Albuquerque', 'https://www.britannica.com/biography/Afonso-de-Albuquerque'],
        ['Wikipedia · Battle of Diu (1509)', 'https://en.wikipedia.org/wiki/Battle_of_Diu_(1509)']
      ],
      points: [
        { name: '科钦', lat: 9.93, lon: 76.27, date: '1509-01-01', label: '1509 年初', kind: 'start', title: '葡属印度基地', desc: '以此为舰队集结地。' },
        { name: '第乌 Diu', lat: 20.72, lon: 70.98, date: '1509-02-03', label: '1509 年 2 月 3 日', kind: 'discovery', title: '第乌海战', desc: '阿尔梅达率舰队击溃古吉拉特—马穆鲁克联合舰队，印度洋权力格局改变。' },
        { name: '果阿 Goa', lat: 15.49, lon: 73.83, date: '1510-03-01', label: '1510 年', kind: 'discovery', title: '攻取果阿', desc: '一度失守后于同年 11 月夺回，成为葡属印度行政中心。' },
        { name: '马六甲 Malacca', lat: 2.19, lon: 102.25, date: '1511-08-24', label: '1511 年 8 月', kind: 'end', title: '攻占马六甲', desc: '控制连接印度洋与南海的咽喉，随后遣船东赴香料群岛。' }
      ],
      detours: { 0: [[12.0, 74.0], [17.5, 72.0]], 2: [[8.0, 75.5], [6.0, 82.0], [2.0, 96.0], [1.5, 101.0]] }
    },

    {
      id: 'balboa', name: '巴尔沃亚 · 穿越巴拿马地峡', shortName: '巴尔沃亚 · 地峡',
      en: 'Vasco Núñez de Balboa, 1513', polity: '西班牙 · 达连殖民地',
      span: '1513 — 1514', type: 'land', color: '#d9a2c8',
      chapter: '第二十一章 · 发现太平洋',
      mission: '率约 190 名西班牙人与印第安向导自达连穿越地峡，寻找黄金与传闻中的「南海」。',
      gains: [
        '1513-09-25 自地峡山脊望见「南海」（太平洋），欧洲人首次由美洲一侧确认另一片大洋',
        '证明确有另一大洋与另一块大陆，为麦哲伦西航提供直接依据',
        '1519 年被政敌 Pedrarias Dávila 以叛乱罪处死'
      ],
      disputes: [
        '「发现太平洋」指从新大陆首次望见；该大洋此前已被亚洲一侧的航海者熟知， Pacifico 之名出自麦哲伦 1520 年。',
        '望见日期 1513 年 9 月 25 日或 27 日、抵达南海岸 9 月 29 日，诸史料不一。',
        '其穿越路线与望见的具体山峰位置仍有争议；巴尔沃亚 1519 年 1 月被政敌处死，与麦哲伦启航同年。'
      ],
      sources: [
        ['Britannica · Vasco Núñez de Balboa', 'https://www.britannica.com/biography/Vasco-Nunez-de-Balboa'],
        ['Wikipedia · Vasco Núñez de Balboa', 'https://en.wikipedia.org/wiki/Vasco_N%C3%BA%C3%B1ez_de_Balboa']
      ],
      points: [
        { name: '达连 Darién', lat: 8.60, lon: -77.90, date: '1513-09-01', label: '1513 年 9 月', kind: 'start', title: '自圣玛丽亚-德拉安蒂瓜出发', desc: '由海路抵地峡后改为步行穿越雨林与山脊。' },
        { name: '地峡内陆 / 夸雷夸', lat: 8.30, lon: -77.60, date: '1513-09-15', label: '9 月中旬', kind: 'way', title: '沿印第安向导路线翻越', desc: '与当地部族交战并结盟，取得通往南侧海岸的路径。' },
        { name: '圣米格尔湾 · 南海岸', lat: 8.30, lon: -78.30, date: '1513-09-25', label: '1513 年 9 月 25 日', kind: 'discovery', title: '望见「南海」', desc: '巴尔沃亚独自先登山顶望见大洋，数日后全队抵达岸边并宣告占有。' },
        { name: '达连（返回）', lat: 8.60, lon: -77.90, date: '1514-01-01', label: '1514 年 1 月', kind: 'end', title: '携黄金与情报归来', desc: '报告送到西班牙，直接促成后续太平洋远征的筹备。' }
      ]
    },

    {
      id: 'far_east', name: '葡萄牙东亚航线（屯门—种子岛—澳门）', shortName: '葡萄牙 · 东亚航线',
      en: 'Portuguese East Asia Contacts', polity: '葡萄牙王国 / 私人商船',
      span: '1513 — 1557', type: 'sea', color: '#8fd4c3',
      chapter: '第二十八—三十章 · 屯门海战 / 日本 / 澳门',
      mission: '以马六甲为基地北上，寻求与明朝通商，并逐步建立中国—日本之间的转口贸易线。',
      gains: [
        '1513 年欧维士抵珠江口屯门，为有记录的葡萄牙人首次来华',
        '1521 年屯门海战被明军击退，转往闽浙沿海走私贸易',
        '1543 年前后葡萄牙人漂流种子岛，火绳枪（铁炮）传入日本',
        '1557 年取得澳门居住权，形成长期东亚贸易据点'
      ],
      disputes: [
        '1543 年抵种子岛者的姓名与船籍记载不一（有说系中国船上的葡萄牙人）；「铁炮传来」另有 1542 年说。',
        '1517 年 Fernão Pires de Andrade 率船入广州要求通商；1521 年屯门海战失败后受禁，1554 年才恢复广东贸易。',
        '1557 年取得的是澳门「居住权」，不是割让：中国保留主权、司法权与地租征收，1887 年条约前葡方并无主权依据。',
        '「1544 年葡人呼台湾为福尔摩沙」无直接证据，属后世传说；本线为多次航行的进程合成。'
      ],
      sources: [
        ['Britannica · Macau', 'https://www.britannica.com/place/Macau'],
        ['Wikipedia · Tanegashima / 鉄炮伝来', 'https://en.wikipedia.org/wiki/Tanegashima']
      ],
      points: [
        { name: '马六甲', lat: 2.19, lon: 102.25, date: '1513-01-01', label: '1513 年', kind: 'start', title: '自新据点北上', desc: '1511 年取马六甲后，葡方沿中国商船航线北上。' },
        { name: '屯门 / 珠江口', lat: 22.35, lon: 113.95, date: '1513-06-01', label: '约 1513 年', kind: 'discovery', title: '欧维士抵屯门', desc: '有记录的葡萄牙人首次抵达中国沿海，立石柱宣示。' },
        { name: '屯门海战', lat: 22.35, lon: 113.95, date: '1521-06-01', label: '1521 年', kind: 'milestone', title: '明军驱逐葡人', desc: '广东海道副使汪鋐率军击退，葡人被禁入广州海域。' },
        { name: '双屿 / 闽浙走私贸易', lat: 29.80, lon: 122.10, date: '1535-06-01', label: '约 1530—1540 年代', kind: 'way', title: '转往浙闽海域', desc: '与中日私商合流，形成走私—转口网络。' },
        { name: '种子岛', lat: 30.60, lon: 130.98, date: '1543-08-25', label: '约 1543 年', kind: 'discovery', title: '铁炮传入日本', desc: '葡萄牙人漂流抵岛，火绳枪经此传入并被仿制。日期与人数存疑。' },
        { name: '澳门', lat: 22.20, lon: 113.55, date: '1557-06-01', label: '1557 年', kind: 'end', title: '取得澳门居住权', desc: '葡人得以在澳门定居并经营转口贸易，成为长期据点。' }
      ],
      detours: {
        0: [[5.0, 104.0], [12.0, 110.0], [19.0, 112.0]],
        2: [[24.0, 118.0], [27.0, 121.5]],
        3: [[27.0, 125.0], [29.5, 129.0]],
        4: [[25.0, 121.0], [23.0, 116.0]]
      }
    },

    {
      id: 'cortes', name: '科尔特斯 · 墨西哥内陆远征', shortName: '科尔特斯 · 墨西哥',
      en: 'Hernán Cortés, 1519–1521', polity: '西班牙 · 古巴总督辖下远征队',
      span: '1519 — 1521', type: 'land', color: '#e2705e',
      chapter: '第九章 · 新大陆（内陆征服线）',
      mission: '率约 500 人自古巴登陆墨西哥湾，与特拉斯卡拉等原住民部族结盟，推翻阿兹特克三城同盟。',
      gains: [
        '1519-11-08 进入特诺奇蒂特兰并控制蒙特祖玛二世',
        '1520 年「悲惨之夜」溃退后重整，1521-08-13 攻陷该城',
        '建立新西班牙殖民地，美洲白银自此大规模流入全球贸易网络',
        '天花随远征扩散，造成毁灭性人口损失'
      ],
      disputes: [
        '「数百人征服帝国」是简化叙事：决定性因素是数万原住民盟军与天花疫情。',
        '蒙特祖玛二世之死的经过，西班牙编年与后世原住民记述（如《佛罗伦萨手抄本》）互相矛盾。'
      ],
      sources: [
        ['Britannica · Hernán Cortés', 'https://www.britannica.com/biography/Hernan-Cortes'],
        ['Wikipedia · Fall of Tenochtitlan', 'https://en.wikipedia.org/wiki/Fall_of_Tenochtitlan']
      ],
      points: [
        { name: '韦拉克鲁斯', lat: 19.19, lon: -96.14, date: '1519-04-21', label: '1519 年 4 月', kind: 'start', title: '登陆并建城', desc: '凿沉船只断绝退路，正式脱离古巴总督节制。' },
        { name: '特拉斯卡拉', lat: 19.32, lon: -98.24, date: '1519-09-01', label: '1519 年 9 月', kind: 'way', title: '与特拉斯卡拉结盟', desc: '击败后转为盟友，成为远征军主力来源。' },
        { name: '乔卢拉', lat: 19.06, lon: -98.30, date: '1519-10-01', label: '1519 年 10 月', kind: 'way', title: '乔卢拉事件', desc: '先发制人袭击该城，震慑通往谷地的诸城邦。' },
        { name: '特诺奇蒂特兰', lat: 19.43, lon: -99.13, date: '1519-11-08', label: '1519 年 11 月 8 日', kind: 'discovery', title: '进入岛都', desc: '西班牙人首次见到湖上巨城，随后控制蒙特祖玛二世。' },
        { name: '特拉斯卡拉（退却）', lat: 19.32, lon: -98.24, date: '1520-07-01', label: '1520 年 6—7 月', kind: 'way', title: '悲惨之夜', desc: '城中起义后溃退，损失惨重，退往盟友处重整。' },
        { name: '特诺奇蒂特兰（陷落）', lat: 19.43, lon: -99.13, date: '1521-08-13', label: '1521 年 8 月 13 日', kind: 'end', title: '围城陷落', desc: '经数月水陆围城与疫病，夸乌特莫克被俘，三城同盟瓦解。' }
      ]
    },

    {
      id: 'pizarro', name: '皮萨罗 · 印加内陆远征', shortName: '皮萨罗 · 印加',
      en: 'Francisco Pizarro, 1531–1533', polity: '西班牙 · 巴拿马出发',
      span: '1531 — 1533', type: 'land', color: '#df9b4e',
      chapter: '第二十四章 · 印加帝国',
      mission: '率约 170 人自巴拿马沿太平洋岸南下，趁印加王位内战夺取安第斯帝国。',
      gains: [
        '1532-11-16 卡哈马尔卡俘阿塔瓦尔帕，勒索巨额赎金后仍将其处死',
        '1533-11 进入库斯科，印加帝国中枢瓦解',
        '1535 年建利马，西班牙美洲太平洋岸统治成形',
        '安第斯白银（尤其波托西）此后成为全球白银循环的核心来源'
      ],
      disputes: [
        '「169 人征服印加」忽略瓦斯卡尔—阿塔瓦尔帕内战、原住民盟军与疫病；赎金数额诸史料不一。',
        '印加的抵抗在此后持续数十年（比尔卡班巴新政权的存在直至 1572 年），不宜把 1533 年写作「完全征服」。'
      ],
      sources: [
        ['Britannica · Francisco Pizarro', 'https://www.britannica.com/biography/Francisco-Pizarro'],
        ['Wikipedia · Battle of Cajamarca', 'https://en.wikipedia.org/wiki/Battle_of_Cajamarca']
      ],
      points: [
        { name: '巴拿马', lat: 8.98, lon: -79.52, date: '1531-01-01', label: '1531 年 1 月', kind: 'start', title: '三船南下', desc: '约 180 人、27 匹马，沿太平洋岸分期推进。' },
        { name: '通贝斯 Tumbes', lat: -3.57, lon: -80.46, date: '1531-06-01', label: '1531 年', kind: 'way', title: '进入印加北境', desc: '前次侦察已到过的边境城，此时已见内战痕迹。' },
        { name: '圣米格尔 / 皮乌拉', lat: -5.20, lon: -80.63, date: '1532-01-01', label: '1532 年', kind: 'way', title: '建立前进基地', desc: '在此休整并获知阿塔瓦尔帕刚赢得内战。' },
        { name: '卡哈马尔卡 Cajamarca', lat: -7.17, lon: -78.51, date: '1532-11-16', label: '1532 年 11 月 16 日', kind: 'discovery', title: '俘阿塔瓦尔帕', desc: '以突袭俘获印加君主，赎金屋装满金银后仍将其处决。' },
        { name: '库斯科 Cusco', lat: -13.53, lon: -71.97, date: '1533-11-15', label: '1533 年 11 月 15 日', kind: 'end', title: '进入帝国都城', desc: '阿塔瓦尔帕已于同年 8 月 29 日被处死；西班牙人扶植曼科·印卡，随后其反叛形成长期抵抗。' }
      ]
    },

    {
      id: 'cartier', name: '雅克·卡蒂亚 · 圣劳伦斯河', shortName: '卡蒂亚 · 圣劳伦斯',
      en: 'Jacques Cartier, 1534–1542', polity: '法兰西 · 弗朗索瓦一世',
      span: '1534 — 1542', type: 'sea', color: '#7ab8e0',
      chapter: '第二十五章 · 加拿大 / 第三十六章 · 新法兰西（前史）',
      mission: '寻找通往亚洲的西北航道与黄金，勘察圣劳伦斯湾并溯河深入内陆。',
      gains: [
        '1534 年首航测绘圣劳伦斯湾，于加斯佩立十字架宣示主权',
        '1535 年溯河至霍切拉加（今蒙特利尔），确认这是深入内陆的大河而非海峡',
        '首次以文字记录 Stadacona / Hochelaga 等易洛魁语系村落',
        '为法国日后「新法兰西」的地理主张与毛皮贸易奠定基础'
      ],
      disputes: [
        '「加拿大」来自休伦—易洛魁语 kanata（村落），卡蒂亚把它当作国名是后世的归纳性表述。',
        '不宜称「发现圣劳伦斯河」：原住民世代居住，欧洲渔民可能更早到过湾口。'
      ],
      sources: [
        ['Britannica · Jacques Cartier', 'https://www.britannica.com/biography/Jacques-Cartier'],
        ['Wikipedia · Jacques Cartier', 'https://en.wikipedia.org/wiki/Jacques_Cartier']
      ],
      points: [
        { name: '圣马洛 Saint-Malo', lat: 48.65, lon: -2.00, date: '1534-04-20', label: '1534 年 4 月 20 日', kind: 'start', title: '首航西行', desc: '两船约 61 人，受法王委派寻找西北航道。' },
        { name: '纽芬兰外海', lat: 47.60, lon: -53.00, date: '1534-05-10', label: '1534 年 5 月', kind: 'way', title: '进入渔场海域', desc: '欧洲渔船已熟悉的北大西洋西侧。' },
        { name: '加斯佩半岛 Gaspé', lat: 48.83, lon: -64.50, date: '1534-07-24', label: '1534 年 7 月 24 日', kind: 'milestone', title: '立十字架', desc: '以法王名义立十字架，遭当地原住民首领质疑。' },
        { name: '安蒂科斯蒂岛', lat: 49.50, lon: -63.00, date: '1534-08-01', label: '1534 年 8 月', kind: 'way', title: '湾口测绘', desc: '未能确认海湾是否有西向出口，遂返航。' },
        { name: '斯塔达科纳（今魁北克）', lat: 46.81, lon: -71.20, date: '1535-09-07', label: '1535 年 9 月', kind: 'discovery', title: '第二次航行溯河', desc: '在原住民向导带领下由湾口溯圣劳伦斯河而上。' },
        { name: '霍切拉加（今蒙特利尔）', lat: 45.50, lon: -73.57, date: '1535-10-02', label: '1535 年 10 月 2 日', kind: 'milestone', title: '抵急流受阻', desc: '拉欣急流阻断去路，确认此河并非通往亚洲的海峡。' },
        { name: '圣马洛（返回）', lat: 48.65, lon: -2.00, date: '1542-10-01', label: '1542 年', kind: 'end', title: '第三次航行归来', desc: '殖民尝试失败；此后法国数十年未再大规模北进。' }
      ],
      detours: { 0: [[49.0, -7.0], [49.5, -18.0], [47.5, -40.0]], 5: [[47.0, -68.0], [49.0, -55.0], [50.0, -25.0]] }
    },

    {
      id: 'coronado', name: '科罗纳多 · 北美西南远征', shortName: '科罗纳多 · 大峡谷',
      en: 'Coronado Expedition, 1540–1542', polity: '西班牙 · 新西班牙总督辖区',
      span: '1540 — 1542', type: 'land', color: '#b6d16b',
      chapter: '第十六章 · 阿美利加洲（内陆探察线）',
      mission: '寻找传说中的「西沃拉七座黄金城」，率约 340 名西班牙人与大量原住民随从深入北美西南与大平原。',
      gains: [
        '1540 年加西亚·洛佩斯·德·卡德纳斯分队成为首批见到科罗拉多大峡谷的欧洲人',
        '深入大平原，记载野牛与 Querecho / Teya 游牧族群',
        '抵达今堪萨斯一带的 Quivira，证伪「黄金城」传说',
        '测绘北美西南内陆，成为后来西班牙北部边界主张的依据'
      ],
      disputes: [
        '「发现大峡谷」仅指欧洲人首次记录，该地早有普韦布洛等原住民居住。',
        'Quivira 的确切位置仍有争议（堪萨斯中部 vs 内布拉斯加）；本线多个分队的行程为合成。'
      ],
      sources: [
        ['NPS · The Coronado Expedition of 1540–1542', 'http://www.nps.gov/parkhistory/online_books/npsg/coronado_expedition.pdf'],
        ['Britannica · Francisco Vázquez de Coronado', 'https://www.britannica.com/biography/Francisco-Vazquez-de-Coronado']
      ],
      points: [
        { name: '孔波斯特拉（今墨西哥纳亚里特）', lat: 21.20, lon: -105.20, date: '1540-02-01', label: '1540 年 2 月', kind: 'start', title: '自新西班牙西岸集结', desc: '约 340 名西班牙人、数百名原住民随从与牲畜。' },
        { name: '库利亚坎', lat: 24.80, lon: -107.40, date: '1540-04-01', label: '1540 年 4 月', kind: 'way', title: '北上前哨', desc: '主力在此分兵，先遣队由弗赖·马科斯指引北上。' },
        { name: '哈维库 / 西沃拉（祖尼村落）', lat: 35.10, lon: -108.80, date: '1540-07-07', label: '1540 年 7 月', kind: 'discovery', title: '「黄金城」幻灭', desc: '攻占祖尼村落，发现只是土坯聚落，并无黄金。' },
        { name: '大峡谷南缘', lat: 36.10, lon: -112.10, date: '1540-09-01', label: '1540 年 9 月', kind: 'discovery', title: '欧洲人首见大峡谷', desc: '卡德纳斯率小分队西行抵峡谷，尝试下切取水失败。' },
        { name: '蒂格克斯 / 格兰德河谷', lat: 35.10, lon: -106.60, date: '1540-12-01', label: '1540—1541 年冬', kind: 'way', title: '越冬与蒂格克斯战争', desc: '因征用物资与普韦布洛人爆发冲突，后遭王室追责。' },
        { name: '佩科斯 Pecos', lat: 35.55, lon: -105.68, date: '1541-04-01', label: '1541 年春', kind: 'way', title: '受「土耳其人」引导东进', desc: '向导 El Turco 声称东方有黄金之国 Quivira。' },
        { name: '帕洛杜罗峡谷（大平原）', lat: 34.98, lon: -101.66, date: '1541-05-01', label: '1541 年 5 月', kind: 'way', title: '穿越野牛平原', desc: '与 Querecho、Teya 游牧族群相遇，首次以文字记载北美野牛群。' },
        { name: '基维拉 Quivira', lat: 38.35, lon: -98.20, date: '1541-07-01', label: '1541 年夏', kind: 'milestone', title: '大平原尽头', desc: '抵今堪萨斯一带的村落，仍只有草屋与野牛；向导被处死。' },
        { name: '墨西哥城（返回）', lat: 19.43, lon: -99.13, date: '1542-10-01', label: '1542 年', kind: 'end', title: '远征失败归国', desc: '无黄金、损兵折将，但留下北美内陆最早的一批欧洲地理记录。' }
      ]
    },

    {
      id: 'orellana', name: '奥雷利亚纳 · 亚马孙河横穿', shortName: '奥雷利亚纳 · 亚马孙',
      en: 'Francisco de Orellana, 1541–1542', polity: '西班牙 · 贡萨洛·皮萨罗远征队分队',
      span: '1541 — 1542', type: 'land', color: '#68c9b0',
      chapter: '第十六章 · 阿美利加洲（内陆水系探察线）',
      mission: '受贡萨洛·皮萨罗之命沿纳波河下行寻找给养，因水流湍急无法回航，遂顺流横贯南美大陆。',
      gains: [
        '完成首次有记录的欧洲人自安第斯顺亚马孙河抵大西洋的全程穿越',
        '随行神父加斯帕尔·德·卡尔瓦哈尔留下《亚马孙河新发现记》',
        '因与长发原住民战士交战，以希腊女战士传说命名该河为「亚马孙」',
        '证实南美腹地存在横贯东西的巨型水系'
      ],
      disputes: [
        '年份记载相互冲突：中国社科院拉美研究所记 1541 年 12 月分队、1542 年 8 月抵大西洋；另有 1541 年 2 月出发、同年 8 月抵河口的口径。',
        '「女战士」实为长发男性武士或误认，学界基本否定亚马孙女族说。',
        '「被迫漂流」还是「擅自脱离」皮萨罗远征队，皮萨罗与卡尔瓦哈尔的叙述完全对立。'
      ],
      sources: [
        ['中国社科院拉丁美洲研究所 · 奥雷利亚纳，弗朗西斯科·德', 'http://ilas.cssn.cn/sjk/gnwlmyjcgsjk/200811/t20081102_2295428.shtml'],
        ['Britannica · Francisco de Orellana', 'https://www.britannica.com/biography/Francisco-de-Orellana']
      ],
      points: [
        { name: '基多 Quito', lat: -0.18, lon: -78.47, date: '1541-02-01', label: '约 1541 年', kind: 'start', title: '寻找「肉桂之乡」', desc: '贡萨洛·皮萨罗率约 340 名西班牙人与数千印第安挑夫越安第斯东行。' },
        { name: '纳波河上游', lat: -1.05, lon: -77.90, date: '1541-04-01', label: '约 1541 年', kind: 'way', title: '造 San Pedro 号', desc: '缺粮且陆路难行，命奥雷利亚纳率约 50 人造船先行探路。' },
        { name: '科卡河—纳波河汇流（今 Coca 一带）', lat: -0.47, lon: -76.98, date: '1541-12-01', label: '约 1541 年 12 月', kind: 'way', title: '无法逆流返回', desc: '分队在此被水流带离主力；奥雷利亚纳决定继续东下而非回返。' },
        { name: '亚马孙中游（女战士遭遇处）', lat: -3.50, lon: -64.00, date: '1542-06-24', label: '约 1542 年 6 月', kind: 'milestone', title: '与长发战士交战', desc: '卡尔瓦哈尔记载遭「女战士」弓箭抵抗，河名由此而来；学界认为实为长发男性武士。' },
        { name: '内格罗河汇流（今马瑙斯）', lat: -3.12, lon: -60.02, date: '1542-07-15', label: '约 1542 年 7 月', kind: 'way', title: '巨大支流汇入', desc: '沿途记录两岸密林与众多支流，多次登岸抢夺给养。' },
        { name: '亚马孙河口', lat: -0.70, lon: -50.00, date: '1542-08-24', label: '约 1542 年 8 月', kind: 'discovery', title: '驶入大西洋', desc: '首次完成自安第斯到大西洋的全程航行，随后北驶加勒比。' },
        { name: '库瓦瓜岛 / 委内瑞拉海岸', lat: 10.82, lon: -64.18, date: '1542-09-15', label: '约 1542 年 9 月', kind: 'end', title: '转往西班牙述职', desc: '获授新安达卢西亚都统，后再赴亚马孙殖民时身亡。' }
      ]
    },

    {
      id: 'willoughby', name: '威洛比—钱塞勒 · 东北航道', shortName: '东北航道首探',
      en: 'Willoughby & Chancellor, 1553–1554', polity: '英格兰 · 冒险商人公司',
      span: '1553 — 1554', type: 'sea', color: '#9aaee0',
      chapter: '第二十六章 · 东北航道',
      mission: '派三船绕斯堪的纳维亚北端寻找通往中国的东北航道，兼求与俄罗斯通商。',
      gains: [
        '1553 年钱塞勒抵白海，经陆路赴莫斯科觐见伊凡四世',
        '促成 1555 年莫斯科公司成立，开启英俄直接贸易',
        '威洛比与两船船员在拉普兰海岸越冬时全部罹难，东北航道受阻'
      ],
      disputes: [
        '三船在挪威北岸风暴中失散，威洛比最后停泊与遇难地点（科拉半岛 / 挪威北部 / 新地岛）诸说不一。',
        '莫斯科公司（Muscovy Company）有「1553 年组建」与「1555 年获玛丽一世正式特许」两种口径，勿把两件事混为一年。',
        '本线把失散后两支分队的去向合成一条，非单船航迹。'
      ],
      sources: [
        ['Britannica · Muscovy Company', 'https://www.britannica.com/topic/Muscovy-Company'],
        ['Wikipedia · Hugh Willoughby', 'https://en.wikipedia.org/wiki/Hugh_Willoughby']
      ],
      points: [
        { name: '伦敦 / 格林尼治', lat: 51.48, lon: 0.00, date: '1553-05-10', label: '1553 年 5 月', kind: 'start', title: '三船北上', desc: 'Bona Esperanza、Edward Bonaventure、Bona Confidentia。' },
        { name: '北角 North Cape', lat: 71.17, lon: 25.80, date: '1553-07-14', label: '1553 年 7 月', kind: 'way', title: '风暴中失散', desc: '绕斯堪的纳维亚北端后队伍分散，此后各自行动。' },
        { name: '科拉半岛 / 瓦尔德一带', lat: 70.37, lon: 31.10, date: '1553-08-15', label: '1553 年秋', kind: 'milestone', title: '威洛比船队覆没', desc: '两船在此越冬，全员冻饿而死，次年才被俄国渔民发现。' },
        { name: '白海 · 阿尔汉格尔斯克一带', lat: 64.54, lon: 40.53, date: '1553-08-24', label: '1553 年 8 月', kind: 'discovery', title: '钱塞勒抵白海', desc: 'Edward Bonaventure 独自进入白海，遇俄方渔船与当局。' },
        { name: '莫斯科', lat: 55.75, lon: 37.62, date: '1553-12-01', label: '1553 年冬', kind: 'way', title: '觐见伊凡四世', desc: '由陆路赴莫斯科，取得通商许可。' },
        { name: '伦敦（返回）', lat: 51.48, lon: 0.00, date: '1554-07-01', label: '1554 年', kind: 'end', title: '莫斯科公司之始', desc: '贸易成果直接催生 1555 年特许公司。' }
      ],
      detours: { 0: [[56.0, 3.0], [62.0, 5.0], [68.0, 14.0]], 2: [[69.0, 35.0], [66.5, 38.0]] }
    },

    {
      id: 'yermak', name: '叶尔马克 · 越过乌拉尔', shortName: '叶尔马克 · 乌拉尔',
      en: 'Yermak Timofeyevich, 1581–1585', polity: '俄国 · 斯特罗加诺夫家族招募的哥萨克',
      span: '1581 — 1585', type: 'land', color: '#cbb07a',
      chapter: '第四十六—四十七章 · 俄罗斯帝国 / 西伯利亚',
      mission: '受斯特罗加诺夫家族招募，率哥萨克越过乌拉尔征伐西伯利亚汗国，为毛皮与盐商路开路。',
      gains: [
        '1582 年攻占西伯利亚汗国都城伊斯凯尔（Qashliq），库楚姆汗政权瓦解',
        '开启俄罗斯越乌拉尔持续东进的进程',
        '以毛皮贡赋（yasak）制度支撑后续城堡链推进',
        '1585 年在瓦盖河遭夜袭，撤退时溺死'
      ],
      disputes: [
        '出征年份 1581（传统编年）与 1582（多数现代研究）并存，另有 1579、1580 说；溺死年份亦有 1584 年 8 月 5/6 日与 1585 年两说。',
        '叶尔马克生年、出身与部众人数（约 540 / 800 人）均无定论；伊斯凯尔与瓦盖河口的定位学界也有争议。',
        '此为征服与贡赋（yasak）扩张，不宜写成「无人区的发现」——西伯利亚汗国与原住民早已在此。'
      ],
      sources: [
        ['Britannica · Yermak', 'https://www.britannica.com/biography/Yermak'],
        ['Wikipedia · Khanate of Sibir', 'https://en.wikipedia.org/wiki/Khanate_of_Sibir']
      ],
      points: [
        { name: '卡马河 / 彼尔姆边区', lat: 58.00, lon: 56.20, date: '1581-09-01', label: '约 1581 年秋', kind: 'start', title: '自斯特罗加诺夫领地出发', desc: '约 500–800 名哥萨克，携火枪沿河逆流东进。' },
        { name: '乌拉尔山隘', lat: 59.50, lon: 59.00, date: '1581-11-01', label: '约 1581 年冬', kind: 'way', title: '越过欧亚分界', desc: '冬季翻越，改由水路放排而下。' },
        { name: '图拉河 / 秋明一带', lat: 57.15, lon: 65.50, date: '1582-06-01', label: '1582 年', kind: 'way', title: '进入西西伯利亚平原', desc: '与西伯利亚汗国部众开始交战。' },
        { name: '托博尔河', lat: 58.20, lon: 68.20, date: '1582-10-01', label: '1582 年 10 月', kind: 'way', title: '逼近汗国中心', desc: '沿托博尔河推进至额尔齐斯河汇流处。' },
        { name: '伊斯凯尔（卡什雷克）', lat: 58.30, lon: 68.40, date: '1582-10-26', label: '1582 年 10 月', kind: 'discovery', title: '攻占西伯利亚汗国都城', desc: '火器击溃库楚姆汗，哥萨克入驻并收取毛皮贡赋。' },
        { name: '瓦盖河口', lat: 57.80, lon: 68.60, date: '1585-08-06', label: '1585 年 8 月', kind: 'end', title: '夜袭中溺死', desc: '库楚姆汗夜袭，叶尔马克撤退时落水身亡；俄国后续仍持续东进。' }
      ]
    },

    {
      id: 'drake', name: '德雷克 · 金鹿号环球', shortName: '德雷克 · 环球',
      en: 'Francis Drake, 1577–1580', polity: '英格兰 · 伊丽莎白一世私掠特许',
      span: '1577 — 1580', type: 'sea', color: '#e0a6d0',
      chapter: '第三十二—三十三章 · 海盗德雷克 / 英国的崛起',
      mission: '名义探察麦哲伦海峡以南，实则劫掠西班牙太平洋航线，并寻找西北航道出口。',
      gains: [
        '金鹿号完成第二次有记录的环球航行，且指挥官本人全程生还',
        '1579 年在北美西岸登陆并宣称「新阿尔比恩」，英国势力首次进入太平洋',
        '证实火地岛以南并非「南方大陆」，而是开阔海域',
        '带回巨额劫获，1581 年获封爵士；加剧英西矛盾'
      ],
      disputes: [
        '「新阿尔比恩」具体登陆点长期争议（加州 Point Reyes / 俄勒冈 / 更北）。',
        '德雷克的航行日志多被王室封存，细节依赖后世汇编（如《世界环球航行》1628）。',
        '「发现合恩角以南为海」常与 1616 年斯豪滕／勒梅尔绕过合恩角的确认混为一谈。'
      ],
      sources: [
        ['Britannica · Francis Drake', 'https://www.britannica.com/biography/Sir-Francis-Drake'],
        ['Wikipedia · Francis Drake’s circumnavigation', 'https://en.wikipedia.org/wiki/Francis_Drake%27s_circumnavigation']
      ],
      points: [
        { name: '普利茅斯', lat: 50.37, lon: -4.14, date: '1577-12-13', label: '1577 年 12 月 13 日', kind: 'start', title: '五船启航', desc: '旗舰 Pelican 后改名 Golden Hind（金鹿号）。' },
        { name: '佛得角', lat: 14.92, lon: -23.51, date: '1578-01-20', label: '1578 年初', kind: 'way', title: '沿葡属航线南下', desc: '劫掠葡萄牙商船并补足补给。' },
        { name: '拉普拉塔河口', lat: -34.90, lon: -56.20, date: '1578-04-01', label: '1578 年 4 月', kind: 'way', title: '沿南美东岸南下', desc: '在圣胡利安港处置叛乱，弃置两船。' },
        { name: '麦哲伦海峡西口', lat: -53.50, lon: -73.00, date: '1578-08-21', label: '1578 年 8 月', kind: 'milestone', title: '驶入太平洋', desc: '仅用十余日穿过海峡，随后遭长期风暴被推向南方。' },
        { name: '瓦尔帕莱索', lat: -33.04, lon: -71.62, date: '1578-12-01', label: '1578 年 12 月', kind: 'way', title: '西班牙毫无防备的太平洋岸', desc: '劫掠港城与船只，智利以南至秘鲁沿岸无英敌防备。' },
        { name: '卡亚俄 / 利马外海', lat: -12.05, lon: -77.14, date: '1579-02-01', label: '1579 年 2 月', kind: 'way', title: '截获白银船', desc: '随后北上追击 Nuestra Señora de la Concepción，获巨额白银与丝绸。' },
        { name: '新阿尔比恩（北美西岸）', lat: 38.00, lon: -122.90, date: '1579-06-17', label: '1579 年 6 月', kind: 'discovery', title: '登陆修船并宣称领地', desc: '与米沃克人接触，立铜牌宣称归英格兰所有。地点存疑。' },
        { name: '太平洋横渡段', lat: 8.00, lon: -165.00, date: '1579-10-01', label: '1579 年下半年', kind: 'way', title: '西渡太平洋', desc: '约两个多月无补给横渡。示意点。', note: '示意点' },
        { name: '摩鹿加 / 香料群岛', lat: 0.68, lon: 127.40, date: '1579-11-01', label: '1579 年 11 月', kind: 'milestone', title: '与特尔纳特苏丹接触', desc: '取得丁香补给，避开葡萄牙势力西归。' },
        { name: '好望角', lat: -34.36, lon: 18.47, date: '1580-06-01', label: '1580 年 6 月', kind: 'way', title: '绕好望角西归', desc: '经爪哇、南印度洋横渡后绕过非洲南端。' },
        { name: '普利茅斯（返回）', lat: 50.37, lon: -4.14, date: '1580-09-26', label: '1580 年 9 月 26 日', kind: 'end', title: '近三年后归国', desc: '仅金鹿号与约 56 人生还；女王分得巨额收益。' }
      ],
      detours: {
        0: [[36.0, -13.0], [22.0, -19.0]],
        2: [[-40.0, -58.0], [-48.0, -66.0], [-52.0, -70.0]],
        3: [[-38.0, -74.0], [-20.0, -76.0]],
        6: [[20.0, -155.0], [10.0, 160.0], [3.0, 135.0]],
        7: [[5.0, 125.0], [-8.0, 112.0], [-22.0, 80.0], [-34.0, 42.0], [-35.0, 22.0]],
        8: [[-20.0, 0.0], [-5.0, -16.0], [14.0, -20.0], [30.0, -12.0]]
      }
    },

    {
      id: 'siberia', name: '哥萨克东进 · 西伯利亚城堡链', shortName: '哥萨克 · 西伯利亚',
      en: 'Cossack Advance across Siberia', polity: '俄国 · 托博尔斯克／雅库茨克督军辖区',
      span: '1586 — 1640', type: 'land', color: '#9fbf8a',
      chapter: '第四十七—四十八章 · 西伯利亚 / 通古斯人',
      mission: '以城堡（ostrog）链与毛皮贡赋制度沿河系持续东进，横跨欧亚北部直抵太平洋岸。',
      gains: [
        '1586 年建秋明、1587 年建托博尔斯克，确立西伯利亚行政起点',
        '1604 托木斯克、1628 克拉斯诺亚尔斯克、1632 雅库茨克，逐河推进',
        '1639 年哥萨克分队抵鄂霍次克海，俄国首次在太平洋岸立足',
        '约半世纪内把欧亚北部地理轮廓纳入欧洲地图'
      ],
      disputes: [
        '本线为多个互不隶属的哥萨克分队的「城堡推进合成」，不是单支队伍的单次行程；建堡年份各史料略有出入。',
        '关键节点可细分：1586 秋明、1587 托博尔斯克、1604 托木斯克、1619 叶尼塞斯克、1628 克拉斯诺亚尔斯克、1632 雅库茨克、1639 莫斯克维京分队抵鄂霍次克海（1647 年才建鄂霍次克堡）。',
        '这一进程对西伯利亚原住民意味着征服与毛皮贡赋（yasak），不宜写作「无人区的发现」。'
      ],
      sources: [
        ['Britannica · Siberia', 'https://www.britannica.com/place/Siberia'],
        ['Wikipedia · Ostrog (fortress)', 'https://en.wikipedia.org/wiki/Ostrog_(fortress)']
      ],
      points: [
        { name: '秋明 Tyumen', lat: 57.15, lon: 65.50, date: '1586-07-01', label: '1586 年', kind: 'start', title: '第一座俄国城堡', desc: '在叶尔马克之后重建永久据点，标志正式占领。' },
        { name: '托博尔斯克 Tobolsk', lat: 58.20, lon: 68.25, date: '1587-01-01', label: '1587 年', kind: 'way', title: '西伯利亚行政中心', desc: '此后两个世纪为俄国西伯利亚统治中枢。' },
        { name: '托木斯克 Tomsk', lat: 56.50, lon: 84.95, date: '1604-10-01', label: '1604 年', kind: 'way', title: '推进至鄂毕河上游', desc: '控制鄂毕—托木河水系与毛皮产区。' },
        { name: '克拉斯诺亚尔斯克', lat: 56.02, lon: 92.87, date: '1628-08-01', label: '1628 年', kind: 'way', title: '叶尼塞河中游', desc: '城堡链跨过叶尼塞河。' },
        { name: '雅库茨克 Yakutsk', lat: 62.03, lon: 129.73, date: '1632-09-25', label: '1632 年', kind: 'discovery', title: '勒拿河中游据点', desc: '成为向东北与黑龙江方向派队的枢纽。' },
        { name: '鄂霍次克海岸 / 乌利亚河口', lat: 59.40, lon: 143.30, date: '1639-08-01', label: '1639 年', kind: 'discovery', title: '抵太平洋岸', desc: '伊万·莫斯科维京分队抵达，俄国势力首次接触太平洋。' },
        { name: '贝加尔湖', lat: 53.50, lon: 108.00, date: '1640-06-01', label: '约 1640 年代', kind: 'end', title: '南线推进', desc: '同时向南抵贝加尔一带，与蒙古—清朝势力逐渐相接。' }
      ]
    },

    {
      id: 'barents', name: '巴伦支 · 东北航道三航', shortName: '巴伦支 · 北冰洋',
      en: 'Willem Barentsz, 1594–1597', polity: '荷兰 · 阿姆斯特丹商人资助',
      span: '1594 — 1597', type: 'sea', color: '#7fb6d2',
      chapter: '第二十六章 · 东北航道 / 第三十四章 · 海上马车夫（前史）',
      mission: '为绕开西葡控制的南方航路，三度探查经北冰洋通往亚洲的东北航道。',
      gains: [
        '1594–1596 三航测绘新地岛与喀拉海',
        '1596 年发现熊岛与斯匹次卑尔根（斯瓦尔巴），记录高纬海冰',
        '1596–1597 在新地岛被迫越冬，留下欧洲最早有完整记录的北极越冬日志',
        '巴伦支 1597 年 6 月 20 日在返航途中死于坏血病'
      ],
      disputes: [
        '斯瓦尔巴是否更早为诺斯人或俄国波莫尔渔民到访存争议；「巴伦支海」为后世命名。',
        '三次航行的船队构成与资助人各不相同，本线为进程合成。'
      ],
      sources: [
        ['Britannica · Willem Barents', 'https://www.britannica.com/biography/Willem-Barents'],
        ['Wikipedia · Willem Barentsz', 'https://en.wikipedia.org/wiki/Willem_Barentsz']
      ],
      points: [
        { name: '阿姆斯特丹', lat: 52.37, lon: 4.90, date: '1594-06-01', label: '1594 年 6 月', kind: 'start', title: '首次北上', desc: '两船分头探查新地岛以北海域。' },
        { name: '北角 North Cape', lat: 71.17, lon: 25.80, date: '1594-07-01', label: '1594 年 7 月', kind: 'way', title: '绕斯堪的纳维亚', desc: '进入巴伦支海。' },
        { name: '新地岛 Novaya Zemlya', lat: 73.50, lon: 55.00, date: '1594-08-01', label: '1594 年 8 月', kind: 'discovery', title: '抵达冰缘', desc: '沿西岸北进至约 77°N，被浮冰阻挡。' },
        { name: '喀拉海', lat: 72.00, lon: 62.00, date: '1595-08-01', label: '1595 年', kind: 'way', title: '第二次尝试', desc: '喀拉海封冻，航路不通。' },
        { name: '熊岛 / 斯匹次卑尔根', lat: 78.20, lon: 15.60, date: '1596-06-19', label: '1596 年 6 月', kind: 'discovery', title: '发现斯瓦尔巴', desc: '第三次航行改走更西的高纬路线，见大量鲸与海象。' },
        { name: '新地岛越冬地', lat: 76.20, lon: 68.00, date: '1596-09-01', label: '1596—1597 年冬', kind: 'milestone', title: '冰困与木屋越冬', desc: '船被冰封，船员拆船建屋，靠北极熊与补给度过极夜。' },
        { name: '科拉半岛方向（返航）', lat: 69.50, lon: 33.00, date: '1597-06-20', label: '1597 年 6 月 20 日', kind: 'end', title: '巴伦支卒于海上', desc: '弃船乘小艇西逃，获俄国渔船救起其余幸存者。' }
      ],
      detours: { 0: [[57.0, 5.0], [63.0, 8.0], [69.0, 17.0]], 4: [[76.0, 30.0], [75.0, 50.0]], 5: [[73.0, 50.0], [70.5, 38.0]] }
    },

    {
      id: 'voc', name: '荷兰东印度公司 · 亚洲航线网', shortName: 'VOC · 亚洲航线',
      en: 'Dutch East India Company Network', polity: '荷兰联省共和国 · VOC',
      span: '1602 — 1624', type: 'sea', color: '#f2a65a',
      chapter: '第三十四章 · 海上马车夫 / 第三十八章 · 台湾',
      mission: '以股份制公司组织远洋贸易，建立好望角—巴达维亚—平户—大员的亚洲区间转口网络。',
      gains: [
        '1602 年 VOC 成立，可发行股票并拥有缔约、铸币、开战之权',
        '1609 年获德川幕府许可在平户设商馆',
        '1619 年在爪哇建巴达维亚，作为亚洲贸易总部',
        '1624 年在大员（台湾）建据点，介入东亚转口贸易'
      ],
      disputes: [
        '1602–1624 为「机构航线网络合成」，非单次航行；VOC 是否「第一家现代股份公司」在学界有定义争论。',
        '「海上马车夫」是后起的中文史学术语，并非 17 世纪荷兰或英国文献中的自称。',
        'VOC 的贸易伴随武力垄断与强迫供应（如班达群岛），不宜只写成商业扩张。'
      ],
      sources: [
        ['Britannica · Dutch East India Company', 'https://www.britannica.com/topic/Dutch-East-India-Company'],
        ['Wikipedia · Dutch East India Company', 'https://en.wikipedia.org/wiki/Dutch_East_India_Company']
      ],
      points: [
        { name: '阿姆斯特丹', lat: 52.37, lon: 4.90, date: '1602-03-20', label: '1602 年 3 月 20 日', kind: 'start', title: 'VOC 成立', desc: '获联省议会 21 年特许状，垄断好望角以东的荷兰贸易。' },
        { name: '好望角', lat: -34.36, lon: 18.47, date: '1602-09-01', label: '约 1602 年后', kind: 'way', title: '沿葡属航路东行', desc: '初期仍沿用葡萄牙的印度洋航线与季风规律。' },
        { name: '平户 Hirado', lat: 33.37, lon: 129.55, date: '1609-07-01', label: '1609 年', kind: 'discovery', title: '日本商馆', desc: '获德川家康许可通商，成为对日贸易起点。' },
        { name: '巴达维亚（今雅加达）', lat: -6.13, lon: 106.75, date: '1619-05-01', label: '1619 年', kind: 'discovery', title: '亚洲总部', desc: '总督科恩夺取并改建，成为 VOC 区内航运与仓储中枢。' },
        { name: '大员 / 台湾', lat: 23.00, lon: 120.15, date: '1624-09-01', label: '1624 年', kind: 'end', title: '建热兰遮城', desc: '在中国东南沿海取得转口据点，直至 1662 年为郑成功所逐。' }
      ],
      detours: {
        0: [[36.0, -10.0], [10.0, -16.0], [-15.0, -6.0], [-34.0, 12.0]],
        1: [[-34.0, 40.0], [-22.0, 75.0], [-6.0, 100.0]],
        2: [[27.0, 124.0], [20.0, 118.0], [5.0, 110.0], [-4.0, 106.0]],
        3: [[0.0, 108.0], [12.0, 114.0], [20.0, 118.0]]
      }
    },

    {
      id: 'champlain', name: '尚普兰 · 新法兰西内陆', shortName: '尚普兰 · 五大湖',
      en: 'Samuel de Champlain, 1608–1616', polity: '法兰西 · 新法兰西',
      span: '1608 — 1616', type: 'land', color: '#d4b06b',
      chapter: '第三十六章 · 新法兰西 / 第三十五章 · 哈得孙和西北航道（同期）',
      mission: '在圣劳伦斯河建立永久殖民地，与原住民结盟，并沿内陆水系寻找通往「中国海」的道路。',
      gains: [
        '1608 年建魁北克城，新法兰西首个永久据点',
        '1609 年抵尚普兰湖并参与对易洛魁人的战斗，绘出较精确地图',
        '1615 年经渥太华河—尼皮辛湖抵休伦湖，深入五大湖内陆',
        '奠定法国毛皮贸易与传教网络的空间骨架'
      ],
      disputes: [
        '「发现尚普兰湖」指欧洲人首次记录，湖区早为原住民领地。',
        '其 1613 年渥太华河行程的路线细节与是否确曾抵达，学界仍有讨论。',
        '1609 年 7 月他在尚普兰湖与易洛魁人交战时，哈得孙正率 Half Moon 号在不足 160 km 外的哈得孙河探路，两队互不知情。'
      ],
      sources: [
        ['Britannica · Samuel de Champlain', 'https://www.britannica.com/biography/Samuel-de-Champlain'],
        ['Wikipedia · Samuel de Champlain', 'https://en.wikipedia.org/wiki/Samuel_de_Champlain']
      ],
      points: [
        { name: '塔杜萨克 Tadoussac', lat: 48.14, lon: -69.71, date: '1608-06-03', label: '1608 年 6 月', kind: 'start', title: '溯圣劳伦斯河', desc: '自法国抵河口后上行，选择建城地点。' },
        { name: '魁北克 Québec', lat: 46.81, lon: -71.20, date: '1608-07-03', label: '1608 年 7 月 3 日', kind: 'discovery', title: '建魁北克', desc: '河身收窄处建「居住所」（Habitation），新法兰西由此成形。' },
        { name: '尚普兰湖', lat: 44.50, lon: -73.35, date: '1609-07-01', label: '1609 年 7 月', kind: 'discovery', title: '南下探察与首战', desc: '与休伦、阿尔冈昆盟友同行，火枪击退莫霍克人。' },
        { name: '渥太华河 / 马塔瓦', lat: 46.30, lon: -78.70, date: '1613-06-01', label: '1613 年', kind: 'way', title: '西向水路', desc: '沿渥太华河探查通往内陆的路线。' },
        { name: '休伦尼亚 / 乔治亚湾', lat: 44.50, lon: -79.70, date: '1615-08-01', label: '1615 年', kind: 'discovery', title: '抵五大湖内陆', desc: '经渥太华河—尼皮辛湖抵休伦尼亚（锡姆科湖一带），随休伦人南下作战并负伤；同年哈得孙旧部仍在哈得孙湾活动。' },
        { name: '魁北克（返回）', lat: 46.81, lon: -71.20, date: '1616-07-01', label: '1616 年', kind: 'end', title: '回驻地整理地图', desc: '出版航行记与地图，推动法国后续殖民投入。' }
      ]
    },

    {
      id: 'janszoon', name: 'Duyfken 号 · 首次记录的澳洲登陆', shortName: '扬松 · 澳洲北岸',
      en: 'Willem Janszoon, 1606', polity: '荷兰 · VOC 万丹商馆',
      span: '1606 — 1606', type: 'sea', color: '#e9c46a',
      chapter: '第三十七章 · 澳大利亚',
      mission: '自万丹东行探查新几内亚以南海域，寻找贸易机会与可能的黄金产地。',
      gains: [
        '1606 年首次有确切文献记载的欧洲人登陆澳大利亚（约克角半岛西岸）',
        '测绘约克角西岸约 300 公里海岸线',
        '同年托雷斯穿越托雷斯海峡，但报告长期封存于西班牙档案'
      ],
      disputes: [
        '「谁第一个发现澳大利亚」有争议：原住民已居住数万年；另有 16 世纪 Dieppe 地图等未证实的葡人说法。',
        '扬松本人以为所到之处是新几内亚的一部分，并未意识到这是一块独立大陆；同年托雷斯穿越约 150°E 的托雷斯海峡，其报告要到 1762–1765 年才被英方从马尼拉档案中确认。',
        '澳洲东南岸要到 1770 年库克才进入欧洲地图，本时段内该处与澳洲内陆应保持迷雾。'
      ],
      sources: [
        ['Britannica · Willem Janszoon', 'https://www.britannica.com/biography/Willem-Janszoon'],
        ['Wikipedia · Duyfken', 'https://en.wikipedia.org/wiki/Duyfken']
      ],
      points: [
        { name: '万丹 Banten', lat: -6.03, lon: 106.00, date: '1605-11-18', label: '1605 年 11 月', kind: 'start', title: '自爪哇东行', desc: '受 VOC 万丹商馆派往新几内亚以南侦察。' },
        { name: '帝汶 / 班达海', lat: -9.00, lon: 125.00, date: '1606-01-01', label: '1606 年初', kind: 'way', title: '穿过群岛海域', desc: '沿印尼东部岛链向东南推进。' },
        { name: '约克角半岛西岸 · 彭尼法瑟河', lat: -12.60, lon: 141.90, date: '1606-02-26', label: '1606 年 2 月 26 日', kind: 'discovery', title: '首次有记录的澳洲登陆', desc: 'Duyfken 号在此登岸，与当地原住民发生冲突；同年 3 月 6 日托雷斯另率两船东航。' },
        { name: '卡奔塔利亚湾北缘', lat: -13.80, lon: 141.60, date: '1606-06-01', label: '1606 年 6 月', kind: 'end', title: '南行至约 13°S 折返', desc: '误认为是新几内亚海岸延伸，未继续南下；报告长期封存于荷兰档案。' }
      ],
      detours: { 0: [[-7.0, 112.0], [-8.5, 119.0]], 1: [[-10.5, 132.0], [-11.5, 138.0]] }
    },

    {
      id: 'hudson', name: '亨利·哈得孙 · 西北航道两航', shortName: '哈得孙 · 西北航道',
      en: 'Henry Hudson, 1609–1611', polity: '荷兰 VOC（1609）／英格兰（1610）',
      span: '1609 — 1611', type: 'sea', color: '#8ec7e0',
      chapter: '第三十五章 · 哈得孙和西北航道',
      mission: '先后受荷兰与英格兰资助，寻找通往亚洲的西北／东北捷径。',
      gains: [
        '1609 年溯哈得孙河至今奥尔巴尼一带，为荷兰「新尼德兰」主张提供依据',
        '1610 年经哈得孙海峡进入哈得孙湾，首次系统测绘该内海',
        '1611 年船员叛变，哈得孙父子及数人被放入小艇后失踪',
        '其航迹成为后来哈得孙湾公司毛皮贸易的地理基础'
      ],
      disputes: [
        '1609（Half Moon，VOC）与 1610–1611（Discovery，英格兰）是不同资助方、不同船只的两次航行，本线为合成。',
        '哈得孙误以为哈得孙河可能是通太平洋的海峡；1611 年 6 月被放逐后的结局无可靠记载。',
        '1609 年 7—9 月哈得孙在南下东岸时，尚普兰正在尚普兰湖（相距不足 160 km）活动，两支互不知情的探险队同期在场。'
      ],
      sources: [
        ['Britannica · Henry Hudson', 'https://www.britannica.com/biography/Henry-Hudson'],
        ['Wikipedia · Henry Hudson', 'https://en.wikipedia.org/wiki/Henry_Hudson']
      ],
      points: [
        { name: '阿姆斯特丹', lat: 52.37, lon: 4.90, date: '1609-04-04', label: '1609 年 4 月 4 日', kind: 'start', title: 'Half Moon 号启航', desc: '受 VOC 委派寻东北航道，冰阻后擅自改向西行。' },
        { name: '北角外海', lat: 71.00, lon: 30.00, date: '1609-05-01', label: '1609 年 5 月', kind: 'way', title: '东北航路受阻', desc: '遇冰后转向西渡大西洋。' },
        { name: '纽芬兰外海', lat: 46.00, lon: -50.00, date: '1609-07-01', label: '1609 年 7 月', kind: 'way', title: '沿北美海岸南下', desc: '在缅因湾一带修补船只后继续南行。' },
        { name: '哈得孙河口', lat: 40.50, lon: -74.00, date: '1609-09-03', label: '1609 年 9 月 3 日', kind: 'discovery', title: '进入大河', desc: '误以为这可能是通往太平洋的海峡。' },
        { name: '今奥尔巴尼一带', lat: 42.65, lon: -73.76, date: '1609-09-20', label: '1609 年 9 月', kind: 'way', title: '河道变浅折返', desc: '确认不是海峡；沿途与原住民交易毛皮。' },
        { name: '伦敦', lat: 51.50, lon: -0.13, date: '1610-04-17', label: '1610 年 4 月 17 日', kind: 'way', title: 'Discovery 号再出发', desc: '改受英格兰资助，直指北美北部的西北航道。' },
        { name: '哈得孙海峡', lat: 62.00, lon: -70.00, date: '1610-08-01', label: '1610 年 8 月', kind: 'way', title: '穿过冰封海峡', desc: '进入被误认为太平洋的广大内海。' },
        { name: '哈得孙湾', lat: 58.00, lon: -88.00, date: '1610-09-01', label: '1610 年 9 月', kind: 'discovery', title: '测绘内海', desc: '沿岸南行寻找出口，最终被冰封。' },
        { name: '詹姆斯湾越冬地', lat: 53.00, lon: -80.00, date: '1610-11-01', label: '1610—1611 年冬', kind: 'end', title: '叛变与放逐', desc: '1611 年 6 月 22 日前后部分船员哗变，把哈得孙父子及 7 人放入小艇，此后下落不明。' }
      ],
      detours: {
        0: [[57.0, 3.0], [66.0, 8.0], [70.0, 20.0]],
        1: [[62.0, 5.0], [55.0, -18.0], [47.0, -40.0]],
        4: [[45.0, -62.0], [50.0, -30.0], [51.0, -8.0]],
        5: [[55.0, -12.0], [60.0, -38.0], [62.0, -58.0]],
        6: [[61.0, -78.0], [58.5, -84.0]]
      }
    },

    {
      id: 'tasman', name: '塔斯曼 · 南方大陆两次航行', shortName: '塔斯曼 · 新西兰',
      en: 'Abel Tasman, 1642–1644', polity: '荷兰 · 荷属东印度总督范迪门',
      span: '1642 — 1644', type: 'sea', color: '#a9a1e8',
      chapter: '第三十七章 · 澳大利亚',
      mission: '探查「南方大陆」的范围，寻找通往南美的新航路及可能的贸易与黄金。',
      gains: [
        '1642-11-24 抵范迪门地（今塔斯马尼亚），欧洲人首次有记录地见到该岛',
        '1642-12-13 抵新西兰南岛西岸，与毛利人发生冲突',
        '1644 年第二次航行测绘澳大利亚北岸与卡奔塔利亚湾',
        '否定「南方大陆」与已知陆地相连的旧设想'
      ],
      disputes: [
        '塔斯曼并未完成环澳航行，也未把新西兰与「南方大陆」关系弄清；「发现新西兰」仅指欧洲人首次记录，毛利人早已定居。',
        '两次航行的具体航线细节主要依赖其日志副本，个别坐标有争议。'
      ],
      sources: [
        ['Britannica · Abel Janszoon Tasman', 'https://www.britannica.com/biography/Abel-Janszoon-Tasman'],
        ['Wikipedia · Abel Tasman', 'https://en.wikipedia.org/wiki/Abel_Tasman']
      ],
      points: [
        { name: '巴达维亚', lat: -6.13, lon: 106.75, date: '1642-08-14', label: '1642 年 8 月 14 日', kind: 'start', title: '两船启航', desc: 'Heemskerck 与 Zeehaen，奉总督范迪门之命南探。' },
        { name: '毛里求斯', lat: -20.16, lon: 57.50, date: '1642-10-08', label: '1642 年 10 月', kind: 'way', title: '西渡印度洋补给', desc: '在此整备后先南下再东行，刻意取高纬航路。' },
        { name: '南印度洋高纬航段', lat: -45.00, lon: 90.00, date: '1642-11-01', label: '1642 年 11 月', kind: 'way', title: '借西风东行', desc: '示意点，非停靠。', note: '示意点' },
        { name: '范迪门地（塔斯马尼亚）', lat: -42.00, lon: 147.00, date: '1642-11-24', label: '1642 年 11 月 24 日', kind: 'discovery', title: '望见南方陆地', desc: '以总督范迪门之名命名；12 月初派人登岸取水，未遇居民。' },
        { name: '新西兰南岛 Golden Bay', lat: -40.60, lon: 172.70, date: '1642-12-13', label: '1642 年 12 月 13 日', kind: 'discovery', title: '「杀人湾」冲突', desc: '与毛利人发生冲突，四名船员被杀，未登陆即北上。' },
        { name: '汤加（1643-01-21）/ 斐济（1643-02-01）', lat: -20.00, lon: -175.00, date: '1643-01-21', label: '1643 年 1—2 月', kind: 'way', title: '北转经群岛', desc: '在此补给后沿新几内亚北岸西归巴达维亚。' },
        { name: '巴达维亚（返回）', lat: -6.13, lon: 106.75, date: '1643-06-15', label: '1643 年 6 月', kind: 'way', title: '首航结束', desc: '被认为收获有限，但仍获派第二次航行。' },
        { name: '卡奔塔利亚湾（第二次航行）', lat: -14.00, lon: 140.00, date: '1644-04-01', label: '1644 年', kind: 'end', title: '测绘澳洲北岸', desc: '绘出北岸与湾内轮廓，仍未意识到这是一整块大陆。' }
      ],
      detours: {
        0: [[-10.0, 100.0], [-16.0, 80.0]],
        1: [[-30.0, 65.0], [-42.0, 78.0], [-47.0, 110.0], [-45.0, 135.0]],
        3: [[-44.0, 160.0], [-43.0, 170.0]],
        4: [[-25.0, 178.0], [-18.0, -170.0]],
        5: [[-10.0, 160.0], [-5.0, 135.0], [-5.0, 115.0]],
        6: [[-6.0, 120.0], [-9.0, 132.0], [-12.0, 137.0]]
      }
    },

    {
      id: 'amur', name: '哥萨克南下黑龙江 · 尼布楚划界', shortName: '黑龙江 · 尼布楚',
      en: 'Russian Amur Advance & Treaty of Nerchinsk', polity: '俄国 / 清朝（对侧）',
      span: '1643 — 1689', type: 'land', color: '#d98b7a',
      chapter: '第四十九—五十章 · 黑龙江和库页岛 / 尼布楚条约',
      mission: '哥萨克自雅库茨克南下寻找粮食与毛皮产地，进入黑龙江流域；最终与清朝发生边界冲突并划界。',
      gains: [
        '1643–1646 波亚尔科夫分队首次有记录的俄国人进入黑龙江流域并抵鄂霍次克海',
        '1649–1650 哈巴罗夫建阿尔巴津（雅克萨），引发清俄军事冲突',
        '1685–1686 清军两次雅克萨之战',
        '1689 年《尼布楚条约》划定中俄东段边界，是清朝与欧洲国家签订的首个近代条约'
      ],
      disputes: [
        '本线把波亚尔科夫（1643–1646）、哈巴罗夫（1649–1650 年代）与后续雅克萨之战、界务谈判串成一条「进程线」，并非单支队伍或单次行程。',
        '雅克萨建堡年份有 1650（哈巴罗夫）、1651、1665（逃亡哥萨克重建）三说；《尼布楚条约》以拉丁文文本为准，满文／俄文译本措辞有别。',
        '1689 年 8 月 27 日为俄历（儒略历），合格里历 9 月 7 日；年份与日期口径不同会造成「1689 年 9 月」的写法差异。',
        '哥萨克在黑龙江流域的劫掠，俄方编年与清方档案叙述差异极大；库页岛此期仅传闻，应继续留在迷雾中。'
      ],
      sources: [
        ['Wikipedia · Treaty of Nerchinsk', 'https://en.wikipedia.org/wiki/Treaty_of_Nerchinsk'],
        ['Britannica · Yerofey Khabarov', 'https://www.britannica.com/biography/Yerofey-Pavlovich-Khabarov']
      ],
      points: [
        { name: '雅库茨克', lat: 62.03, lon: 129.73, date: '1643-07-15', label: '1643 年 7 月 15 日', kind: 'start', title: '波亚尔科夫分队南下', desc: '奉督军之命寻找「有粮食与银矿的南方大河」，随行约 133 人。' },
        { name: '结雅河上游越冬地', lat: 55.00, lon: 126.00, date: '1643-12-01', label: '1643—1644 年冬', kind: 'way', title: '翻越分水岭越冬', desc: '冬季拖船越岭，粮尽，死者甚众。' },
        { name: '结雅河口 / 黑龙江上游', lat: 53.50, lon: 126.50, date: '1644-06-01', label: '1644 年', kind: 'discovery', title: '进入黑龙江流域', desc: '与达斡尔等当地居民冲突并强征毛皮与粮食。' },
        { name: '黑龙江口 / 鄂霍次克海', lat: 52.95, lon: 141.10, date: '1645-06-01', label: '1645 年', kind: 'way', title: '顺流抵海', desc: '由河口转入鄂霍次克海，次年绕回雅库茨克。' },
        { name: '雅库茨克（返回）', lat: 62.03, lon: 129.73, date: '1646-07-01', label: '1646 年', kind: 'way', title: '带回黑龙江情报', desc: '报告促成 1649 年起哈巴罗夫的私人远征。' },
        { name: '阿尔巴津 / 雅克萨', lat: 53.40, lon: 124.80, date: '1651-06-01', label: '约 1650—1651 年', kind: 'milestone', title: '建堡与清俄冲突', desc: '哈巴罗夫建堡，1650 年代起清军多次进剿；建堡年份另有 1650、1665 两说。' },
        { name: '雅克萨第一次之战', lat: 53.40, lon: 124.80, date: '1685-06-01', label: '1685 年', kind: 'way', title: '清军克城', desc: '康熙帝遣彭春等率军攻克并拆毁城堡，俄军随后复来。' },
        { name: '雅克萨第二次之战', lat: 53.40, lon: 124.80, date: '1686-07-01', label: '1686 年', kind: 'way', title: '长期围困促和议', desc: '清军再围，俄方遣使求和，双方转向尼布楚谈判。' },
        { name: '尼布楚 Nerchinsk', lat: 51.96, lon: 116.58, date: '1689-08-27', label: '1689 年 8 月 27 日', kind: 'end', title: '《尼布楚条约》', desc: '俄历 8 月 27 日（格里历 9 月 7 日）签订，以外兴安岭—额尔古纳河划界，俄方放弃黑龙江流域据点。' }
      ]
    },

    {
      id: 'mississippi', name: '密西西比河探察（马凯特—若利埃 / 拉萨尔）', shortName: '密西西比河流域',
      en: 'Marquette–Jolliet & La Salle', polity: '法兰西 · 新法兰西 / 路易十四',
      span: '1673 — 1682', type: 'land', color: '#c2d17a',
      chapter: '第三十六章 · 新法兰西（内陆延伸）',
      mission: '探查「西部大河」是否注入墨西哥湾或太平洋；随后由拉萨尔全程下行并宣称流域主权。',
      gains: [
        '1673 年马凯特与若利埃确认密西西比河南流入墨西哥湾，而非通太平洋',
        '1682-04-09 拉萨尔抵河口，以路易十四之名宣称整个流域为「路易斯安那」',
        '为法国构建从圣劳伦斯到墨西哥湾的北美腹地殖民链提供依据'
      ],
      disputes: [
        '1673 与 1682 是两支不同队伍，本线为合成。',
        '首位有记录的欧洲人抵达密西西比河是德索托远征队 1541 年 5 月（约 34.8°N, 90.5°W 一带），比马凯特早 132 年。',
        '拉萨尔宣称的「流域」范围在当时并无实际控制，且原住民诸族早已在此居住数千年。'
      ],
      sources: [
        ['Britannica · Jacques Marquette', 'https://www.britannica.com/biography/Jacques-Marquette'],
        ['Britannica · René-Robert Cavelier de La Salle', 'https://www.britannica.com/biography/Rene-Robert-Cavelier-sieur-de-La-Salle']
      ],
      points: [
        { name: '圣伊尼亚斯 / 密歇根湖', lat: 45.87, lon: -84.73, date: '1673-05-17', label: '1673 年 5 月 17 日', kind: 'start', title: '两艘独木舟出发', desc: '耶稣会士马凯特与毛皮商若利埃，同行五人及原住民向导。' },
        { name: '威斯康星河', lat: 43.30, lon: -89.70, date: '1673-06-01', label: '1673 年 6 月', kind: 'way', title: '转入西部大河', desc: '经福克斯—威斯康星河水系进入密西西比河。' },
        { name: '密西西比河上游', lat: 42.50, lon: -90.50, date: '1673-06-17', label: '1673 年 6 月 17 日', kind: 'discovery', title: '初见大河', desc: '沿河南下，记录沿岸原住民部落与地貌。' },
        { name: '阿肯色河口', lat: 33.80, lon: -91.10, date: '1673-07-01', label: '1673 年 7 月', kind: 'milestone', title: '判断注入墨西哥湾', desc: '确认河流南向入墨西哥湾后折返，避免进入西班牙势力范围。' },
        { name: '密歇根湖（返回）', lat: 45.87, lon: -84.73, date: '1673-09-01', label: '1673 年 9 月', kind: 'way', title: '带回地图', desc: '马凯特所绘地图成为后续法国探察的基础。' },
        { name: '伊利诺伊河（拉萨尔出发）', lat: 41.30, lon: -88.50, date: '1682-02-01', label: '1682 年 2 月', kind: 'way', title: '全程下行', desc: '率约 20 余名法国人与原住民随从顺流南下。' },
        { name: '密西西比河三角洲', lat: 29.15, lon: -89.25, date: '1682-04-09', label: '1682 年 4 月 9 日', kind: 'end', title: '宣称路易斯安那', desc: '立十字架与王室纹章，宣称自河口至上游整个流域归法王所有。' }
      ]
    },

    {
      id: 'koxinga', name: '郑成功 · 收复台湾', shortName: '郑成功 · 台湾',
      en: 'Koxinga, 1661–1662', polity: '南明 / 明郑政权',
      span: '1661 — 1662', type: 'sea', color: '#e6b06b',
      chapter: '第三十八、四十一—四十二章 · 台湾 / 英雄郑成功 / 收复台湾',
      mission: '率军自金厦渡海，驱逐荷兰东印度公司在台湾西南部的统治，建立抗清后方基地。',
      gains: [
        '1661 年经鹿耳门水道登陆，避开荷军主炮位并围困热兰遮城',
        '1662 年 2 月荷兰总督揆一投降，结束荷兰在台约 38 年统治',
        '建立明郑政权在台湾的统治基础，汉人移民与屯垦显著扩大'
      ],
      disputes: [
        '「收复台湾」是现代史学表述；17 世纪语境为明郑与清、荷三方角力。',
        '荷兰东印度公司的实际控制主要限于台湾西南部及若干据点，并非全岛。'
      ],
      sources: [
        ['Wikipedia · Siege of Fort Zeelandia', 'https://en.wikipedia.org/wiki/Siege_of_Fort_Zeelandia'],
        ['Britannica · Koxinga', 'https://www.britannica.com/biography/Koxinga']
      ],
      points: [
        { name: '金门 / 厦门', lat: 24.43, lon: 118.10, date: '1661-03-01', label: '1661 年 3 月', kind: 'start', title: '整军渡海', desc: '约 2.5 万人、数百艘船，趁清军主力他顾东渡。' },
        { name: '澎湖', lat: 23.57, lon: 119.60, date: '1661-04-01', label: '1661 年 4 月', kind: 'way', title: '候风集结', desc: '在此等候潮候与风向。' },
        { name: '鹿耳门水道', lat: 23.00, lon: 120.15, date: '1661-04-30', label: '1661 年 4 月 30 日', kind: 'discovery', title: '涨潮突入', desc: '借大潮经浅水道进入台江内海，绕开热兰遮城炮火。' },
        { name: '热兰遮城 Fort Zeelandia', lat: 23.00, lon: 120.15, date: '1662-02-01', label: '1662 年 2 月 1 日', kind: 'end', title: '荷方投降', desc: '经约九个月围困，揆一签约撤出；郑成功不久后病逝。' }
      ],
      detours: { 0: [[23.8, 118.8], [23.4, 119.3]] }
    }
  ];

  /* ---------- 归一化 + 一致性校验 ---------- */
  function dateFrac(s) {
    var t = Date.parse(s + 'T00:00:00Z');
    if (!isFinite(t)) throw new Error('非法日期：' + s);
    var y = new Date(t).getUTCFullYear();
    return y + (t - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
  }

  var ALL = (global.VOYAGES || []).concat(NEW);
  ALL.forEach(function (e, i) {
    var m = META[e.id];
    if (m) {
      e.type = m.type; e.chapter = m.chapter;
      e.mission = m.mission; e.gains = m.gains;
    }
    e.type = e.type || 'sea';
    e.mission = e.mission || e.tagline || '';
    e.gains = e.gains || [];
    e.disputes = e.disputes || [];
    e.sources = e.sources || [];
    e.facts = e.facts || [];
    e.summary = e.summary || '';
    e.detours = e.detours || {};
    e.chapter = e.chapter || '《透过地理看历史·大航海时代》相关章回';
    if (!/^#[0-9a-fA-F]{6}$/.test(e.color)) throw new Error('非法配色：' + e.id);
    if (!e.points || e.points.length < 2) throw new Error('航点不足：' + e.id);
    e.t0 = dateFrac(e.points[0].date);
    e.t1 = dateFrac(e.points[e.points.length - 1].date);
    for (var j = 1; j < e.points.length; j++) {
      var d = dateFrac(e.points[j].date) - dateFrac(e.points[j - 1].date);
      if (d <= 0) throw new Error('日期未递增：' + e.id + ' #' + j + ' ' + e.points[j].date);
      if (e.points[j].lat < -90 || e.points[j].lat > 90 || e.points[j].lon < -180 || e.points[j].lon > 180) {
        throw new Error('经纬度越界：' + e.id + ' #' + j);
      }
    }
    // 原 5 条船的 span 里含「—」，这里补一个数值区间供筛选使用
    e.startYear = Math.floor(e.t0);
    e.endYear = Math.floor(e.t1);
    // 按「年份」而非精确日期判定队伍是否在场：用户把时间轴停在 1492 年时，
    // 应能看到当年 8 月出发的哥伦布，而不是显示「无在航船队」。
    e.a0 = e.startYear;
    e.a1 = Math.ceil(e.t1);
    e._i = i;
  });

  global.EXPEDITIONS = ALL;
  global.ATLAS_UTIL = {
    activeAt: function (y) { return ALL.filter(function (e) { return y >= e.a0 && y <= e.a1; }); },
    byId: function (id) { return ALL.filter(function (e) { return e.id === id; })[0] || null; }
  };
})(window);
