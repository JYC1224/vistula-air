// Coordinates: OurAirports / datasets/airport-codes, retrieved 2026-10-27.
// Demand, fares, fees and contract targets below are fictional game balancing values.
export const AIRPORTS = {
  WAW: { code: 'WAW', city: '華沙', english: 'Warsaw', name: 'Warsaw Chopin', lat: 52.165699, lon: 20.9671 },
  VIE: { code: 'VIE', city: '維也納', english: 'Vienna', name: 'Vienna International', lat: 48.110298, lon: 16.5697, demand: 248, fare: 114, fee: 1600, opening: 45000 },
  CPH: { code: 'CPH', city: '哥本哈根', english: 'Copenhagen', name: 'Copenhagen Kastrup', lat: 55.6179008, lon: 12.6560001, demand: 184, fare: 156, fee: 1800, opening: 65000 },
  FCO: { code: 'FCO', city: '羅馬', english: 'Rome', name: 'Leonardo da Vinci', lat: 41.804532, lon: 12.251998, demand: 358, fare: 192, fee: 2300, opening: 95000 },
  LHR: { code: 'LHR', city: '倫敦', english: 'London', name: 'Heathrow', lat: 51.470748, lon: -0.459909, demand: 390, fare: 228, fee: 4300, opening: 140000 },
  KEF: { code: 'KEF', city: '雷克雅維克', english: 'Reykjavík', name: 'Keflavík International', lat: 63.985001, lon: -22.6056, demand: 254, fare: 272, fee: 2000, opening: 125000 },
  DXB: { code: 'DXB', city: '杜拜', english: 'Dubai', name: 'Dubai International', lat: 25.24979, lon: 55.370992, demand: 416, fare: 385, fee: 3600, opening: 240000 },
  JFK: { code: 'JFK', city: '紐約', english: 'New York', name: 'John F. Kennedy', lat: 40.639447, lon: -73.779317, demand: 532, fare: 690, fee: 6200, opening: 480000 },
};

export const MISSIONS = [
  { id: 'cph', destination: 'CPH', title: '北歐的第一步', chapter: '01', unlock: 0, pax: 450, days: 3, load: 0.7, reward: 220000,
    brief: '哥本哈根的商務需求穩定，但市場還不大。董事會希望先建立一條坐得滿、能獲利的航線。',
    advice: '先看需求，再看座位。區域型客機可能比大型窄體機更容易填滿；增加班次也會增加飛行成本。',
    lesson: '座位更多不代表利潤更高；把運能與需求配對，才是航線經營的起點。' },
  { id: 'fco', destination: 'FCO', title: '所有航線，通往羅馬', chapter: '02', unlock: 0, pax: 950, days: 3, load: 0.68, reward: 340000,
    brief: '旅遊通路帶來羅馬的新客源。這次需要更多運能，但別忘了檢查班次和單趟成本。',
    advice: '同樣的運能，可以來自一架大飛機，也可以來自小飛機的更多班次。比較完整的日成本。',
    lesson: '機型與班次共同決定運能；比較方案要使用相同期間。' },
  { id: 'lhr', destination: 'LHR', title: '倫敦商務走廊', chapter: '03', unlock: 1, pax: 1000, days: 3, load: 0.66, reward: 420000,
    brief: '倫敦客源充足，也有較高的機場成本。讓服務定位與機隊配置一起工作。',
    advice: '商務服務可提高單客收入，但需求和服務成本也會改變。預估畫面可以比較三種定位。',
    lesson: '高票價與高需求不是同一件事；服務與成本必須一起看。' },
  { id: 'kef', destination: 'KEF', title: '向北大西洋延伸', chapter: '04', unlock: 2, pax: 720, days: 3, load: 0.65, reward: 520000,
    brief: '冰島的需求較分散，飛行時間卻更長。這條航線會考驗你對機型定位的理解。',
    advice: '留意航程餘裕與較長的飛行時間。較新的引擎世代可能改變同級機型的成本比較。',
    lesson: '相近座位數的飛機，可能因世代、引擎與營運條件而適合不同任務。' },
  { id: 'dxb', destination: 'DXB', title: '歐洲之外', chapter: '05', unlock: 3, pax: 1150, days: 3, load: 0.68, reward: 750000,
    brief: '杜拜是公司走向國際的重要節點。先核對航程，再考慮如何滿足這個市場的需求。',
    advice: '短程航線的成功機型，未必適合這裡。別把公開最大航程當成任何條件都能飛到的保證。',
    lesson: '航程與載客能力是不同限制；部署前要同時檢查。' },
  { id: 'jfk', destination: 'JFK', title: '跨越大西洋', chapter: '06', unlock: 4, pax: 1800, days: 4, load: 0.68, reward: 1500000,
    brief: '董事會批准跨洲計畫。選擇長程窄體或廣體，讓華沙與紐約之間的連結成為可持續的生意。',
    advice: 'A321XLR 與 787-9 都能提供長程選項，但座位、投入資金與單趟成本差異很大。',
    lesson: '長程市場也有不同規模；適合的飛機取決於需求、成本與公司資源。' },
];

export const SERVICES = {
  value: { id: 'value', name: '精省經濟', fare: 0.84, demand: 1.1, perPax: 7, description: '較低票價，較高需求' },
  standard: { id: 'standard', name: '均衡服務', fare: 1, demand: 1, perPax: 13, description: '票價與服務的平衡' },
  business: { id: 'business', name: '商務優先', fare: 1.24, demand: 0.79, perPax: 27, description: '提高票價，需求較集中' },
};
