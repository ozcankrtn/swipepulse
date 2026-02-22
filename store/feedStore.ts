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
    currentCategory: 'all' | 'news' | 'culture' | 'sport' | 'technology';
    defaultCategory: 'all' | 'news' | 'culture' | 'sport' | 'technology';
    seenArticleIds: Record<string, Set<string>>;
    setCategory: (category: 'all' | 'news' | 'culture' | 'sport' | 'technology') => void;
    setDefaultCategory: (category: 'all' | 'news' | 'culture' | 'sport' | 'technology') => Promise<void>;
    setArticles: (articles: Article[]) => void;
    swipeRight: () => void;
    swipeLeft: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
    clearSeenForCategory: (category: string) => void;
    clearAllSeen: () => void;

    // Bookmarks
    bookmarks: Article[];
    toggleBookmark: (article: Article) => void;
    isBookmarked: (articleId: string) => boolean;
    loadBookmarks: () => Promise<void>;
    clearBookmarks: () => Promise<void>;
    initialize: () => Promise<void>;
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
    currentCategory: 'all',
    defaultCategory: 'all',
    seenArticleIds: {
        all: new Set(),
        news: new Set(),
        culture: new Set(),
        sport: new Set(),
        technology: new Set(),
    },
    bookmarks: [],
    setCategory: (category) => set({ currentCategory: category, articles: [], currentIndex: 0, error: null }),
    setDefaultCategory: async (category) => {
        try {
            await AsyncStorage.setItem('default_category', category);
            set({ defaultCategory: category });
        } catch (err) {
            console.warn('Failed to save default category:', err);
        }
    },
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
    clearAllSeen: () => set({
        seenArticleIds: {
            all: new Set(),
            news: new Set(),
            culture: new Set(),
            sport: new Set(),
            technology: new Set(),
        }
    }),
    toggleBookmark: (article) => set((state) => {
        const isBookmarked = state.bookmarks.some((b) => b.id === article.id);
        const newBookmarks = isBookmarked
            ? state.bookmarks.filter((b) => b.id !== article.id)
            : [...state.bookmarks, article];

        AsyncStorage.setItem('newsswipe_bookmarks', JSON.stringify(newBookmarks)).catch((err) =>
            console.warn('Failed to save bookmarks:', err)
        );

        return { bookmarks: newBookmarks };
    }),
    isBookmarked: (articleId: string) => {
        return get().bookmarks.some((b: Article) => b.id === articleId);
    },
    loadBookmarks: async () => {
        try {
            const data = await AsyncStorage.getItem('newsswipe_bookmarks');
            if (data) {
                set({ bookmarks: JSON.parse(data) });
            }
        } catch (err) {
            console.warn('Failed to load bookmarks:', err);
        }
    },
    clearBookmarks: async () => {
        try {
            await AsyncStorage.removeItem('newsswipe_bookmarks');
            set({ bookmarks: [] });
        } catch (err) {
            console.warn('Failed to clear bookmarks:', err);
        }
    },
    initialize: async () => {
        try {
            const [defCat, bookmarksData] = await Promise.all([
                AsyncStorage.getItem('default_category'),
                AsyncStorage.getItem('newsswipe_bookmarks')
            ]);

            const updates: Partial<FeedState> = {};

            if (defCat) {
                updates.defaultCategory = defCat as any;
                updates.currentCategory = defCat as any;
            }

            if (bookmarksData) {
                updates.bookmarks = JSON.parse(bookmarksData);
            }

            set(updates);
        } catch (err) {
            console.warn('Failed to initialize store:', err);
        }
    },
}));
