const SHEET_NAME = "谷歌表單的目標分頁";
const SHEET_FILE = "谷歌表單的id";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_FILE);
    
    // --- 1. 處理 MAIN 分頁 ---
    const mainSheet = ss.getSheetByName(SHEET_NAME);
    const mainData = mainSheet.getDataRange().getValues();
    const mainHeaders = mainData[0];
    const rows = mainData.slice(1).map(row => {
      let obj = {};
      mainHeaders.forEach((h, i) => { if (h) obj[h] = row[i]; });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}