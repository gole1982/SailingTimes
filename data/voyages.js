/* 大航海时代 · 航线与史实数据
 *
 * 所有人物、日期、地点均依据权威史料整理，存在争议处一律在 disputes / point.note 中标注。
 * 经纬度为十进制度近似值（东经/北纬为正），用于地球仪示意，非考古级定位。
 * 标注 "示意" 的点仅用于航路曲线造型，不是史料记载的停靠地。
 */
window.VOYAGES = [
  {
    id: 'zhenghe',
    no: '01',
    name: '郑和',
    en: 'Zheng He',
    life: '约 1371 — 1433',
    polity: '大明 · 永乐至宣德朝',
    span: '1405 — 1433',
    color: '#e3b45c',
    colorSoft: 'rgba(227,180,92,0.22)',
    tagline: '七下西洋，舟师贯通西太平洋与印度洋',
    timeMode: 'distance',
    routeNote: '本线为七次远洋的「代表航点合成」，按地理顺序排列，并非单次航行时序；相邻航点以大圆弧连接，仅为航路示意。',
    summary:
      '宦官、正使太监，奉明成祖朱棣之命于 1405 年首航，此后 28 年间七率庞大舟师出使「西洋」。航线沿中南半岛—马来群岛—印度洋季风走廊展开，前三次抵占城、爪哇、满剌加、锡兰山与古里，并于旧港剿灭海盗陈祖义；第四至七次西进忽鲁谟斯、亚丁与红海，分遣队抵东非斯瓦希里海岸。随行马欢《瀛涯胜览》、费信《星槎胜览》、巩珍《西洋番国志》与《郑和航海图》为主要史料。',
    facts: [
      ['次数 / 跨度', '七次，1405–1433，约 28 年'],
      ['首航人数', '《明史·郑和传》记「将士卒二万七千八百余人」'],
      ['宝船数', '《明史》记「修四十四丈、广十八丈者六十二」'],
      ['主要史料', '《明史》《瀛涯胜览》《星槎胜览》《郑和航海图》'],
      ['最远范围', '东非斯瓦希里海岸（今肯尼亚、索马里一带）']
    ],
    disputes: [
      '「317 艘」是后世把《殊域周咨录》255 艘与《明史》62 艘宝船相加所得，非一手记录明文；Dreyer 认为属重复计算，首航船队更可能约 250 艘。',
      '《明史》「四十四丈 × 十八丈」换算约 138 m × 56 m，多数学者认为夸张或传抄讹误；南京龙江宝船厂出土舵杆推定最大船约 70–75 m。',
      '卒地与卒年均存疑：主流说 1433 年卒于第七次归途古里并海葬、南京牛首山为衣冠冢；另有 1434 末 / 1435 初卒于南京之说。',
      '东非诸点多由分遣队抵达，郑和本人是否亲至无定论；「到过澳大利亚」等说法属推测，不采用。'
    ],
    sources: [
      ['Britannica · Zheng He’s Achievements', 'https://www.britannica.com/summary/Zheng-Hes-Achievements'],
      ['《明史·郑和传》原文', 'https://big5.cctv.com/gate/big5/www.cctv.cn/history/special/C14156/20050614/101158.shtml'],
      ['国家民委 · 郑和下西洋（含宝船尺寸编者注）', 'https://www.neac.gov.cn/seac/c103391/202310/1168371.shtml']
    ],
    points: [
      { name: '南京 · 龙江关', lat: 32.06, lon: 118.80, date: '1405-07-11', label: '1405 年 7 月 11 日', kind: 'start', title: '奉诏开洋', desc: '永乐三年六月十五，奉诏出使西洋；龙江关宝船厂为造船与决策地。' },
      { name: '刘家港（太仓浏河）', lat: 31.55, lon: 121.10, date: '1405-09-01', label: '1405 年冬', kind: 'way', title: '舟师集结', desc: '船队自刘家港集结出海，是七下西洋的主要出海口。' },
      { name: '福建长乐 · 五虎门', lat: 26.05, lon: 119.65, date: '1405-12-01', label: '候季风', kind: 'way', title: '候风出洋', desc: '于闽江口候东北季风；长乐现存《天妃灵应之记》碑（郑和等立）。' },
      { name: '占城（今越南归仁一带）', lat: 13.77, lon: 109.23, date: '1406-01-15', label: '首航', kind: 'way', title: '首达占城', desc: '沿中南半岛南下，占城为前三次航行的常到之地。' },
      { name: '满剌加（马六甲）', lat: 2.19, lon: 102.25, date: '1406-03-01', label: '中转', kind: 'milestone', title: '设官厂中转', desc: '满剌加成为船队往返印度洋的核心中转站与物资囤积地。' },
      { name: '旧港（巨港，苏门答腊）', lat: -2.99, lon: 104.76, date: '1407-01-01', label: '1407 年', kind: 'milestone', title: '擒海盗陈祖义', desc: '首航归途于旧港击灭海盗陈祖义集团，为《明史》明载事迹。' },
      { name: '锡兰山（加勒一带）', lat: 6.03, lon: 80.22, date: '1409-01-01', label: '第三次航行', kind: 'milestone', title: '锡兰山布施碑', desc: '立汉文、泰米尔文、波斯文三语布施碑（现藏科伦坡国家博物馆）；另有锡兰山之战俘其国王之记载。' },
      { name: '科摩林角 Cape Comorin', lat: 8.08, lon: 77.55, date: '1410-01-01', label: '绕印度南端', kind: 'way', title: '绕行印度半岛南端', desc: '船队须绕科摩林角才能由孟加拉湾转入阿拉伯海；此处加入航路示意点，避免把航线画成直穿印度大陆。', note: '示意点 · 非停靠' },
      { name: '古里 Calicut', lat: 11.25, lon: 75.78, date: '1411-01-01', label: '历次必至', kind: 'milestone', title: '古里：西洋枢纽', desc: '印度西岸核心中转站，前三次航行的终点之一。传统说郑和 1433 年卒于此并海葬，但卒地卒年均有争议。' },
      { name: '忽鲁谟斯 Hormuz', lat: 27.10, lon: 56.45, date: '1413-01-01', label: '第四次起', kind: 'discovery', title: '西进波斯湾', desc: '第四至七次航行延伸至此，并分赴亚丁、天方（麦加）方向。' },
      { name: '亚丁 / 天方方向', lat: 12.79, lon: 45.03, date: '1417-01-01', label: '第五、六次', kind: 'way', title: '红海入口', desc: '史料记有通往亚丁、天方的分遣航线，带回各国使节与异物。' },
      { name: '木骨都束 Mogadishu', lat: 2.04, lon: 45.34, date: '1417-02-01', label: '东非', kind: 'way', title: '东非斯瓦希里海岸', desc: '《明史》所列国名之一；东非诸点多为分遣队抵达，郑和本人是否亲至无定论。' },
      { name: '麻林地 Malindi', lat: -3.22, lon: 40.12, date: '1417-03-01', label: '常引最远点', kind: 'discovery', title: '麻林地 / 慢八撒', desc: '中国官方文博资料常表述为「最远到达非洲东岸赤道以南的麻林地与慢八撒」；带回长颈鹿（被视为麒麟）。' },
      { name: '慢八撒 Mombasa', lat: -4.05, lon: 39.67, date: '1417-04-01', label: '东非', kind: 'end', title: '舟师极西', desc: '《郑和航海图》与《明史》系统所及的东非南界附近。此后远航随永乐帝去世而终止，档案多被毁。' }
    ]
  },

  {
    id: 'dias',
    no: '02',
    name: '巴托洛梅乌·迪亚士',
    shortName: '迪亚士',
    en: 'Bartolomeu Dias',
    life: '约 1450 — 1500.05.29',
    polity: '葡萄牙王国 · 若昂二世',
    span: '1487 — 1488',
    color: '#63c7c1',
    colorSoft: 'rgba(99,199,193,0.22)',
    tagline: '首位绕过非洲南端的欧洲人，实证两洋相通',
    summary:
      '率三艘船沿非洲西岸南行，因风暴被推入南大西洋、在未见陆地的情况下绕过好望角与厄加勒斯角，成为已知第一位绕过非洲南端的欧洲人，推翻托勒密「印度洋被陆地封闭」之说。船队东行至大鱼河后因哗变与补给不足折返，返程才首次望见好望角。后监督建造达·伽马远航用的 São Gabriel 与 São Rafael；1500 年作为卡布拉尔舰队船长之一，在好望角风暴中随船沉没遇难。',
    facts: [
      ['船队', '3 艘：São Cristóvão（旗舰）、São Pantaleão、一艘补给船'],
      ['出发 / 返回', '1487 年 8 月（另有 1486 说）／ 1488 年 12 月'],
      ['最远点', 'Rio do Infante，今大鱼河 Great Fish River / Kwaaihoek'],
      ['关键结论', '大西洋与印度洋相通，好望角航路成立']
    ],
    disputes: [
      '出发年份：编年史家 Barros 记 1486 年 8 月，但 Duarte Pacheco Pereira 与哥伦布均记其 1488 年 12 月返回，现代学界通常定为 1487 年 8 月。',
      '他并未「登陆好望角」：权威记载只说 1488 年 5 月返程望见（sighted）；实际登陆与立石柱处在莫塞尔湾、大鱼河等地。',
      '莫塞尔湾日期有 2 月 3 日（Britannica）与 3 月 12 日（其他记载）两个口径。',
      '「风暴角」由谁命名、由谁改名「好望角」存在史料分歧。'
    ],
    sources: [
      ['Britannica · Bartolomeu Dias', 'https://www.britannica.com/biography/Bartolomeu-Dias'],
      ['Britannica Students · 1500 海难', 'https://kids.britannica.com/students/article/Aachen/273992']
    ],
    points: [
      { name: '里斯本 Lisbon', lat: 38.72, lon: -9.14, date: '1487-08-01', label: '1487 年 8 月', kind: 'start', title: '奉若昂二世之命出航', desc: '沿迪奥戈·康已探明的非洲西岸继续南下，寻找通往印度的海路。出发年份另有 1486 说。' },
      { name: '刚果河口', lat: -6.05, lon: 12.40, date: '1487-10-01', label: '1487 年秋', kind: 'way', title: '越过迪奥戈·康标柱', desc: '越过此前葡萄牙航海的最南界，进入未知海岸。' },
      { name: '沃尔维斯湾 Walvis Bay', lat: -22.96, lon: 14.51, date: '1487-12-08', label: '1487 年 12 月 8 日', kind: 'way', title: '抵纳米比亚海岸', desc: '史料记载的明确节点之一，此后继续南下并立 padrão 石柱。' },
      { name: '迪亚士角 / 吕德里茨', lat: -26.65, lon: 15.16, date: '1487-12-20', label: '1487 年 12 月', kind: 'way', title: '立 padrão 石柱', desc: '葡萄牙航海家以石柱宣示抵达最南界；此点今名 Dias Point。' },
      { name: '南大西洋风暴绕行点', lat: -37.00, lon: 17.50, date: '1488-01-15', label: '1488 年 1 月', kind: 'discovery', title: '风暴中绕过好望角而未见', desc: '被风暴推离岸约 13 天，绕过好望角与厄加勒斯角却始终未见陆地。示意点，非停靠。', note: '示意点 · 非停靠' },
      { name: '莫塞尔湾 Mossel Bay', lat: -34.18, lon: 22.12, date: '1488-02-03', label: '1488 年 2 月 3 日', kind: 'milestone', title: '绕过之后首次见陆地', desc: 'Angra de São Brás，证明海岸已转向东北——非洲南端确已被绕过。登陆日期另有 3 月 12 日说。' },
      { name: '阿尔戈阿湾 Algoa Bay', lat: -33.96, lon: 25.60, date: '1488-02-20', label: '1488 年', kind: 'way', title: 'Angra da Roca', desc: '沿岸继续东行，接近此行的极限。' },
      { name: '大鱼河 · Kwaaihoek', lat: -33.49, lon: 27.13, date: '1488-03-01', label: '1488 年', kind: 'discovery', title: '最远点：Rio do Infante', desc: '立 São Gregório 石柱后，因船员哗变与补给不足折返。1938 年在 False Island 发现石柱残件，可作佐证。' },
      { name: '好望角 Cape of Good Hope', lat: -34.36, lon: 18.47, date: '1488-05-01', label: '1488 年 5 月', kind: 'milestone', title: '返程首次望见好望角', desc: '仅「望见」，并未登陆。此处十年后成为达·伽马通往印度的门户。' },
      { name: '埃尔米纳 Mina / Elmina', lat: 5.08, lon: -1.35, date: '1488-09-01', label: '返程', kind: 'way', title: '返程停泊', desc: '经普林西比岛、埃尔米纳等据点北返。' },
      { name: '里斯本 Lisbon', lat: 38.72, lon: -9.14, date: '1488-12-01', label: '1488 年 12 月', kind: 'end', title: '归来：印度洋不再是内海', desc: '历时约 16 个月，实证大西洋与印度洋相通。1500 年 5 月 29 日他随卡布拉尔舰队在此间海域遇难。' }
    ]
  },

  {
    id: 'columbus',
    no: '03',
    name: '克里斯托弗·哥伦布',
    shortName: '哥伦布',
    en: 'Christopher Columbus',
    life: '1451 — 1506.05.20',
    polity: '热那亚出身 · 受卡斯蒂利亚与阿拉贡双王资助',
    span: '1492 — 1493',
    color: '#c98f6a',
    colorSoft: 'rgba(201,143,106,0.22)',
    tagline: '借信风横渡大西洋，建立欧洲—加勒比持续航路',
    summary:
      '1492 年 8 月 3 日率 Santa María、Pinta、Niña 三船（约 87–90 人）自帕洛斯出发，先南下加那利借东北信风西渡，10 月 12 日在巴哈马群岛的 Guanahani 登陆并命名 San Salvador，随后抵古巴与伊斯帕尼奥拉，误认古巴为亚洲大陆，并以「印第安人」称呼当地居民。首航证明了利用盛行风带横渡大西洋并返航的可行性。他至死仍认为所到之地属亚洲近海，并未认识到这是一片欧洲人未知的大陆。',
    facts: [
      ['船队', 'Santa María（旗舰，nao 型）、Pinta、Niña；约 87–90 人'],
      ['出发 / 返回', '1492-08-03 帕洛斯 ／ 1493-03-15 帕洛斯'],
      ['首次登陆', '1492-10-12 Guanahani（命名 San Salvador）'],
      ['首航结果', '建立跨大西洋往返航路；1492-12-25 Santa María 触礁，39 人留守 La Navidad']
    ],
    disputes: [
      'Guanahani 是今天哪个岛明确存在争议：主流认定为 San Salvador / Watlings Island；1986 年 National Geographic 提出 Samana Cay，另有 Plana Cays、Rum Cay、Cat Island 等多种候选。原始航海日志已佚，仅存 Las Casas 摘抄本。',
      '「伊莎贝拉典当珠宝资助航行」是 Las Casas 在 16 世纪首造的神话；经费实际来自王室财政官 Luis de Santángel 牵头的热那亚/佛罗伦萨银行家财团。',
      '10 月 12 日先见陆地者是 Pinta 上的 Rodrigo de Triana，哥伦布后来把这份荣誉归于自己。',
      '不宜简化为「他以为自己到了中国」：准确说法是他至死坚信所到之地属亚洲/印度群岛范围（近亚洲）。'
    ],
    sources: [
      ['Britannica · Christopher Columbus', 'https://www.britannica.com/biography/Christopher-Columbus'],
      ['Britannica · San Salvador Island', 'https://www.britannica.com/place/San-Salvador-Island-The-Bahamas']
    ],
    points: [
      { name: '帕洛斯 Palos de la Frontera', lat: 37.23, lon: -6.90, date: '1492-08-03', label: '1492 年 8 月 3 日', kind: 'start', title: '三船启碇', desc: 'Santa María、Pinta、Niña 自 Tinto 河口出发，受费尔南多二世与伊莎贝尔一世资助。' },
      { name: '拉戈梅拉 La Gomera', lat: 28.09, lon: -17.11, date: '1492-09-06', label: '1492 年 9 月 6 日', kind: 'way', title: '最后离港', desc: '在加那利整备补给，随后借东北信风西渡。' },
      { name: '东北信风横渡段', lat: 24.00, lon: -40.00, date: '1492-09-25', label: '9 月 — 10 月', kind: 'way', title: '信风带西行', desc: '全程无停靠，船员因久不见陆地而动摇。示意点，非停靠。', note: '示意点 · 非停靠' },
      { name: '瓜纳哈尼 / 圣萨尔瓦多', lat: 24.05, lon: -74.48, date: '1492-10-12', label: '1492 年 10 月 12 日', kind: 'discovery', title: '首次登陆 Guanahani', desc: '哥伦布命名 San Salvador。主流认定为今 San Salvador / Watlings Island，但具体岛屿长期存疑（另有 Samana Cay 等说）。' },
      { name: '古巴 · 巴里艾 Bariay', lat: 21.08, lon: -75.95, date: '1492-10-28', label: '1492 年 10 月 28 日', kind: 'milestone', title: '抵古巴，误认亚洲大陆', desc: '误以为已抵「日本/亚洲大陆」，派出使者寻找大汗。' },
      { name: '伊斯帕尼奥拉 · La Navidad', lat: 19.75, lon: -72.20, date: '1492-12-25', label: '1492 年 12 月 25 日', kind: 'milestone', title: '旗舰触礁，39 人留守', desc: 'Santa María 触礁沉没，以船材建 La Navidad 据点，留下 39 人；此为首航殖民据点之始。' },
      { name: '亚速尔 · 圣玛丽亚岛', lat: 36.97, lon: -25.09, date: '1493-02-18', label: '1493 年 2 月', kind: 'way', title: '返航遇风暴', desc: 'Niña 与 Pinta 借西风带返航，经亚速尔时被葡方短暂扣人。' },
      { name: '里斯本 Lisbon', lat: 38.72, lon: -9.14, date: '1493-03-04', label: '1493 年 3 月初', kind: 'way', title: '风暴被迫停靠', desc: '会见葡王若昂二世，随后驶回西班牙。' },
      { name: '帕洛斯（返回）', lat: 37.23, lon: -6.90, date: '1493-03-15', label: '1493 年 3 月 15 日', kind: 'end', title: '归航：航路成立', desc: '首航证明盛行风带可支撑跨大西洋往返。此后他又三次西航，但至死仍把加勒比当作亚洲近海。' }
    ]
  },

  {
    id: 'dagama',
    no: '04',
    name: '瓦斯科·达·伽马',
    shortName: '达·伽马',
    en: 'Vasco da Gama',
    life: '约 1460 — 1524.12.24',
    polity: '葡萄牙王国 · 曼努埃尔一世',
    span: '1497 — 1499',
    color: '#d9a441',
    colorSoft: 'rgba(217,164,65,0.22)',
    tagline: '首次由欧洲直航印度，开启印度航线',
    summary:
      '1497 年 7 月 8 日率四船约 170 人自里斯本（传统说自 Restelo，今贝伦）启碇，采用南大西洋西风弧线 volta do mar 远离非洲海岸约三个月，11 月 22 日绕过好望角，沿东非斯瓦希里海岸北上，在马林迪取得一名熟悉季风的印度（古吉拉特）领航员后横渡阿拉伯海约 23 天，1498 年 5 月 20 日抵卡利卡特，成为首位经海路到达印度的欧洲人。虽未与扎莫林签订商约、返航损失两船与过半船员，但带回的香料证实航路价值，直接开启葡萄牙印度航线 Carreira da Índia。',
    facts: [
      ['船队', '4 艘：São Gabriel、São Rafael、Berrio、一艘名号不详的补给船；约 170 人'],
      ['出发 / 抵达', '1497-07-08 里斯本 ／ 1498-05-20 卡利卡特'],
      ['返抵', '1499 年 8 月底–9 月初（各史料不一）；Berrio 号 7 月 10 日先返'],
      ['生还', '约 55 人，多死于坏血病']
    ],
    disputes: [
      '「阿拉伯航海家伊本·马吉德领航」高度存疑，现代学界基本否定：该说最早见于约 1560 年奥斯曼史家（事发 60 余年后）；葡萄牙原始记录称领航员是古吉拉特人，伊本·马吉德本人著作从未提及且当时已约 77 岁退休。',
      '出发地「雷斯泰洛 / 贝伦」出自 Barros 编年史的可靠传统，但 Britannica 与《Roteiro》只写「里斯本 / 塔霍河」，不宜写成一手日志原文。',
      '返抵里斯本日期有 1499 年 8 月 29 日、9 月 8 日、9 月 9 日、9 月 18 日诸说；人数有 170 / 150–160 / 约 200 三种口径。',
      '马林迪日期 4 月 14 日与 15 日略有出入。'
    ],
    sources: [
      ['Britannica Scholars · Vasco da Gama（含逐日航线）', 'https://kids.britannica.com/scholars/article/Vasco-da-Gama/35948'],
      ['Britannica · When did Vasco da Gama leave Lisbon?', 'https://www.britannica.com/biography/When-did-Vasco-da-Gama-leave-Lisbon-on-his-first-voyage-to-India'],
      ['Wikipedia · Ahmad ibn Majid（领航传说反证）', 'https://en.wikipedia.org/wiki/Ahmad_ibn_Majid']
    ],
    points: [
      { name: '里斯本 · 雷斯泰洛（今贝伦）', lat: 38.70, lon: -9.20, date: '1497-07-08', label: '1497 年 7 月 8 日', kind: 'start', title: '四船启碇', desc: '携带 3 名通译与 padrões 石柱；出发地「Restelo」为 Barros 编年史的传统说法。' },
      { name: '佛得角 · 圣地亚哥', lat: 14.92, lon: -23.51, date: '1497-07-26', label: '7 月 26 日 — 8 月 3 日', kind: 'way', title: '最后补给', desc: '此后驶入南大西洋外海，约三个月不见陆地。' },
      { name: '南大西洋 volta do mar', lat: -34.00, lon: -12.00, date: '1497-09-20', label: '8 月 — 11 月', kind: 'milestone', title: '西风弧线', desc: '为避开几内亚湾逆流而远绕南大西洋，这一航路经验直接承自迪亚士。示意点，非停靠。', note: '示意点 · 非停靠' },
      { name: '圣赫勒拿湾 St Helena Bay', lat: -32.71, lon: 18.13, date: '1497-11-07', label: '1497 年 11 月 7 日', kind: 'way', title: '重新望见非洲', desc: '离岸约三个月后靠岸取水。' },
      { name: '好望角 Cape of Good Hope', lat: -34.36, lon: 18.47, date: '1497-11-22', label: '1497 年 11 月 22 日', kind: 'discovery', title: '绕过好望角', desc: '11 月 19 日望见、22 日绕过，随后进入印度洋——欧洲通往印度的海路由此打通。' },
      { name: '莫塞尔湾 Mossel Bay', lat: -34.18, lon: 22.12, date: '1497-11-25', label: '11 月 25 日 — 12 月 8 日', kind: 'way', title: '拆解补给船', desc: '立石柱、拆解补给船并把物资分装到三艘船上。' },
      { name: '纳塔尔海岸 Natal', lat: -29.86, lon: 31.02, date: '1497-12-25', label: '1497 年 12 月 25 日', kind: 'milestone', title: '越迪亚士最远点 · 命名 Natal', desc: '12 月 16 日越过大鱼河，圣诞节抵此海岸，因圣诞（Natal）得名。' },
      { name: '吉兆河 / 克利马内', lat: -17.88, lon: 36.89, date: '1498-01-25', label: '1498 年 1 月 25 日', kind: 'way', title: 'Rio dos Bons Sinais', desc: '进入斯瓦希里海岸的穆斯林商贸网络，开始需要领航与通译。' },
      { name: '莫桑比克岛', lat: -15.03, lon: 40.73, date: '1498-03-02', label: '1498 年 3 月 2 日', kind: 'way', title: '抵莫桑比克', desc: '与当地苏丹交涉受阻，此后在蒙巴萨亦遭敌意。' },
      { name: '蒙巴萨 Mombasa', lat: -4.05, lon: 39.67, date: '1498-04-07', label: '1498 年 4 月 7 日', kind: 'way', title: '蒙巴萨', desc: '因关系紧张迅速北驶，转往与蒙巴萨敌对的马林迪。' },
      { name: '马林迪 Malindi', lat: -3.22, lon: 40.12, date: '1498-04-14', label: '1498 年 4 月 14 日', kind: 'milestone', title: '取得印度领航员', desc: '马林迪苏丹提供一名熟悉印度洋季风的古吉拉特籍领航员。「伊本·马吉德领航」为后世传说，现代学界基本否定。' },
      { name: '卡利卡特 Calicut / Kozhikode', lat: 11.25, lon: 75.78, date: '1498-05-20', label: '1498 年 5 月 20 日', kind: 'discovery', title: '抵达印度！', desc: '横渡阿拉伯海约 23 天后抵达，成为首位经海路到达印度的欧洲人。因赠礼粗陋且受穆斯林商人排挤，未能与扎莫林签订商约。' },
      { name: '马林迪（返程）', lat: -3.22, lon: 40.12, date: '1499-01-07', label: '1499 年 1 月 7 日', kind: 'way', title: '逆季风返航 · 焚弃 São Rafael', desc: '返航横渡耗时近三个月、坏血病肆虐，因人手不足焚毁一船。' },
      { name: '好望角（返程）', lat: -34.36, lon: 18.47, date: '1499-03-20', label: '1499 年 3 月 20 日', kind: 'way', title: '再度绕过好望角', desc: '反向通过，完成往返闭环。' },
      { name: '亚速尔群岛', lat: 36.97, lon: -25.09, date: '1499-08-10', label: '1499 年', kind: 'way', title: '葬兄 Paulo', desc: '达·伽马在此安葬病逝的兄长 Paulo da Gama。' },
      { name: '里斯本（返回）', lat: 38.72, lon: -9.14, date: '1499-09-01', label: '1499 年 8 月底 — 9 月初', kind: 'end', title: '归来：香料证实航路价值', desc: '仅约 55 人生还、损失两船，但带回的香料使葡萄牙随即组建印度航线。返回日期各史料不一。' }
    ]
  },

  {
    id: 'magellan',
    no: '05',
    name: '麦哲伦 — 埃尔卡诺远征',
    shortName: '麦哲伦 / 埃尔卡诺',
    en: 'Magellan – Elcano Expedition',
    life: '麦哲伦 约 1480 — 1521.04.27；埃尔卡诺 约 1487 — 1526.08.04',
    polity: '葡萄牙人麦哲伦效力西班牙王室；巴斯克人埃尔卡诺完成归程',
    span: '1519 — 1522',
    color: '#a58ede',
    colorSoft: 'rgba(165,142,222,0.22)',
    tagline: '人类首次环球航行，由埃尔卡诺率 Victoria 号完成',
    summary:
      '1519 年 9 月 20 日五船约 265–270 人自桑卢卡尔出海。1520 年 10 月 21 日发现南美南端海峡入口，11 月 28 日驶入麦哲伦命名的「太平洋」，以约 98 天横渡，1521 年 3 月抵关岛与菲律宾。麦哲伦于 1521 年 4 月 27 日介入马克坦岛部族冲突时战死，并未完成环球。最终由埃尔卡诺指挥 Victoria 号横渡印度洋、绕好望角、经佛得角西归，1522 年 9 月 6 日返抵桑卢卡尔，18 人生还，完成史上首次环球，并实证了「向西航行会丢失一天」的日期差与地球远超预期的尺度。',
    facts: [
      ['五船', 'Trinidad（旗舰）、San Antonio、Concepción、Victoria、Santiago'],
      ['出发 / 返回', '1519-09-20 ／ 1522-09-06，均为桑卢卡尔-德巴拉梅达'],
      ['出发人数', '约 265–270 人（另有 239 名欧洲人等口径）'],
      ['生还', 'Victoria 号返抵时 18 人（含埃尔卡诺、Pigafetta）'],
      ['关键史料', 'Pigafetta 逐日纪行、桑卢卡尔官方档案']
    ],
    disputes: [
      '「麦哲伦完成首次环球」是错的：他 1521 年已战死，仅完成约一半航程。严格归属应为「麦哲伦–埃尔卡诺远征，由埃尔卡诺率 Victoria 号完成」。',
      '生还 18 人与 17 人之差：Britannica 部分条目记 9 月 9 日抵塞维利亚、17 名欧洲生还者（另有 4 名印度籍船员），与 9 月 6 日抵桑卢卡尔、18 人生还是两个不同口径的事件。',
      '海峡有三个不同里程碑，勿混为一天：10 月 21 日发现维尔赫内斯角/入口、11 月 1 日进入海峡、11 月 28 日驶出进入太平洋。',
      '出发人数 239 / 265 / 270 三种口径并存；埃尔卡诺生年 1476 与 1486/87 两说，后者据 1519 年本人自述约 32 岁更可信。'
    ],
    sources: [
      ['Britannica · Ferdinand Magellan', 'https://www.britannica.com/biography/Ferdinand-Magellan/Allegiance-to-Spain'],
      ['桑卢卡尔官方旅游局 · First voyage around the World (PDF)', 'https://www.sanlucarturismo.com/wp-content/uploads/2019/08/First-voyage-around-the-World.pdf'],
      ['Wikipedia · Magellan expedition', 'https://en.wikipedia.org/wiki/Magellan_expedition']
    ],
    points: [
      { name: '桑卢卡尔-德巴拉梅达', lat: 36.78, lon: -6.35, date: '1519-09-20', label: '1519 年 9 月 20 日', kind: 'start', title: '五船出海', desc: '8 月 10 日自塞维利亚内河启程，9 月 20 日自瓜达尔基维尔河口正式出海，寻西行通往香料群岛之路。' },
      { name: '特内里费 / 加那利', lat: 28.29, lon: -16.36, date: '1519-10-03', label: '1519 年 10 月 3 日', kind: 'way', title: '最后补给', desc: '9 月 26 日抵、10 月 3 日离港，此后横渡大西洋。' },
      { name: '圣奥古斯丁角 / 累西腓外海', lat: -8.35, lon: -34.95, date: '1519-11-29', label: '1519 年 11 月 29 日', kind: 'way', title: '抵巴西海岸', desc: '沿南美海岸南下，寻找通往「南海」的海峡。' },
      { name: '里约热内卢湾', lat: -22.91, lon: -43.17, date: '1519-12-13', label: '1519 年 12 月 13 日', kind: 'way', title: '瓜纳巴拉湾', desc: '停泊补给，葡萄牙方面已在此区域活动。' },
      { name: '拉普拉塔河口', lat: -34.90, lon: -56.20, date: '1520-01-10', label: '1520 年 1 月', kind: 'way', title: '误寻海峡', desc: '误以为宽阔河口即通往太平洋的海峡，探查后失望继续南下。' },
      { name: '圣胡利安港', lat: -49.31, lon: -67.72, date: '1520-03-31', label: '1520 年 3 月 31 日 — 8 月 24 日', kind: 'milestone', title: '过冬与复活节叛乱', desc: '在南巴塔哥尼亚越冬，爆发船长叛乱并被镇压；Santiago 号此前侦察时失事。' },
      { name: '维尔赫内斯角 / 海峡东口', lat: -52.33, lon: -68.37, date: '1520-10-21', label: '1520 年 10 月 21 日', kind: 'discovery', title: '发现海峡入口', desc: '发现南美南端海峡（后名麦哲伦海峡）；San Antonio 号在探路中叛逃返航。' },
      { name: '麦哲伦海峡西口', lat: -53.50, lon: -73.00, date: '1520-11-28', label: '1520 年 11 月 28 日', kind: 'discovery', title: '驶入「太平洋」', desc: '11 月 1 日进入海峡、28 日驶出，成为首批由大西洋进入太平洋的欧洲人，并因海面平静命名 Pacífico。' },
      { name: '太平洋横渡段', lat: -14.82, lon: -138.98, date: '1521-01-24', label: '约 98 天', kind: 'milestone', title: '无补给的 98 天', desc: '坏血病与饥饿肆虐；2 月 13 日过赤道约 158°W。示意点，非停靠。', note: '示意点 · 非停靠' },
      { name: '关岛 Guam', lat: 13.44, lon: 144.79, date: '1521-03-06', label: '1521 年 3 月 6 日', kind: 'milestone', title: '终于补给', desc: '抵马里亚纳群岛，首次获得新鲜食物与淡水。' },
      { name: '利马萨瓦 Limasawa', lat: 9.94, lon: 125.07, date: '1521-03-16', label: '1521 年 3 月 16 日', kind: 'way', title: '抵菲律宾', desc: '3 月 16 日起在菲律宾群岛活动，随后转往宿务并与当地统治者结盟。' },
      { name: '宿务 Cebu', lat: 10.29, lon: 123.88, date: '1521-04-07', label: '1521 年 4 月', kind: 'way', title: '结盟与传教', desc: '卷入岛际政治，为随后的马克坦岛冲突埋下伏笔。' },
      { name: '马克坦岛 Mactan', lat: 10.31, lon: 123.95, date: '1521-04-27', label: '1521 年 4 月 27 日', kind: 'death', title: '麦哲伦战死', desc: '介入当地部族冲突时被杀。他并未完成环球，仅走完约一半航程。' },
      { name: '蒂多雷 / 香料群岛', lat: 0.68, lon: 127.40, date: '1521-11-08', label: '1521 年 11 月', kind: 'milestone', title: '抵达香料群岛', desc: 'Concepción 号因缺员被凿沉；Victoria 号装满丁香，由埃尔卡诺指挥西归。' },
      { name: '好望角（返程）', lat: -34.36, lon: 18.47, date: '1522-05-01', label: '1522 年上半年', kind: 'way', title: '绕好望角西归', desc: '为避开葡萄牙势力而远走南印度洋，补给极度困难。' },
      { name: '佛得角 · 圣地亚哥', lat: 14.92, lon: -23.51, date: '1522-07-09', label: '1522 年 7 月', kind: 'way', title: '12 人被葡方扣押', desc: '上岸求粮时被葡萄牙当局扣留 12 人，Victoria 号仓促西逃。此处船员发现日期差了一天。' },
      { name: '桑卢卡尔（返回）', lat: 36.78, lon: -6.35, date: '1522-09-06', label: '1522 年 9 月 6 日', kind: 'end', title: '18 人生还 · 首次环球完成', desc: '历时约 3 年，人类首次环球航行由埃尔卡诺率 Victoria 号完成；数日后上溯塞维利亚。部分史料记 17 名欧洲生还者 / 9 月 9 日到塞维利亚。' }
    ]
  }
];

