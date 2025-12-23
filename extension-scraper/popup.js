document.getElementById("btnScrape").addEventListener("click", async () => {
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "Đang khởi động...";

    // 1. Lấy tab hiện tại
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. Tiêm script (content.js) vào tab đó để chạy lệnh cào
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    }, () => {
        statusDiv.textContent = "Đã gửi lệnh quét. Kiểm tra console!";
    });
});

// Lắng nghe kết quả trả về từ content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE_DONE") {
        document.getElementById("status").textContent = `✅ Đã gửi ${request.count} dòng về Server!`;
        document.getElementById("status").style.color = "green";
    } else if (request.action === "SCRAPE_ERROR") {
        document.getElementById("status").textContent = `❌ Lỗi: ${request.message}`;
        document.getElementById("status").style.color = "red";
    }
});