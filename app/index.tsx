import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Pressable,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useFeedStore, type Article } from '../store/feedStore';
import SwipeDeck from '../components/SwipeDeck';

// ── Supabase fetch ────────────────────────────────────────────────────────
async function fetchArticles(): Promise<Article[]> {
    const { data, error } = await supabase
        .from('articles')
        .select(
            'id, title, image_url, article_url, source_name, source_logo_url, category, published_at, is_active',
        )
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(30);

    if (error) throw new Error(error.message);
    return (data ?? []) as Article[];
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const { articles, currentIndex, isLoading, error, setArticles, setLoading, setError, swipeLeft, swipeRight, reset } =
        useFeedStore();

    const loadFeed = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchArticles();
            setArticles(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [setArticles, setError, setLoading]);

    useEffect(() => {
        loadFeed();
    }, [loadFeed]);

    const isDeckEmpty = !isLoading && articles.length > 0 && currentIndex >= articles.length;
    const hasArticles = articles.length > 0;
    const remainingArticles = articles.slice(currentIndex);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.logo}>SwipePulse</Text>
                <Text style={styles.subInfo}>
                    {hasArticles && !isDeckEmpty
                        ? `${Math.max(0, articles.length - currentIndex)} left`
                        : ''}
                </Text>
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
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
