// content.js - CONFLICT FREE

// --- 1. TIÊM INJECT.JS (Bắt buộc cho Shopee) ---
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(s);

console.log("🔥 [Content] Sẵn sàng nhận lệnh.");

// Biến lưu trữ tạm
let collectedItems = [];
let isAutoRunning = false; // Cờ đánh dấu đang chạy tự động

// --- 2. LẮNG NGHE MESSAGES ---
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

    // CASE 1: LỆNH TỰ ĐỘNG TỪ BACKGROUND (AUTO)
    if (req.action === "AUTO_SCROLL_START") {
        if (isAutoRunning) return; // Đang chạy rồi thì thôi

        console.log(`🤖 [Auto] Nhận lệnh tuần tra ${req.platform}...`);
        isAutoRunning = true;
        collectedItems = []; // Quan trọng: Reset kho để không dính dữ liệu cũ

        startAutoScrollProcess(req.platform);
    }

    // CASE 2: LỆNH THỦ CÔNG TỪ POPUP (MANUAL)
    if (req.action === "FORCE_SCRAPE_NOW") {
        console.log("👆 [Manual] Kích hoạt chế độ thủ công.");

        // Nếu là Facebook/Tiktok, quét lại DOM một lần nữa cho chắc
        if (window.location.href.includes("facebook")) {
            scrapeFacebookDOM();
        } else if (window.location.href.includes("tiktok")) {
            scrapeTiktokDOM();
        }

        // Gửi ngay lập tức những gì đang có
        finalizeAndSend(true);
        sendResponse({ status: "Processing" });
    }
});

// --- 3. LẮNG NGHE DỮ LIỆU TỪ INJECT.JS (SHOPEE API) ---
// Đây là lắng nghe thụ động, nó hoạt động cho cả Thủ công và Tự động
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.source !== "FEEDBACK_INTERCEPTOR") return;
    const { payload, platform } = event.data;

    if (platform === "SHOPEE" && Array.isArray(payload)) {
        payload.forEach(r => {
            if (r.comment && r.comment.trim().length > 0) {
                // Logic lấy thời gian chuẩn xác từ Shopee
                let specificTime = null;
                if (r.ctime) {
                    specificTime = new Date(r.ctime * 1000).toISOString();
                }

                collectedItems.push({
                    author_name: r.author_username || "Shopee User",
                    content: r.comment,
                    original_timestamp: specificTime,
                    source_platform: "SHOPEE",
                    likes: 0
                });
            }
        });
        console.log(`📦 [Shopee] Đã bắt được ${collectedItems.length} review.`);
    }
});

// --- 4. LOGIC CUỘN TỰ ĐỘNG (CHỈ DÙNG CHO AUTO) ---
function startAutoScrollProcess(platform) {
    let count = 0;
    const maxScrolls = 15; // Cuộn 15 lần (khoảng 20s)

    const timer = setInterval(() => {
        count++;
        window.scrollBy(0, 800); // Cuộn xuống

        // Fix lỗi Shopee: Nút "Tất cả" đôi khi chưa được bấm
        if (platform === "SHOPEE" && count === 2) {
            const btn = document.querySelector('.product-rating-overview__filter--all');
            if (btn) btn.click();
        }

        // Fix lỗi Facebook/Tiktok: Cần cào DOM liên tục vì nó render dần dần
        if (platform === "FACEBOOK") {
            clickFacebookButtons();
            scrapeFacebookDOM();
        } else if (platform === "TIKTOK") {
            scrapeTiktokDOM();
        }

        // ĐIỀU KIỆN DỪNG
        if (count >= maxScrolls) {
            clearInterval(timer);
            console.log("🛑 [Auto] Hoàn thành cuộn. Gửi dữ liệu...");
            finalizeAndSend(false); // Gửi đi
            isAutoRunning = false; // Reset cờ
        }
    }, 1500);
}

