import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Pressable,
    StatusBar,
    ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useFeedStore, type Article } from '../store/feedStore';
import SwipeDeck from '../components/SwipeDeck';
import { useRouter } from 'expo-router';
import { Bookmark } from 'lucide-react-native';

const CATEGORIES = [
    { id: 'news', label: 'News' },
    { id: 'culture', label: 'Culture' },
    { id: 'sport', label: 'Sport' },
    { id: 'technology', label: 'Technology' },
] as const;

// ── Supabase fetch ────────────────────────────────────────────────────────
async function fetchArticles(category: string, seenIds: Set<string>): Promise<Article[]> {
    let query = supabase
        .from('articles')
        .select(
            'id, title, image_url, article_url, source_name, source_logo_url, category, published_at, is_active',
        )
        .eq('is_active', true)
        .eq('category', category)
        .order('published_at', { ascending: false })
        .limit(30);

    if (seenIds.size > 0) {
        const seenArray = Array.from(seenIds);
        query = query.not('id', 'in', `(${seenArray.join(',')})`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Article[];
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const { articles, currentIndex, isLoading, error, setArticles, setLoading, setError, swipeLeft, swipeRight, reset, currentCategory, setCategory, clearSeenForCategory, loadBookmarks } =
        useFeedStore();

    const loadFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const currentSeen = useFeedStore.getState().seenArticleIds[currentCategory] || new Set<string>();
            const data = await fetchArticles(currentCategory, currentSeen);
            setArticles(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [currentCategory, setArticles, setError, setLoading]);

    useEffect(() => {
        loadFeed();
        loadBookmarks();
    }, [loadFeed, loadBookmarks]);

    const isDeckEmpty = !isLoading && articles.length > 0 && currentIndex >= articles.length;
    const hasArticles = articles.length > 0;
    const remainingArticles = articles.slice(currentIndex);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.logo}>SwipePulse</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.subInfo}>
                        {hasArticles && !isDeckEmpty
                            ? `${Math.max(0, articles.length - currentIndex)} left`
                            : ''}
                    </Text>
                    <Pressable
                        style={styles.headerBookmark}
                        onPress={() => router.push('/bookmarks')}
                    >
                        <Bookmark size={24} color="#ffffff" strokeWidth={2.5} />
                    </Pressable>
                </View>
            </View>

            {/* ── Category Tabs ── */}
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = currentCategory === cat.id;
                        return (
                            <Pressable
                                key={cat.id}
                                style={[styles.tab, isActive && styles.tabActive]}
                                onPress={() => {
                                    if (!isActive) {
                                        setCategory(cat.id);
                                    }
                                }}
                            >
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {cat.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Content area ── */}
            <View style={styles.content}>

                {/* Loading */}
                {isLoading && (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="large" color="#6366f1" />
                        <Text style={styles.loadingText}>Fetching your feed…</Text>
                    </View>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <View style={styles.centerState}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                        <Text style={styles.errorTitle}>Couldn't load feed</Text>
                        <Text style={styles.errorMessage}>{error}</Text>
                        <Pressable style={styles.retryButton} onPress={loadFeed}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </Pressable>
                    </View>
                )}

                {/* Empty deck */}
                {isDeckEmpty && (
                    <View style={styles.centerState}>
                        <Text style={styles.caughtUpEmoji}>🎉</Text>
                        <Text style={styles.caughtUpTitle}>You're all caught up!</Text>
                        <Text style={styles.caughtUpSub}>
                            No more articles for now. Check back soon.
                        </Text>
                        <Pressable
                            style={styles.refreshButton}
                            onPress={() => {
                                clearSeenForCategory(currentCategory);
                                reset();
                                loadFeed();
                            }}
                        >
                            <Text style={styles.refreshText}>Refresh Feed</Text>
                        </Pressable>
                    </View>
                )}

                {/* Deck */}
                {!isLoading && !error && !isDeckEmpty && hasArticles && (
                    <SwipeDeck
                        articles={articles}
                        currentIndex={currentIndex}
                        onSwipeLeft={swipeLeft}
                        onSwipeRight={(article) => {
                            // onSwipeRight internally opens the browser and then calls this
                            swipeRight();
                        }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },
    logo: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.8,
    },
    subInfo: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: '600',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerBookmark: {
        opacity: 0.9,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
    },

    // ── Category Tabs
    tabsContainer: {
        marginBottom: 16,
    },
    tabsContent: {
        paddingHorizontal: 24,
        gap: 12,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    tabActive: {
        backgroundColor: '#ffffff',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#888',
    },
    tabTextActive: {
        color: '#0a0a0f',
    },

    // ── Shared center states
    centerState: {
        alignItems: 'center',
        paddingHorizontal: 32,
        gap: 12,
    },

    // ── Loading
    loadingText: {
        fontSize: 15,
        color: '#888',
        marginTop: 12,
    },

    // ── Error state
    errorEmoji: {
        fontSize: 48,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 8,
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 50,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // ── All caught up state
    caughtUpEmoji: {
        fontSize: 56,
    },
    caughtUpTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 8,
        textAlign: 'center',
    },
    caughtUpSub: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    refreshButton: {
        marginTop: 12,
        borderWidth: 2,
        borderColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 50,
    },
    refreshText: {
        color: '#6366f1',
        fontWeight: '700',
        fontSize: 15,
    },
});
