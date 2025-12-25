// background.js - NO CONFLICT EDITION

const API_BASE_URL = "http://127.0.0.1:8000";
const MONITOR_ENDPOINT = `${API_BASE_URL}/api/v1/monitor`;
const IMPORT_ENDPOINT = `${API_BASE_URL}/api/v1/feedbacks/batch-import`;
const ALARM_NAME = "PATROL_ALARM";

let isPatrolling = false;

// --- 1. KHỞI TẠO & TIMER ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) startPatrol();
});

// --- 2. MESSAGE HUB (TRUNG TÂM XỬ LÝ) ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

    // A. Lệnh tuần tra thủ công (Từ Popup)
    if (req.action === "FORCE_PATROL") {
        if (isPatrolling) {
            sendResponse({ status: "Busy" });
            return;
        }
        startPatrol();
        sendResponse({ status: "Started" });
    }

    // B. Lệnh gửi dữ liệu (Proxy từ Content -> Backend)
    // Giúp vượt qua lỗi CSP/Mixed Content của Facebook/Shopee
    if (req.action === "SEND_DATA_TO_BACKEND") {
        console.log(`📦 [Proxy] Đang gửi ${req.payload.items.length} dòng về Server...`);

        fetch(IMPORT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.payload)
        })
            .then(res => {
                if (res.ok) {
                    console.log("✅ Gửi thành công!");
                    sendResponse({ success: true });
                } else {
                    console.error("❌ Server Error:", res.status);
                    sendResponse({ success: false, error: "Server Error" });
                }
            })
            .catch(err => {
                console.error("❌ Network Error:", err);
                sendResponse({ success: false, error: "Network Error" });
            });

        return true; // Giữ channel để trả lời Async
    }
});

// --- 3. LOGIC TUẦN TRA (TUẦN TỰ) ---
async function startPatrol() {
    isPatrolling = true;
    try {
        // Thêm timestamp để tránh cache
        const res = await fetch(`${MONITOR_ENDPOINT}?t=${Date.now()}`);
        const tasks = await res.json();

        if (!tasks || tasks.length === 0) {
            console.log("💤 Không có nhiệm vụ nào.");
            isPatrolling = false;
            return;
        }

        console.log(`📋 Bắt đầu tuần tra ${tasks.length} link.`);

        // Duyệt từng link (Tuần tự)
        for (let i = 0; i < tasks.length; i++) {
            await processTask(tasks[i]);
            // Nghỉ 5 giây giữa các tab để không làm đơ máy
            if (i < tasks.length - 1) await new Promise(r => setTimeout(r, 5000));
        }
        console.log("🎉 Kết thúc đợt tuần tra.");
    } catch (e) {
        console.error("Lỗi tuần tra:", e);
    } finally {
        isPatrolling = false;
    }
}

// Xử lý 1 Tab duy nhất
function processTask(task) {
    return new Promise((resolve) => {
        // Mở tab ở background (active: false)
        chrome.tabs.create({ url: task.url, active: false }, (tab) => {
            if (!tab) { resolve(); return; }

            // Thời gian chờ Load trang (Facebook nặng hơn nên chờ lâu hơn)
            const loadTime = task.platform === "FACEBOOK" ? 15000 : 8000;

            setTimeout(() => {
                // Kiểm tra xem tab còn sống không trước khi gửi lệnh
                chrome.tabs.get(tab.id, (currentTab) => {
                    if (chrome.runtime.lastError || !currentTab) {
                        resolve(); return;
                    }

                    // Gửi lệnh: "Bắt đầu cuộn đi!"
                    chrome.tabs.sendMessage(tab.id, {
                        action: "AUTO_SCROLL_START",
                        platform: task.platform
                    }).catch(() => console.log("⚠️ Tab không phản hồi (có thể chưa load xong content.js)"));

                    // Sau 25 giây (cho nó cuộn), đóng tab
                    setTimeout(() => {
                        chrome.tabs.remove(tab.id, () => {
                            console.log(`⏹️ Đã đóng tab ${task.id}`);
                            resolve();
                        });
                    }, 25000);
                });
            }, loadTime);
        });
    });
}