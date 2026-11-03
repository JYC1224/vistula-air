# 首版素材選用紀錄

素材選定與下載先於 MVP 製作。原始研究紀錄在 `assets-source/custom/commons-candidates.json`，完整可發佈署名在 `public/assets/data/credits.json` 與 `public/assets/licenses/ASSET-CREDITS.md`。

| 用途 | 選用內容 | 來源與授權 | 執行時位置 |
| --- | --- | --- | --- |
| 八款機型辨識 | Wikimedia Commons 實機照片，逐筆核對機型與作者 | 每張照片依原作者 CC BY-SA 授權，見署名表 | `public/assets/images/aircraft/` |
| 地理底圖 | Natural Earth 1:110m 國界 | Public domain | `public/assets/data/world.geojson` |
| 機場位置 | OurAirports 衍生的 Airport Codes 資料 | [資料庫來源](https://github.com/datasets/airport-codes) | `src/game/data/airports.js` |
| 操作音效 | Kenney Interface Sounds，選用 click、confirmation、error | [官方頁面](https://kenney.nl/assets/interface-sounds)，CC0 | `public/assets/audio/sfx/` |
| 英數字型 | Inter variable font | SIL OFL 1.1 | `public/assets/fonts/` |
| 標誌、人物與結構圖 | 專案原創 SVG | 專案內原創 | `public/assets/images/ui/` |

Kenney 原始音效包保留在 `assets-source/kenney/interface-sounds.zip`。使用攝影照片以維持真實機型特徵；不以泛用飛機素材冒充精確子型。照片中真實航空公司的品牌與塗裝只用於辨識參考。

照片檔案未做像素編輯，介面可能縮放或裁切顯示。每張照片均提供作者、原始檔案頁面與對應授權連結。字型與 Kenney 授權全文隨建置內容發佈。
