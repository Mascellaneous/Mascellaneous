# 靜態分析筆記

此目錄內的 `parse_swf.py` 僅讀取 SWF 二進位格式：它會解壓縮 CWS、解析標籤標頭、列出時間軸標籤與匯出可直接辨識的 JPEG/MP3 資料。它**不會**載入 Flash Player、執行 ActionScript 或執行 SWF 內容。

分析輸出將寫入本目錄下的 JSON 報告與 `../extracted/`。
