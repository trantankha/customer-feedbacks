export interface Analysis {
    sentiment_label: string;
    sentiment_score: number;
    keywords: string[];
}

export interface Feedback {
    id: string;
    raw_content: string;
    source_id: number;
    status: string;
    received_at: string;
    customer_info: {
        name?: string;
        likes?: string | number;
        imported_from?: string;
    };
    analysis: Analysis;
}