// --- 5. HÀM GỬI DỮ LIỆU CHUNG (CORE) ---
function finalizeAndSend(isManual = false) {
    if (collectedItems.length === 0) {
        console.warn("⚠️ Kho rỗng. Không có gì để gửi.");
        if (isManual) alert("Chưa thu thập được dữ liệu nào! Hãy cuộn trang thêm chút nữa.");
        return;
    }

    // Lọc trùng lặp ngay tại Client để giảm tải cho Server
    const unique = collectedItems.filter((v, i, a) => a.findIndex(v2 => (v2.content === v.content)) === i);
    const url = window.location.href;

    console.log(`🚀 Đang gửi ${unique.length} dòng về Background...`);

    // Gửi qua Background (Proxy)
    chrome.runtime.sendMessage({
        action: "SEND_DATA_TO_BACKEND",
        payload: { url: url, items: unique }
    }, (response) => {
        if (response && response.success) {
            console.log("✅ Gửi thành công!");
            // Báo cho Popup biết nếu đang mở
            chrome.runtime.sendMessage({ action: "SCRAPE_DONE", count: unique.length });

            // QUAN TRỌNG: Sau khi gửi xong thì xả kho để tránh gửi trùng lần sau
            collectedItems = [];
        } else {
            console.error("❌ Gửi thất bại.");
        }
    });
}

// --- 6. CÁC HÀM BỔ TRỢ (HELPER) ---

function scrapeFacebookDOM() {
    // Logic cào Facebook DOM (như cũ)
    let divs = document.querySelectorAll('div[dir="auto"]');
    if (divs.length < 2) divs = document.querySelectorAll('div[role="article"] div[dir="auto"]');

    divs.forEach(div => {
        const text = div.innerText;
        if (text && text.length > 2) {
            if (["Thích", "Phản hồi", "Xem thêm", "Viết bình luận...", "Top fan"].some(k => text.includes(k))) return;

            const article = div.closest('div[role="article"]') || div.closest('li');
            let author = "Facebook User";
            let rawTimeStr = "";

            if (article) {
                const authorEl = article.querySelector('span > a > span') || article.querySelector('strong span');
                if (authorEl) author = authorEl.innerText;

                // Tìm ngày tháng
                const links = article.querySelectorAll('a');
                for (let link of links) {
                    if (link.innerText && /\d/.test(link.innerText) && link.innerText.length < 25) {
                        rawTimeStr = link.innerText;
                        break;
                    }
                }
            }

            const finalTime = parseStrictDate(rawTimeStr) || new Date().toISOString();

            let likes = 0;
            if (article) {
                // Cách 1: Thử tìm thẻ aria-label
                const likeEls = article.querySelectorAll('[aria-label*="thích"], [aria-label*="Like"], [aria-label*="like"]');
                for (let el of likeEls) {
                    let btnText = el.getAttribute('aria-label') || '';
                    let match = btnText.match(/(\d+)/);
                    if (match) {
                        likes = parseInt(match[1], 10);
                        break;
                    }
                }

                // Cách 2: Tìm text nổi quanh các nút phản hồi (cấu trúc phổ biến mới của fb)
                if (likes === 0) {
                    // Thường tooltip số like hoặc số đứng cạnh chữ Phản hồi
                    const spanTexts = article.querySelectorAll('span');
                    for (let span of spanTexts) {
                        const txt = span.innerText.trim();
                        // Tránh nhận nhầm tên người, thời gian
                        if (txt && txt.length > 0 && txt.length < 6) {
                            // Xem nó là chữ số thuần túy không
                            if (/^\d+$/.test(txt)) {
                                likes = parseInt(txt, 10);
                                break;
                            } 
                            // Số kèm ký tự nghìn như 1,2K hoặc 1.5K
                            else if (/^(\d+[.,]?\d*)[Kk]$/.test(txt)) {
                                const kMatch = txt.match(/^(\d+[.,]?\d*)[Kk]$/);
                                if (kMatch) {
                                    likes = parseFloat(kMatch[1].replace(',', '.')) * 1000;
                                    break;
                                }
                            }
                        }
                    }
                }

                // Cách 3: Nút reaction chứa hình ảnh SVG và kế bên là số
                if (likes === 0) {
                    const svgs = article.querySelectorAll('svg');
                    svgs.forEach(svg => {
                       const nextEl = svg.nextElementSibling || (svg.parentElement && svg.parentElement.nextElementSibling);
                       if (nextEl && nextEl.innerText) {
                           const txt = nextEl.innerText.trim();
                           if (/^\d+$/.test(txt)) likes = parseInt(txt, 10);
                       }
                    });
                }
            }

            collectedItems.push({
                author_name: author,
                content: text,
                original_timestamp: finalTime,
                source_platform: "FACEBOOK",
                likes: likes
            });
        }
    });
}