/* ------------------------------------------------------------------ *
 * 几何绕行点（Waypoint detours）
 * ------------------------------------------------------------------ *
 * 相邻史实航点若直接以球面大圆弧相连，会切过非洲、阿拉伯半岛、印度、
 * 苏门答腊等陆地。下列坐标只把示意航路拉回海上，不进入时间轴、标签与
 * 档案，也不是史料记载的停靠地。键为史实航点索引，值插在该点与下一点
 * 之间，格式 [[纬度, 经度], ...]。
 */
(function () {
  var D = {
    zhenghe: {
      3: [[6.0, 105.5]],
      4: [[1.2, 103.6], [-1.0, 104.7]],
      5: [[-2.5, 100.5], [1.0, 93.0]],
      6: [[7.0, 78.8]],
      7: [[9.7, 76.0]],
      8: [[14.0, 68.0], [22.0, 60.0]],
      9: [[24.0, 58.5], [15.0, 53.0]],
      10: [[11.5, 51.5], [5.0, 49.0]],
      11: [[0.0, 43.0], [-1.5, 41.5]]
    },
    dias: {
      0: [[20.0, -20.0], [10.0, -19.0], [2.0, -12.0], [-3.0, 8.5]],
      1: [[-12.0, 10.5], [-18.0, 10.5]],
      6: [[-34.0, 26.5]],
      7: [[-35.3, 23.0], [-35.0, 19.0]],
      8: [[-20.0, 3.0], [-4.0, -1.0]],
      9: [[14.0, -17.0], [28.0, -13.0]]
    },
    columbus: {
      0: [[31.0, -12.0]],
      5: [[27.0, -55.0]],
      7: [[36.2, -8.2], [36.3, -7.1]]
    },
    dagama: {
      0: [[25.0, -18.0]],
      3: [[-33.6, 16.9]],
      4: [[-34.8, 20.0]],
      5: [[-32.5, 28.5]],
      6: [[-24.0, 34.0]],
      7: [[-16.5, 39.0]],
      8: [[-9.0, 41.5]],
      12: [[-10.0, 45.0], [-25.0, 35.0], [-35.0, 22.0]],
      13: [[-15.0, -2.0], [5.0, -22.0]]
    },
    magellan: {
      0: [[30.0, -11.0]],
      1: [[10.0, -28.0]],
      2: [[-12.5, -36.0], [-18.0, -39.5]],
      9: [[11.0, 132.0]],
      12: [[5.0, 125.5], [1.5, 127.5]],
      13: [[-8.0, 112.0], [-22.0, 80.0], [-34.0, 42.0]],
      14: [[-20.0, -2.0], [-5.0, -16.0]],
      15: [[24.0, -18.0]]
    }
  };
  window.VOYAGES.forEach(function (v) { v.detours = D[v.id] || {}; });
})();
