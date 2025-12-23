(async function () {
    console.log("🚀 FeedbackPro Scraper bắt đầu chạy...");

    const currentUrl = window.location.href;
    let platform = "OTHER";
    let items = [];

    // --- LOGIC CÀO SHOPEE ---
    if (currentUrl.includes("shopee.vn")) {
        platform = "SHOPEE";
        // Chọn tất cả các khối comment (Class này có thể thay đổi theo thời gian, cần inspect để check)
        // Mẹo: Shopee class thường là .shopee-product-rating__main
        const comments = document.querySelectorAll('.shopee-product-rating__main');

        comments.forEach(el => {
            const contentEl = el.querySelector('.shopee-product-rating__content');
            const authorEl = el.querySelector('.shopee-product-rating__author-name');
            const timeEl = el.querySelector('.shopee-product-rating__time');

            if (contentEl && contentEl.innerText.trim()) {
                items.push({
                    content: contentEl.innerText.trim(),
                    source_platform: "SHOPEE",
                    author_name: authorEl ? authorEl.innerText.trim() : "Anonymous",
                    likes: 0 // Shopee web khó lấy like hơn, tạm để 0
                });
            }
        });
    }

    // --- LOGIC CÀO FACEBOOK (Cơ bản) ---
    else if (currentUrl.includes("facebook.com")) {
        platform = "FACEBOOK";
        // Facebook rất khó cào vì class bị mã hóa (vd: x1yzt...). 
        // Ta dùng attribute selector an toàn hơn: [dir="auto"] thường là nội dung comment
        // Lưu ý: Đây chỉ là demo đơn giản. Cào Facebook chuẩn cần logic phức tạp hơn nhiều.

        // Tìm các khối comment (div có role=article hoặc aria-label chứa Comment)
        const commentBlocks = document.querySelectorAll('div[role="article"]'); // Selector tương đối

        commentBlocks.forEach(el => {
            // Thử tìm nội dung text
            const textDiv = el.querySelector('div[dir="auto"]');
            // Thử tìm tên người (thường là thẻ strong hoặc span class bold)
            // Đây là đoán mò class, FB đổi liên tục
            const userLink = el.querySelector('a[role="link"] span');

            if (textDiv && textDiv.innerText.trim()) {
                items.push({
                    content: textDiv.innerText.trim(),
                    source_platform: "FACEBOOK",
                    author_name: userLink ? userLink.innerText : "Facebook User",
                    likes: 0
                });
            }
        });
    }

    console.log(`🔎 Tìm thấy ${items.length} comments trên ${platform}`);

    if (items.length === 0) {
        chrome.runtime.sendMessage({ action: "SCRAPE_ERROR", message: "Không tìm thấy comment nào (hoặc sai selector)!" });
        return;
    }

    // --- GỬI VỀ BACKEND ---
    try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/feedbacks/batch-import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: currentUrl,
                items: items
            })
        });

        if (response.ok) {
            chrome.runtime.sendMessage({ action: "SCRAPE_DONE", count: items.length });
        } else {
            chrome.runtime.sendMessage({ action: "SCRAPE_ERROR", message: "Server lỗi" });
        }
    } catch (err) {
        console.error(err);
        chrome.runtime.sendMessage({ action: "SCRAPE_ERROR", message: "Không kết nối được Backend" });
    }

})();