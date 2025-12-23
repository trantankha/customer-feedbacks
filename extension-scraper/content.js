// Hàm hỗ trợ convert Unix Timestamp sang ISO String
function convertToISODate(rawTimestamp) {
    if (!rawTimestamp) return new Date().toISOString();
    let ts = Number(rawTimestamp);
    // Nếu là giây (10 số) thì nhân 1000 để thành mili-giây
    if (ts < 10000000000) ts = ts * 1000;
    return new Date(ts).toISOString();
}

// Tiêm inject.js vào trang web
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);

// Lắng nghe thông điệp từ inject.js
window.addEventListener("message", async (event) => {
    // Chỉ nhận tin từ chính trang web này
    if (event.source !== window) return;

    let itemsToProcess = [];

    if (event.data.type === "SHOPEE_DATA_INTERCEPTED") {
        itemsToProcess = event.data.payload;
    } else if (event.data.type === "FB_DATA_INTERCEPTED") {
        itemsToProcess = event.data.payload;
    }

    if (itemsToProcess.length > 0) {
        // --- CHUẨN HÓA DỮ LIỆU ---
        const cleanItems = itemsToProcess.map(item => ({
            content: item.content,
            source_platform: item.source_platform,
            author_name: item.author_name,
            likes: item.likes,
            created_at: convertToISODate(item.timestamp)
        }));

        // Lọc trùng lặp
        const uniqueItems = Array.from(new Set(cleanItems.map(JSON.stringify))).map(JSON.parse);

        console.log(`🚀 Đang gửi ${uniqueItems.length} dòng về Backend. Time mẫu: ${uniqueItems[0].created_at}`);
        await sendToBackend(uniqueItems);
    }

    if (event.data.type && (event.data.type === "SHOPEE_DATA_INTERCEPTED")) {
        console.log("📦 Bắt được gói tin Shopee:", event.data.payload);

        const rawData = event.data.payload;

        // 3. Chuẩn hóa dữ liệu JSON (Mapping)
        // Shopee API trả về: data.data.ratings -> list comment
        if (rawData.data && rawData.data.ratings) {
            const items = rawData.data.ratings.map(r => ({
                content: r.comment,
                source_platform: "SHOPEE",
                author_name: r.author_username,
                likes: r.like_count || 0,
                created_at: convertToISODate(r.timestamp)
            }));

            if (items.length > 0) {
                // 4. Gửi về Backend ngay lập tức (Real-time)
                await sendToBackend(items);
            }
        }
    }

    if (event.data.type === "FB_DATA_INTERCEPTED") {
        const comments = event.data.payload; // Đây đã là list items chuẩn rồi
        console.log(`📦 Bắt được ${comments.length} comment từ Facebook!`);

        if (comments.length > 0) {
            // Lọc trùng lặp đơn giản (trong cùng 1 batch)
            const uniqueComments = Array.from(new Set(comments.map(JSON.stringify))).map(JSON.parse);

            await sendToBackend(uniqueComments);
        }
    }
});

async function sendToBackend(items) {
    try {
        await fetch('http://127.0.0.1:8000/api/v1/feedbacks/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: window.location.href,
                items: items
            })
        });
        console.log(`✅ Đã đồng bộ ${items.length} comment về server.`);
    } catch (e) {
        console.error("Lỗi gửi backend:", e);
    }
}