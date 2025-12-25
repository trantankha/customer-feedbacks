const API_BASE_URL = "http://127.0.0.1:8000";
const MONITOR_ENDPOINT = `${API_BASE_URL}/api/v1/monitor`;
const IMPORT_ENDPOINT = `${API_BASE_URL}/api/v1/feedbacks/batch-import`;
const ALARM_NAME = "PATROL_ALARM";

let isPatrolling = false;

// --- 1. KHỞI TẠO & TUẦN TRA (Giữ nguyên logic cũ) ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 30 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) startPatrol();
});

// --- 2. TRUNG TÂM XỬ LÝ TIN NHẮN (MESSAGE HUB) ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

    // A. Lệnh tuần tra thủ công
    if (req.action === "FORCE_PATROL") {
        if (isPatrolling) {
            sendResponse({ status: "Busy" });
            return;
        }
        startPatrol();
        sendResponse({ status: "Started" });
    }

    // B. Lệnh gửi dữ liệu về Backend (MỚI THÊM) 👇
    // Background sẽ thay mặt Content Script gửi cái này để tránh lỗi CSP/Mixed Content
    if (req.action === "SEND_DATA_TO_BACKEND") {
        console.log("📦 Background đang gửi dữ liệu hộ...");

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
                    console.error("❌ Lỗi Server:", res.status);
                    sendResponse({ success: false, error: "Server Error" });
                }
            })
            .catch(err => {
                console.error("❌ Lỗi kết nối:", err);
                sendResponse({ success: false, error: "Network Error" });
            });

        return true; // Giữ kết nối để gửi response bất đồng bộ (Async)
    }
});

// --- 3. LOGIC TUẦN TRA (Giữ nguyên) ---
async function startPatrol() {
    isPatrolling = true;
    try {
        const res = await fetch(`${MONITOR_ENDPOINT}?t=${Date.now()}`);
        const tasks = await res.json();

        if (!tasks || tasks.length === 0) {
            isPatrolling = false;
            return;
        }

        for (let i = 0; i < tasks.length; i++) {
            await processTask(tasks[i], i + 1, tasks.length);
            if (i < tasks.length - 1) await new Promise(r => setTimeout(r, 5000));
        }
    } catch (e) {
        console.error("Lỗi:", e);
    } finally {
        isPatrolling = false;
    }
}

function processTask(task, index, total) {
    return new Promise((resolve) => {
        chrome.tabs.create({ url: task.url, active: false }, (tab) => {
            if (!tab) { resolve(); return; }
            const waitTime = task.url.includes("facebook") ? 15000 : 10000;

            setTimeout(() => {
                chrome.tabs.get(tab.id, () => {
                    if (chrome.runtime.lastError) { resolve(); return; }

                    chrome.tabs.sendMessage(tab.id, {
                        action: "AUTO_SCROLL_START",
                        platform: task.platform
                    }).catch(() => { });

                    setTimeout(() => {
                        chrome.tabs.remove(tab.id, () => resolve());
                    }, 25000);
                });
            }, waitTime);
        });
    });
}