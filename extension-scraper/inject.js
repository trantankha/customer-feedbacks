(function () {
    console.log("🔥 [Interceptor] Gián điệp mạng đã kích hoạt...");

    function sendToContent(data, platform) {
        window.postMessage({ source: "FEEDBACK_INTERCEPTOR", payload: data, platform: platform }, "*");
    }

    // --- HOOK FETCH (SHOPEE SỬ DỤNG CÁI NÀY) ---
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        const url = args[0] ? args[0].toString() : "";

        // Bắt API Shopee (chứa chữ get_ratings)
        if (url.includes("get_ratings") || url.includes("get_shop_ratings")) {
            const clone = response.clone();
            clone.json().then(data => {
                // Shopee trả về: data.data.ratings
                if (data && data.data && data.data.ratings) {
                    console.log("🎁 [Interceptor] Bắt được gói tin Shopee!");
                    sendToContent(data.data.ratings, "SHOPEE");
                }
            }).catch(() => { });
        }
        return response;
    };
})();