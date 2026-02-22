import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CATEGORIES = ["news", "culture", "sport", "technology"];

const mapCategory = (cat: string) => {
    switch (cat) {
        case "news": return "general";
        case "culture": return "entertainment";
        case "sport": return "sports";
        case "technology": return "technology";
        default: return "general";
    }
};

const normalizeTitle = (title: string): string =>
    title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

const getFirstWords = (text: string, count: number): string =>
    text.split(" ").slice(0, count).join(" ");

Deno.serve(async () => {
    let totalInserted = 0;
    let totalSkipped = 0;
    let totalDeduplicated = 0;
    let totalCleaned = 0;

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch existing articles for deduplication
    const { data: existingArticles } = await supabase
        .from("articles")
        .select("title, category")
        .gt("published_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const existingMap = new Map<string, Set<string>>();
    existingArticles?.forEach(art => {
        const norm = getFirstWords(normalizeTitle(art.title), 8);
        if (!existingMap.has(art.category)) existingMap.set(art.category, new Set());
        existingMap.get(art.category)!.add(norm);
    });

    for (const category of CATEGORIES) {
        try {
            const url = `https://newsapi.org/v2/top-headlines?country=us&category=${mapCategory(category)}&pageSize=20&apiKey=${NEWS_API_KEY}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.status !== "ok") {
                console.error(`[${category}] NewsAPI error:`, data.message);
                continue;
            }

            for (const article of data.articles || []) {
                if (!article.title || !article.url || !article.urlToImage ||
                    article.title.includes("[Removed]") || article.url.includes("[Removed]")) {
                    totalSkipped++;
                    continue;
                }

                const first8 = getFirstWords(normalizeTitle(article.title), 8);

                if (existingMap.get(category)?.has(first8)) {
                    totalDeduplicated++;
                    continue;
                }

                const { error } = await supabase.from("articles").upsert({
                    external_id: btoa(article.url).slice(0, 255),
                    title: article.title,
                    source_name: article.source?.name,
                    image_url: article.urlToImage,
                    article_url: article.url,
                    category,
                    language: "en",
                    published_at: article.publishedAt,
                    is_active: true,
                }, { onConflict: "external_id", ignoreDuplicates: true });

                if (error) {
                    totalSkipped++;
                } else {
                    totalInserted++;
                    if (!existingMap.has(category)) existingMap.set(category, new Set());
                    existingMap.get(category)!.add(first8);
                }
            }
        } catch (err) {
            console.error(`[${category}] Error:`, err);
        }
    }

    // Cleanup
    const { count: cleaned } = await supabase
        .from("articles")
        .delete({ count: "exact" })
        .lt("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    totalCleaned = cleaned ?? 0;

    const result = { inserted: totalInserted, skipped: totalSkipped, deduplicated: totalDeduplicated, cleaned: totalCleaned, timestamp: new Date().toISOString() };
    console.log("fetch-news result:", result);

    return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
    });
});