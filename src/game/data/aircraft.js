// Reference dimensions/ranges vary with certified configuration. Seats and all
// financial/operating parameters are explicit game configurations, not live prices.
export const AIRCRAFT = [
  { id: 'e190', name: 'Embraer E190', short: 'E190', manufacturer: 'Embraer', family: 'E-Jet', generation: '第一代 E-Jet', category: '區域型客機', seats: 100, range: 4537, length: 36.24, span: 28.72, speed: 820, engine: 'GE CF34-10E', engineOptions: 'CF34-10E 系列', baseCost: 1580, kmCost: 2.5, purchase: 6800000, deposit: 280000, lease: 5100, unlock: 0,
    role: '用剛好的運能，連結較小的市場。', description: '100 席示例配置適合需求較薄的區域航線。與 E2 比較時，要注意翼型、引擎與機身尺寸，不能只看 Embraer 的名稱。',
    features: ['單走道、2–2 座位配置，通常沒有中間座位。', '第一代 E190 使用 CF34-10E，引擎與 E2 的 PW1900G 不同。', 'E190 與 E195 不同長度；照片與型號紀錄需要一起核對。'], source: 'https://www.embraer.com/e-jets/e190/en/' },
  { id: 'e195e2', name: 'Embraer E195-E2', short: 'E195-E2', manufacturer: 'Embraer', family: 'E-Jet E2', generation: '第二代 E-Jet', category: '大型區域型客機', seats: 132, range: 5556, length: 41.5, span: 35.12, speed: 850, engine: 'PW1900G', engineOptions: 'Pratt & Whitney PW1900G 系列', baseCost: 1760, kmCost: 2.55, purchase: 20500000, deposit: 590000, lease: 7800, unlock: 1,
    role: '區域市場與主線市場之間的橋梁。', description: '更長的機身、新機翼與齒輪傳動渦扇，是 E195-E2 的重要線索。此處採 132 席遊戲配置與更新後的公開航程參考。',
    features: ['E195-E2 的機身比 E190 明顯更長。', 'PW1900G 齒輪傳動渦扇，不能與第一代 CF34 混為一談。', '仍採 2–2 客艙布局，適合主線窄體機以下的市場規模。'], source: 'https://embraer.com/media-center/en?detail=13439&mediatype=news&page=1' },
  { id: 'a320', name: 'Airbus A320-200', short: 'A320-200', manufacturer: 'Airbus', family: 'A320', generation: 'ceo 世代', category: '窄體客機', seats: 180, range: 6150, length: 37.57, span: 34.1, speed: 840, engine: 'CFM56-5B', engineOptions: 'CFM56-5B 或 IAE V2500（依子型）', baseCost: 2140, kmCost: 3.65, purchase: 10500000, deposit: 360000, lease: 6500, unlock: 0,
    role: '成熟、彈性高的短中程主力。', description: 'A320 家族的成熟主力。ceo 與 neo 的機身長度相近，但引擎世代與性能配置不同。本標的採 CFM56-5B。',
    features: ['A320 比加長型 A321 短，不能只憑塗裝區分。', 'ceo 可採 CFM56-5B 或 V2500，需查看確切子型。', '翼尖裝置可因配置不同而改變；最終仍需核對型號資料。'], source: 'https://www.airbus.com/en/products-services/commercial-aircraft/passenger-aircraft/a320-family' },
  { id: 'a320neo', name: 'Airbus A320neo', short: 'A320neo', manufacturer: 'Airbus', family: 'A320', generation: 'neo 世代', category: '窄體客機', seats: 180, range: 6300, length: 37.57, span: 35.8, speed: 840, engine: 'CFM LEAP-1A', engineOptions: 'CFM LEAP-1A 或 PW1100G-JM', baseCost: 2050, kmCost: 2.95, purchase: 29200000, deposit: 740000, lease: 9800, unlock: 1,
    role: '相近機身，新一代動力選項。', description: 'neo 代表 New Engine Option。它不是加長版 A320；最重要的比較是引擎與性能配置。本標的與照片採 LEAP-1A。',
    features: ['機身長度與 A320-200 相近，neo 不代表機身變長。', '可選 LEAP-1A 或 PW1100G-JM；兩者都是 neo 的引擎選項。', '綜合引擎、外觀與型號紀錄辨識，避免只靠翼尖判定。'], source: 'https://www.airbus.com/en/newsroom/press-releases/2016-05-a320neo-with-cfm-leap-1a-engines-receives-joint-easa-and-faa' },
  { id: 'a321xlr', name: 'Airbus A321XLR', short: 'A321XLR', manufacturer: 'Airbus', family: 'A320', generation: 'neo · XLR', category: '長程窄體客機', seats: 200, range: 8700, length: 44.51, span: 35.8, speed: 840, engine: 'CFM LEAP-1A', engineOptions: 'LEAP-1A 或 PW1100G-JM（依認證配置）', baseCost: 2600, kmCost: 3.25, purchase: 42000000, deposit: 1350000, lease: 14700, unlock: 3,
    role: '讓較薄的長程市場，也能直飛。', description: 'A321 的長機身加上 XLR 航程能力，提供長程窄體選項。與一般 A321neo 的差別不能只靠外觀，必須核對配置與文件。',
    features: ['44.51 公尺機身，比 A320 家族的 A320 成員更長。', 'XLR 有後中央油箱等設計變更，並非所有 A321neo 都有同等航程。', '在較薄的長程市場，較少座位可以降低填滿飛機的壓力。'], source: 'https://www.airbus.com/en/products-services/commercial-aircraft/passenger-aircraft/a320-family' },
  { id: 'b738', name: 'Boeing 737-800', short: '737-800', manufacturer: 'Boeing', family: '737', generation: 'Next Generation', category: '窄體客機', seats: 186, range: 5765, length: 39.47, span: 35.8, speed: 842, engine: 'CFM56-7B', engineOptions: 'CFM56-7B 系列', baseCost: 2180, kmCost: 3.58, purchase: 11300000, deposit: 380000, lease: 6700, unlock: 0,
    role: '經典 NG，適合高需求的短中程。', description: '737-800 屬於 NG 世代，不是 737 MAX 8。機型名稱相近，但引擎世代與外觀細節不同。',
    features: ['737-800 的「-800」不等於 MAX 8。', 'NG 使用 CFM56-7B；MAX 使用 LEAP-1B。', '翼尖裝置有不同配置，需合併引擎與機型紀錄判斷。'], source: 'https://www.boeing.com/commercial/airports/plan-manuals' },
  { id: 'b38', name: 'Boeing 737 MAX 8', short: '737 MAX 8', manufacturer: 'Boeing', family: '737', generation: 'MAX 世代', category: '窄體客機', seats: 186, range: 6480, length: 39.5, span: 35.9, speed: 842, engine: 'CFM LEAP-1B', engineOptions: 'CFM LEAP-1B 系列', baseCost: 2080, kmCost: 2.92, purchase: 28500000, deposit: 720000, lease: 9600, unlock: 1,
    role: '737 的新世代動力與航程。', description: 'MAX 8 與 737-800 的長度、座位規模接近。LEAP-1B、引擎短艙鋸齒後緣與翼尖設計是值得比較的線索。',
    features: ['LEAP-1B 與 Airbus neo 使用的 LEAP-1A 並非相同型號。', '引擎短艙後緣的鋸齒設計，是可觀察的線索之一。', '相近座位數不代表相同世代、成本或航程。'], source: 'https://www.boeing.com/Commercial/737MAX' },
  { id: 'b789', name: 'Boeing 787-9', short: '787-9', manufacturer: 'Boeing', family: '787', generation: 'Dreamliner', category: '長程廣體客機', seats: 290, range: 15370, length: 62.8, span: 60.1, speed: 900, engine: 'GEnx-1B / Trent 1000', engineOptions: 'GE GEnx-1B 或 Rolls-Royce Trent 1000', baseCost: 5400, kmCost: 5.8, purchase: 69000000, deposit: 2350000, lease: 24600, unlock: 4,
    role: '為更大的跨洲市場，提供廣體運能。', description: '雙走道廣體長程機，與 737 的機身尺度與市場定位不同。參考航程採 Boeing 現行公開資料上限，實際能力取決於配置。',
    features: ['62.8 公尺的機身與約 60 公尺翼展，尺度遠大於區域與一般窄體機。', '787-8、-9、-10 是不同長度與性能的家族成員。', '引擎有 GEnx-1B 與 Trent 1000 選項；照片僅作機體外觀參考。'], source: 'https://www.boeing.com/commercial/787' },
];

export const AIRCRAFT_BY_ID = Object.fromEntries(AIRCRAFT.map((aircraft) => [aircraft.id, aircraft]));
