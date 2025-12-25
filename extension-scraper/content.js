const BACKEND_IMPORT_URL = "http://127.0.0.1:8000/api/v1/feedbacks/batch-import";

// --- TIÊM INJECT.JS ---
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(s);

console.log("🔥 [Content] Logic thời gian: Chỉ lấy ngày cụ thể, còn lại là NOW.");

let collectedItems = [];
let isRunning = false;

// --- 1. LẮNG NGHE LỆNH ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "AUTO_SCROLL_START") {
        if (isRunning) return;
        isRunning = true;
        collectedItems = [];
        startHybridProcess(req.platform);
    }
    if (req.action === "FORCE_SCRAPE_NOW") {
        console.log("👆 Thủ công kích hoạt.");
        if (window.location.href.includes("facebook")) scrapeFacebookDOM();
        finalizeAndSend(true);
        sendResponse({ status: "Processing" });
    }
});

// --- 2. NHẬN DATA SHOPEE (API INTERCEPTOR) ---
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.source !== "FEEDBACK_INTERCEPTOR") return;
    const { payload, platform } = event.data;

    if (platform === "SHOPEE" && Array.isArray(payload)) {
        payload.forEach(r => {
            if (r.comment && r.comment.trim().length > 0) {
                // Shopee luôn trả về Unix Timestamp (Ngày cụ thể) -> Lấy luôn
                let specificTime = null;
                if (r.ctime) {
                    specificTime = new Date(r.ctime * 1000).toISOString();
                }

                collectedItems.push({
                    author_name: r.author_username || "Shopee User",
                    content: r.comment,
                    original_timestamp: specificTime, // Luôn chính xác
                    source_platform: "SHOPEE",
                    likes: 0
                });
            }
        });
        console.log(`📦 [Shopee] Đã lấy ${collectedItems.length} review.`);
    }
});

// --- 3. FACEBOOK DOM SCRAPER (LOGIC ĐƠN GIẢN) ---
function scrapeFacebookDOM() {
    console.log("🔎 [Facebook] Đang quét...");

    let divs = document.querySelectorAll('div[dir="auto"]');
    if (divs.length < 2) divs = document.querySelectorAll('div[role="article"] div[dir="auto"]');

    divs.forEach(div => {
        const text = div.innerText;
        if (text && text.length > 2) {
            // Lọc rác
            if (["Thích", "Phản hồi", "Xem thêm", "Viết bình luận...", "Top fan"].some(k => text.includes(k))) return;

            const article = div.closest('div[role="article"]') || div.closest('li');
            let author = "Facebook User";
            let rawTimeStr = "";

            if (article) {
                // Lấy tên
                const authorEl = article.querySelector('span > a > span') || article.querySelector('strong span');
                if (authorEl) author = authorEl.innerText;

                // Lấy chuỗi thời gian thô (để kiểm tra xem có ngày cụ thể không)
                const links = article.querySelectorAll('a');
                for (let link of links) {
                    if (link.innerText && link.innerText.length < 25 && link.innerText !== author) {
                        // Tìm các thẻ chứa số (ngày/giờ)
                        if (/\d/.test(link.innerText)) {
                            rawTimeStr = link.innerText;
                            break;
                        }
                    }
                }
            }

            // --- QUY TẮC THỜI GIAN MỚI ---
            // 1. Cố gắng parse ngày cụ thể (VD: 20/10/2023)
            // 2. Nếu không ra -> Lấy giờ hiện tại (Now)

            const finalTime = parseStrictDate(rawTimeStr) || new Date().toISOString();

            collectedItems.push({
                author_name: author,
                content: text,
                original_timestamp: finalTime,
                source_platform: "FACEBOOK",
                likes: 0
            });
        }
    });
}

// --- 4. HÀM PARSE NGÀY CỤ THỂ (STRICT MODE) ---
function parseStrictDate(str) {
    if (!str) return null;
    const s = str.toLowerCase().trim();
    const now = new Date();

    try {
        // Regex bắt dạng: 20/10, 20/10/2023, 20 tháng 10, 20 thg 10
        // Group 1: Ngày, Group 2: Tháng, Group 3: Năm (Optional)
        const regex = /(\d{1,2})[\/\s\.-]+(?:tháng|thg)?[\/\s\.-]*(\d{1,2})(?:[\/\s\.-]+(\d{4}))?/;
        const match = s.match(regex);

        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Tháng JS từ 0-11
            let year = now.getFullYear();

            if (match[3]) {
                year = parseInt(match[3]); // Nếu có năm cụ thể
            } else {
                // Nếu không có năm (VD: 20/10), mà ngày này > ngày hiện tại -> Suy ra là năm ngoái
                const tempDate = new Date(year, month, day);
                if (tempDate > now) year -= 1;
            }

            return new Date(year, month, day).toISOString();
        }
    } catch (e) {
        return null;
    }

    return null; // Các trường hợp: "1 giờ trước", "Hôm qua" sẽ rơi vào đây -> Null -> Fallback về NOW
}

// --- HÀM GỬI DỮ LIỆU (ĐÃ SỬA ĐỔI) ---
function finalizeAndSend(isManual = false) {
    if (collectedItems.length === 0) {
        console.warn("⚠️ Kho rỗng.");
        if (isManual) alert("Chưa có dữ liệu mới để gửi!");
        isRunning = false;
        return;
    }

    // Lọc trùng
    const unique = collectedItems.filter((v, i, a) => a.findIndex(v2 => (v2.content === v.content)) === i);
    const url = window.location.href;

    console.log(`🚀 Đang chuyển ${unique.length} dòng cho Background xử lý...`);

    // GỬI TIN NHẮN CHO BACKGROUND (Thay vì fetch trực tiếp)
    chrome.runtime.sendMessage({
        action: "SEND_DATA_TO_BACKEND",
        payload: { url: url, items: unique }
    }, (response) => {
        if (response && response.success) {
            console.log("✅ Background báo: Gửi thành công!");
            chrome.runtime.sendMessage({ action: "SCRAPE_DONE", count: unique.length });
            collectedItems = []; // Xả kho
        } else {
            console.error("❌ Background báo: Gửi thất bại.");
            chrome.runtime.sendMessage({ action: "SCRAPE_ERROR", message: "Lỗi kết nối Backend" });
        }
    });

    isRunning = false;
}

function startHybridProcess(platform) {
    let attempts = 0;
    const max = 15;
    const timer = setInterval(() => {
        attempts++;
        window.scrollBy(0, 800);
        if (platform === "SHOPEE" && attempts === 2) {
            const btn = document.querySelector('.product-rating-overview__filter--all');
            if (btn) btn.click();
        }
        if (platform === "FACEBOOK") {
            clickFacebookButtons();
            scrapeFacebookDOM();
        }
        if (attempts >= max) {
            clearInterval(timer);
            console.log("🛑 Dừng cuộn. Gửi hàng...");
            finalizeAndSend(false);
        }
    }, 1500);
}

function clickFacebookButtons() {
    const keys = ["xem thêm", "bình luận", "phù hợp nhất", "tất cả"];
    document.querySelectorAll('div[role="button"], span').forEach(el => {
        if (el.innerText && keys.some(k => el.innerText.toLowerCase().includes(k))) {
            try { el.click(); } catch (e) { }
        }
    });
}