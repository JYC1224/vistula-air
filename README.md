# Vistula Air｜航空經營誌

以現代華沙蕭邦機場 WAW 為基地的航空公司經營與自主學習遊戲。網站根路徑直接進入營運中心，玩家研究機型、規劃航線、購租機隊、安排保養，主動推進營運日並完成董事會委託。

[直接遊玩 Vistula Air](https://jyc1224.github.io/vistula-air/)

入口流程：`index.html → src/main.js → GameUI + Phaser（BootScene → PreloadScene → GameScene）`。

## 首版可玩內容

- 三架起始飛機、一條既有航線、€8,400,000 營運資金。
- 六份航線委託：CPH、FCO、LHR、KEF、DXB、JFK。
- 八款代表機型：E190、E195-E2、A320-200、A320neo、A321XLR、737-800、737 MAX 8、787-9。
- 可點選的 Phaser 地圖、派機與服務定位、購買／租賃、維修停場、日結回饋。
- 機型資料冊、兩機比較、互動結構圖、員工訊息、音效開關與本機自動存檔。

機型與地理參考真實資料。需求、票價、採購費用與維修指標為遊戲平衡模型。完整近期常見機型目錄、多航段輪調與更深入的飛行系統屬於後續擴充範圍。

企劃與實作順序見 [遊戲企劃書](docs/GAME_DESIGN.md)，素材選用與授權見 [素材紀錄](docs/ASSETS.md)。

## 開發指令

```sh
npm install
npm run dev
```

- `npm run build`：產生可部署的遊戲到 `dist/`。
- `npm run preview`：在本機預覽已建置的遊戲。
- `npm test`：檢查航程、派機、維修、收支、租賃與完整委託推進路徑。

開啟開發伺服器顯示的網址後，可先看左下角「工作手冊」。第一份委託在右側：比較需求與機型，確認開航，再按「下一營運日」查看結果。達成旅客、天數、載客率與獲利條件即可完成委託。

快捷鍵：`1`–`5` 切換工作區、`Space` 推進營運日、`Esc` 關閉視窗。設定視窗可重新開始公司。進度儲存在瀏覽器的目前網站來源，重新整理可繼續。

## GitHub Pages 部署

推送到 `main` 後，GitHub Actions 會安裝套件、執行測試、建置遊戲並自動發布至 GitHub Pages。部署建置會依照 repository 名稱設定網址路徑；本機開發仍使用根路徑。不同瀏覽器、裝置或網址各自保存遊戲進度。

## 程式架構

| 檔案 | 職責 |
| --- | --- |
| `src/game/systems/simulation.js` | 可獨立驗證的營運、派機、購租、維修與委託規則 |
| `src/game/systems/GameStore.js` | 狀態更新、介面選擇與本機存檔 |
| `src/game/ui/GameUI.js` | 營運席位、工作面板與互動視窗 |
| `src/game/objects/RouteMap.js` | Phaser 地圖、機場選取與航線動畫 |
| `src/game/data/aircraft.js` | 機型參考配置、辨識線索及遊戲價格 |
| `src/game/data/airports.js` | 真實機場位置、模擬市場與委託 |
| `tests/simulation.test.js` | 模型一致性及六委託完整推進檢查 |

## 目錄用途

```text
index.html                  遊戲頁面入口
src/
  main.js                   啟動 Phaser
  styles/                   遊戲頁面樣式
  game/
    config.js               畫面、縮放與場景設定
    scenes/                 啟動、素材預載與主要遊戲場景
    constants/              場景名稱等共用常數
    objects/                角色、道具等遊戲物件
    systems/                回合、計分、存檔等遊戲系統
    ui/                     遊戲內按鈕、面板與 HUD
    data/                   程式使用的設定與平衡數值
    utils/                  共用輔助函式
public/
  assets/
    images/
      backgrounds/          背景圖片
      sprites/              角色與物件圖片、精靈圖集
      aircraft/             可核對來源的客機照片
      ui/                   介面圖片與圖示
    atlases/                Texture Atlas 圖片與描述檔
    tilemaps/               地圖檔與 Tileset
    audio/
      music/                背景音樂
      sfx/                  音效
    fonts/                  字型與 Bitmap Font
    data/                   經由素材載入器讀取的關卡或題目 JSON
    licenses/               隨遊戲發佈的素材授權與來源資料
assets-source/
  kenney/                   Kenney 原始素材包
  custom/                   自製素材與可編輯來源檔
.agents/skills/             本專案的開發 Skills
```

## 放入與載入素材

供遊戲實際使用的檔案放在 `public/assets/`。Vite 會將 `public/` 的內容保留路徑複製到建置結果；本機開發時，`public/assets/images/sprites/player.png` 的遊戲網址是 `/assets/images/sprites/player.png`，部署到 GitHub Pages 時則會加上 repository 路徑。

在 `PreloadScene.preload()` 中載入，例如：

```js
this.load.image(
  'player',
  `${import.meta.env.BASE_URL}assets/images/sprites/player.png`,
);
```

在場景的 `create()` 中以素材 key 使用：

```js
this.add.image(640, 360, 'player');
```

原始下載包與可編輯檔放在 `assets-source/`，將選用的執行時素材放進 `public/assets/`。Kenney 素材可保留包名作為子目錄，方便追溯來源；對應授權資料放進 `public/assets/licenses/`。

主要場景是 `GameScene.js`；營運規則放在 `systems/`，介面放在 `ui/`。Phaser 地圖素材集中在 `PreloadScene.js` 載入，工作面板的照片依需要載入。
