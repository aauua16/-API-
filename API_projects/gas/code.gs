// --- 設定項目 ---
const API_KEY = 'your Calil API'; 
const SYSTEM_IDS = 'Tokyo_Chofu,Univ_Tokyo,Tokyo_Fuchu,Tokyo_Inagi'; // 4つのIDを指定
// ----------------

function checkLibraryStock() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    Browser.msgBox("A列にISBNを入力してください。");
    return;
  }

  // A列からM列（13列目）までの全データを一括で取得
  const dataRange = sheet.getRange(2, 1, lastRow - 1, 13);
  const data = dataRange.getValues();

  let checkCount = 0; // 今回APIで確認した件数をカウント

  for (let i = 0; i < data.length; i++) {
    let row = data[i];
    let isbn = row[0].toString().replace(/-/g, "").trim();
    if (!isbn) continue;

    // 現在の各図書館のステータスを取得
    let currentChofu = row[1];  // B列
    let currentUtokyo = row[4]; // E列
    let currentFuchu = row[7];  // H列
    let currentInagi = row[10]; // K列

    // ★軽量化: すべての図書館で結果が確定している場合はスキップ
    if (currentChofu !== "" && currentChofu !== "確認中..." &&
        currentUtokyo !== "" && currentUtokyo !== "確認中..." &&
        currentFuchu !== "" && currentFuchu !== "確認中..." &&
        currentInagi !== "" && currentInagi !== "確認中...") {
      continue;
    }

    checkCount++; // 通信を行う件数をカウント

    let url = `https://api.calil.jp/check?appkey=${API_KEY}&isbn=${isbn}&systemid=${SYSTEM_IDS}&format=json&callback=no`;
    
    try {
      let response = UrlFetchApp.fetch(url);
      let json = JSON.parse(response.getContentText());
      
      let chofuStatus = "なし", chofuDetail = "", chofuUrl = "";
      let utokyoStatus = "なし", utokyoDetail = "", utokyoUrl = "";
      let fuchuStatus = "なし", fuchuDetail = "", fuchuUrl = "";
      let inagiStatus = "なし", inagiDetail = "", inagiUrl = "";

      if (json.books && json.books[isbn]) {
        let book = json.books[isbn];

        // --- 1. 調布市立図書館 ---
        if (book['Tokyo_Chofu']) {
          let res = book['Tokyo_Chofu'];
          if (res.status === 'Running') {
            chofuStatus = "確認中...";
          } else if (res.libkey && Object.keys(res.libkey).length > 0) {
            chofuStatus = "蔵書あり";
            chofuDetail = Object.entries(res.libkey).map(([loc, info]) => `【${loc}】${info}`).join("\n");
            chofuUrl = res.reserveurl ? res.reserveurl : "";
          }
        }

        // --- 3. 府中市立図書館 ---
        if (book['Tokyo_Fuchu']) {
          let res = book['Tokyo_Fuchu'];
          if (res.status === 'Running') {
            fuchuStatus = "確認中...";
          } else if (res.libkey && Object.keys(res.libkey).length > 0) {
            fuchuStatus = "蔵書あり";
            fuchuDetail = Object.entries(res.libkey).map(([loc, info]) => `【${loc}】${info}`).join("\n");
            fuchuUrl = res.reserveurl ? res.reserveurl : "";
          }
        }

        // --- 4. 稲城市立図書館 ---
        if (book['Tokyo_Inagi']) {
          let res = book['Tokyo_Inagi'];
          if (res.status === 'Running') {
            inagiStatus = "確認中...";
          } else if (res.libkey && Object.keys(res.libkey).length > 0) {
            inagiStatus = "蔵書あり";
            inagiDetail = Object.entries(res.libkey).map(([loc, info]) => `【${loc}】${info}`).join("\n");
            inagiUrl = res.reserveurl ? res.reserveurl : "";
          }
        }
      }

      // --- シートへの書き込み ---
      sheet.getRange(i + 2, 2).setValue(chofuStatus); // B列:調布
      sheet.getRange(i + 2, 3).setValue(chofuDetail); // C列
      sheet.getRange(i + 2, 4).setValue(chofuUrl);    // D列

      sheet.getRange(i + 2, 8).setValue(fuchuStatus); // H列:府中
      sheet.getRange(i + 2, 9).setValue(fuchuDetail); // I列
      sheet.getRange(i + 2, 10).setValue(fuchuUrl);   // J列

      sheet.getRange(i + 2, 11).setValue(inagiStatus);// K列:稲城
      sheet.getRange(i + 2, 12).setValue(inagiDetail);// L列
      sheet.getRange(i + 2, 13).setValue(inagiUrl);   // M列

    } catch (e) {
      console.log("Error: " + e);
    }
    
    // APIへの過剰な負荷を防ぐため、通信を行った場合のみ少し待機
    Utilities.sleep(500); 
  }
  
  if (checkCount === 0) {
    Browser.msgBox("すべての書籍の検索が完了しており、新しく検索する本はありませんでした。");
  } else {
    Browser.msgBox(`完了！\n今回は ${checkCount} 件の書籍を検索しました。\n「確認中」が残っている場合は数十秒後にもう一度実行してください。`);
  }
}
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📖 研究用メニュー') // メニュー名
      .addItem('ISBN取得を実行', 'checkLibraryStock') // ボタン名と実行する関数名
      .addToUi();
}