function clickFacebookButtons() {
    const keys = ["xem thêm", "bình luận", "phù hợp nhất", "tất cả"];
    document.querySelectorAll('div[role="button"], span').forEach(el => {
        if (el.innerText && keys.some(k => el.innerText.toLowerCase().includes(k))) {
            try { el.click(); } catch (e) { }
        }
    });
}

function parseStrictDate(str) {
    // Hàm parse ngày như cũ
    if (!str) return null;
    const s = str.toLowerCase().trim();
    const now = new Date();
    try {
        const regex = /(\d{1,2})[\/\s\.-]+(?:tháng|thg)?[\/\s\.-]*(\d{1,2})(?:[\/\s\.-]+(\d{4}))?/;
        const match = s.match(regex);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            let year = match[3] ? parseInt(match[3]) : now.getFullYear();
            if (!match[3]) {
                const tempDate = new Date(year, month, day);
                if (tempDate > now) year -= 1;
            }
            return new Date(year, month, day).toISOString();
        }
    } catch (e) { return null; }
    return null;
}

function scrapeTiktokDOM() {
    // Logic cào Tiktok DOM cơ bản
    // Tiktok thường dùng các trường DOM có thuộc tính data-e2e="comment-level-1"
    let commentNodes = document.querySelectorAll('div[class*="DivCommentItemContainer"], div[data-e2e="comment-level-1"]');

    // Fallback nếu cấu trúc DOM đổi
    if (commentNodes.length === 0) {
        commentNodes = document.querySelectorAll('div[class*="CommentItem"]');
    }

    commentNodes.forEach(node => {
        let text = "";
        let author = "Tiktok User";

        // Tìm text bình luận
        const textNode = node.querySelector('p[data-e2e="comment-level-1"], p[class*="CommentText"], span[class*="SpanCommentContent"]');
        if (textNode) {
            text = textNode.innerText;
        } else {
            // Cố gắng lấy hết text trong các thẻ P bỏ qua nút Trả lời/Thích
            const pTags = node.querySelectorAll('p');
            pTags.forEach(p => {
                if (p.innerText && !["Trả lời", "Thích"].includes(p.innerText.trim())) {
                    text += p.innerText + " ";
                }
            });
        }

        text = text.trim();
        if (text && text.length > 2) {
            // Tên người dùng
            const authorEl = node.querySelector('span[data-e2e="comment-username-1"], span[class*="SpanUserNameText"]');
            if (authorEl) author = authorEl.innerText;

            // Số lượt like
            let likes = 0;
            const likeEl = node.querySelector('span[data-e2e="comment-like-count"], span[class*="SpanCount"]');
            if (likeEl) {
                let likeText = likeEl.innerText.toLowerCase().trim();
                // Xử lý kí hiệu nghìn K
                if (likeText.includes('k')) {
                    likes = parseFloat(likeText.replace(/,/g, '.')) * 1000;
                } else {
                    likes = parseInt(likeText) || 0;
                }
            }

            collectedItems.push({
                author_name: author,
                content: text,
                original_timestamp: new Date().toISOString(), // Dùng thời gian hiện tại lúc cào thay vì cố phân tích timestamp bị che khuất
                source_platform: "TIKTOK",
                likes: likes
            });
        }
    });
}