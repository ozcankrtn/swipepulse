import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Article {
    id: string;
    title: string;
    summary: string | null;
    image_url: string | null;
    article_url: string;
    source_name: string | null;
    source_logo_url: string | null;
    category: 'news' | 'culture' | 'sport' | 'technology' | null;
    published_at: string | null;
    is_active: boolean;
}

interface FeedState {
    articles: Article[];
    currentIndex: number;
    isLoading: boolean;
    error: string | null;
    currentCategory: 'news' | 'culture' | 'sport' | 'technology';
    seenArticleIds: Record<string, Set<string>>;
    setCategory: (category: 'news' | 'culture' | 'sport' | 'technology') => void;
    setArticles: (articles: Article[]) => void;
    swipeRight: () => void;
    swipeLeft: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
    clearSeenForCategory: (category: string) => void;

    // Bookmarks
    bookmarks: Article[];
    toggleBookmark: (article: Article) => void;
    isBookmarked: (articleId: string) => boolean;
    loadBookmarks: () => Promise<void>;
}

function generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const sessionId = generateSessionId();

const trackInteraction = async (articleId: string, action: 'swipe_left' | 'swipe_right') => {
    try {
        const { error } = await supabase.from('user_interactions').insert({
            article_id: articleId,
            action,
            user_id: null,
            session_id: sessionId,
            interacted_at: new Date().toISOString(),
        });

        if (error) {
            console.warn(`[Interaction Tracking] Failed to log ${action} for ${articleId}`, error);
        }
    } catch (e) {
        console.warn(`[Interaction Tracking] Exception logging ${action} for ${articleId}`, e);
    }
};

export const useFeedStore = create<FeedState>((set, get) => ({
    articles: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    currentCategory: 'news',
    seenArticleIds: {
        news: new Set(),
        culture: new Set(),
        sport: new Set(),
        technology: new Set(),
    },
    bookmarks: [],
    setCategory: (category) => set({ currentCategory: category, articles: [], currentIndex: 0, error: null }),
    setArticles: (articles) => set({ articles, currentIndex: 0 }),
    swipeRight: () => set((state) => {
        const article = state.articles[state.currentIndex];
        if (article) {
            trackInteraction(article.id, 'swipe_right');
            const newSeen = new Set(state.seenArticleIds[state.currentCategory]);
            newSeen.add(article.id);
            return {
                currentIndex: state.currentIndex + 1,
                seenArticleIds: { ...state.seenArticleIds, [state.currentCategory]: newSeen }
            };
        }
        return { currentIndex: state.currentIndex + 1 };
    }),
    swipeLeft: () => set((state) => {
        const article = state.articles[state.currentIndex];
        if (article) {
            trackInteraction(article.id, 'swipe_left');
            const newSeen = new Set(state.seenArticleIds[state.currentCategory]);
            newSeen.add(article.id);
            return {
                currentIndex: state.currentIndex + 1,
                seenArticleIds: { ...state.seenArticleIds, [state.currentCategory]: newSeen }
            };
        }
        return { currentIndex: state.currentIndex + 1 };
    }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    reset: () => set({ articles: [], currentIndex: 0, isLoading: false, error: null }),
    clearSeenForCategory: (category) => set((state) => ({
        seenArticleIds: { ...state.seenArticleIds, [category]: new Set() }
    })),
    toggleBookmark: (article) => set((state) => {
        const isBookmarked = state.bookmarks.some((b) => b.id === article.id);
        const newBookmarks = isBookmarked
            ? state.bookmarks.filter((b) => b.id !== article.id)
            : [...state.bookmarks, article];

        AsyncStorage.setItem('swipepulse_bookmarks', JSON.stringify(newBookmarks)).catch((err) =>
            console.warn('Failed to save bookmarks:', err)
        );

        return { bookmarks: newBookmarks };
    }),
    isBookmarked: (articleId: string) => {
        return get().bookmarks.some((b: Article) => b.id === articleId);
    },
    loadBookmarks: async () => {
        try {
            const data = await AsyncStorage.getItem('swipepulse_bookmarks');
            if (data) {
                set({ bookmarks: JSON.parse(data) });
            }
        } catch (err) {
            console.warn('Failed to load bookmarks:', err);
        }
    },
}));
