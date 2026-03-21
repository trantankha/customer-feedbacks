(function () {
    console.log("🔥 [Interceptor] Gián điệp mạng đã kích hoạt...");

    function sendToContent(data, platform) {
        window.postMessage({ source: "FEEDBACK_INTERCEPTOR", payload: data, platform: platform }, "*");
    }

    // --- HOOK FETCH ---
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        
        // Đọc URL từ các kiểu truyền param của fetch (string, URL, Request obj)
        let url = "";
        try {
            if (typeof args[0] === "string" || args[0] instanceof URL) {
                url = args[0].toString();
            } else if (args[0] && typeof args[0].url === "string") {
                url = args[0].url; // Support fetch(new Request("url"))
            } else if (args[0] && args[0].url && typeof args[0].url.toString === "function") {
                url = args[0].url.toString();
            }
        } catch (e) {}

        // Bắt API Shopee hoặc Tiktok
        if (url.includes("get_ratings") || url.includes("get_shop_ratings") || url.includes("/api/comment/list/") || url.includes("/api/comment/list/reply/")) {
            const clone = response.clone();
            clone.json().then(data => {
                // Shopee: data.data.ratings
                if (data && data.data && data.data.ratings) {
                    console.log("🎁 [Interceptor Fetch] Bắt được gói tin Shopee!");
                    sendToContent(data.data.ratings, "SHOPEE");
                }
                
                // Tiktok: data.comments
                if (data && data.comments && Array.isArray(data.comments)) {
                    console.log("🎁 [Interceptor Fetch] Bắt được gói tin Tiktok!");
                    sendToContent(data.comments, "TIKTOK");
                }
            }).catch(() => { });
        }
        return response;
    };

    // --- HOOK XHR (Dự phòng cho các web cũ/cơ chế cuộn ajax) ---
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        this._interceptedUrl = url ? url.toString() : "";
        return originalXhrOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function() {
        this.addEventListener('load', function() {
            try {
                const url = this._interceptedUrl || "";
                if (url.includes("get_ratings") || url.includes("get_shop_ratings") || url.includes("/api/comment/list/") || url.includes("/api/comment/list/reply/")) {
                    if (this.responseType === "" || this.responseType === "text" || this.responseType === "json") {
                        let data = typeof this.response === "object" ? this.response : JSON.parse(this.responseText);
                        
                        if (data && data.data && data.data.ratings) {
                            console.log("🎁 [Interceptor XHR] Bắt được gói tin Shopee!");
                            sendToContent(data.data.ratings, "SHOPEE");
                        }
                        if (data && data.comments && Array.isArray(data.comments)) {
                            console.log("🎁 [Interceptor XHR] Bắt được gói tin Tiktok!");
                            sendToContent(data.comments, "TIKTOK");
                        }
                    }
                }
            } catch (err) {}
        });
        return originalXhrSend.apply(this, arguments);
    };
})();