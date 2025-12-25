// popup.js

const setStatus = (text, type = "idle") => {
    const statusEl = document.getElementById("status");
    statusEl.textContent = text;

    // Reset class
    statusEl.className = "status-bar";
    if (type === "loading") statusEl.classList.add("status-loading");
    else if (type === "success") statusEl.classList.add("status-success");
    else if (type === "error") statusEl.classList.add("status-error");
};

// --- NÚT 1: QUÉT THỦ CÔNG (Gửi lệnh cho Content Script) ---
document.getElementById("btnScrape").addEventListener("click", async () => {
    setStatus("Đang kết nối...", "loading");

    // Tìm tab đang mở
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
        setStatus("Lỗi: Không tìm thấy Tab", "error");
        return;
    }

    // Gửi tin nhắn cho content.js (đã được tiêm sẵn)
    chrome.tabs.sendMessage(tab.id, { action: "FORCE_SCRAPE_NOW" }, (response) => {
        // Kiểm tra lỗi (ví dụ: trang web chưa load xong hoặc extension chưa chạy)
        if (chrome.runtime.lastError) {
            setStatus("Lỗi: Hãy F5 lại trang web rồi thử lại!", "error");
        } else {
            setStatus("Đang quét... Hãy cuộn chuột để lấy thêm data!", "loading");
        }
    });
});

// --- NÚT 2: CHẠY TUẦN TRA (Gửi lệnh cho Background) ---
document.getElementById("btnPatrol").addEventListener("click", () => {
    setStatus("Đang gọi Bot...", "loading");

    chrome.runtime.sendMessage({ action: "FORCE_PATROL" }, (response) => {
        if (chrome.runtime.lastError) {
            setStatus("Lỗi kết nối Background", "error");
        } else {
            if (response && response.status === "Busy") {
                setStatus("⚠️ Bot đang bận chạy rồi!", "error");
            } else {
                setStatus("👮 Đã kích hoạt tuần tra!", "success");
                setTimeout(() => setStatus("Bot đang chạy ngầm..."), 2000);
            }
        }
    });
});

// --- LẮNG NGHE PHẢN HỒI (Từ Content Script gửi về) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SCRAPE_DONE") {
        setStatus(`✅ Đã gửi ${request.count} dòng về Server!`, "success");
    } else if (request.action === "SCRAPE_ERROR") {
        setStatus(`❌ ${request.message}`, "error");
    }
});