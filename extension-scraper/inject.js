// extension-scraper/inject.js
(function () {
    const originalFetch = window.fetch;
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;

    // --- HÀM TÌM KIẾM ĐỆ QUY (NÂNG CẤP) ---
    function findCommentsInObject(obj, foundComments = []) {
        if (!obj || typeof obj !== 'object') return foundComments;

        // DẤU HIỆU NHẬN BIẾT FACEBOOK COMMENT
        // Cấu trúc thường gặp 1: { body: { text: "..." }, author: { name: "..." }, created_time: 12345... }
        // Cấu trúc thường gặp 2: { node: { body: { text: "..." } ... } }

        let candidate = null;

        // Trường hợp 1: Object hiện tại chính là comment
        if (obj.body && obj.body.text && obj.author && obj.author.name) {
            candidate = obj;
        }
        // Trường hợp 2: Object hiện tại bọc comment trong 'node'
        else if (obj.node && obj.node.body && obj.node.body.text && obj.node.author) {
            candidate = obj.node;
        }

        if (candidate) {
            // --- LOGIC LẤY THỜI GIAN ---
            // Facebook thường trả về 'created_time' (số giây)
            let rawTime = candidate.created_time || candidate.timestamp || 0;

            // Nếu không tìm thấy, thử tìm trong object 'feedback' con (nếu có)
            if (!rawTime && candidate.feedback) {
                rawTime = candidate.feedback.created_time || 0;
            }

            foundComments.push({
                content: candidate.body.text,
                author_name: candidate.author.name,
                source_platform: "FACEBOOK",
                likes: 0, // Facebook giấu like chỗ khác, tạm bỏ qua
                timestamp: rawTime // <--- Lấy số giây thô (Raw Unix Timestamp)
            });
        }

        // Tiếp tục đào sâu
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                findCommentsInObject(obj[key], foundComments);
            }
        }
        return foundComments;
    }

    // --- GHI ĐÈ FETCH ---
    window.fetch = async function (...args) {
        const response = await originalFetch(...args);
        const url = args[0] ? args[0].toString() : "";
        const clone = response.clone();

        // --- SHOPEE ---
        if (url.includes("get_ratings") || url.includes("get_comment")) {
            clone.json().then(data => {
                // Shopee API: ratings[].ctime (là số giây)
                if (data.data && data.data.ratings) {
                    const items = data.data.ratings.map(r => ({
                        content: r.comment,
                        author_name: r.author_username,
                        source_platform: "SHOPEE",
                        likes: r.like_count || 0,
                        timestamp: r.ctime // <--- Shopee dùng ctime
                    }));
                    console.log(`📦 Shopee: Bắt được ${items.length} comment. Sample time: ${items[0]?.timestamp}`);
                    window.postMessage({ type: "SHOPEE_DATA_INTERCEPTED", payload: items }, "*");
                }
            }).catch(() => { });
        }

        // --- FACEBOOK ---
        if (url.includes("/api/graphql")) {
            clone.json().then(data => {
                const comments = findCommentsInObject(data);
                if (comments.length > 0) {
                    console.log(`📦 FB: Bắt được ${comments.length} comment. Sample time: ${comments[0]?.timestamp}`);
                    window.postMessage({ type: "FB_DATA_INTERCEPTED", payload: comments }, "*");
                }
            }).catch(() => { });
        }

        return response;
    };

    // --- GHI ĐÈ XHR (Dự phòng) ---
    XHR.open = function (method, url) { this._url = url; return open.apply(this, arguments); };
    XHR.send = function (postData) {
        this.addEventListener('load', function () {
            if (this._url && (this._url.includes('api/graphql') || this._url.includes('get_ratings'))) {
                try {
                    const data = JSON.parse(this.responseText);
                    if (this._url.includes('api/graphql')) {
                        const comments = findCommentsInObject(data);
                        if (comments.length > 0) window.postMessage({ type: "FB_DATA_INTERCEPTED", payload: comments }, "*");
                    }
                } catch (e) { }
            }
        });
        return send.apply(this, arguments);
    };
})();