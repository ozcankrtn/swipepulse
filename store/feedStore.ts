import { create } from 'zustand';

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
    setCategory: (category: 'news' | 'culture' | 'sport' | 'technology') => void;
    setArticles: (articles: Article[]) => void;
    swipeRight: () => void;
    swipeLeft: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
    articles: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    currentCategory: 'news',
    setCategory: (category) => set({ currentCategory: category, articles: [], currentIndex: 0, error: null }),
    setArticles: (articles) => set({ articles, currentIndex: 0 }),
    swipeRight: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
    swipeLeft: () => set((state) => ({ currentIndex: state.currentIndex + 1 })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    reset: () => set({ articles: [], currentIndex: 0, isLoading: false, error: null }),
}));
