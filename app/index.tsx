import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar,
    ScrollView,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useFeedStore, type Article } from '../store/feedStore';
import SwipeDeck from '../components/SwipeDeck';
import { CARD_WIDTH, CARD_HEIGHT } from '../components/SwipeCard';
import { useRouter } from 'expo-router';
import { Bookmark, Settings, Flame, WifiOff, AlertCircle } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import SkeletonCard from '../components/SkeletonCard';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const CATEGORIES = [
    { id: 'all', label: 'All' },
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
        .eq('is_active', true);

    if (category !== 'all') {
        query = query.eq('category', category);
    }

    query = query
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
    const { isConnected, isInternetReachable } = useNetworkStatus();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { articles, currentIndex, isLoading, error, setArticles, setLoading, setError, swipeLeft, swipeRight, reset, currentCategory, setCategory, clearSeenForCategory, initialize } =
        useFeedStore();

    const isOffline = isConnected === false;

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
        initialize();
    }, [initialize]);

    const isDeckEmpty = !isLoading && articles.length > 0 && currentIndex >= articles.length;
    const hasArticles = articles.length > 0;

    useEffect(() => {
        loadFeed();
    }, [currentCategory, loadFeed]);

    // Automatically retry when connection restored
    useEffect(() => {
        if (isConnected && error === 'Network request failed') {
            loadFeed();
        }
    }, [isConnected, loadFeed, error]);

    const progress = useSharedValue(0);

    useEffect(() => {
        // Reset progress immediately when category changes
        progress.value = 0;
    }, [currentCategory, progress]);

    useEffect(() => {
        if (articles.length > 0) {
            const target = isDeckEmpty ? 100 : (currentIndex / articles.length) * 100;
            progress.value = withTiming(target, { duration: 300 });
        } else if (isDeckEmpty) {
            progress.value = withTiming(100, { duration: 300 });
        } else {
            progress.value = 0;
        }
    }, [currentIndex, articles.length, isDeckEmpty, progress]);

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const remainingArticles = articles.slice(currentIndex);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* ── Header with Blur effect ── */}
            <View style={styles.headerWrapper}>
                <BlurView
                    intensity={95}
                    tint="dark"
                    style={[styles.blurHeader, { paddingTop: insets.top }]}
                >
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Pressable
                                style={styles.headerIcon}
                                onPress={() => router.push('/settings')}
                            >
                                <Settings size={22} color="#ffffff" strokeWidth={2} />
                            </Pressable>
                            <Pressable
                                style={styles.headerIcon}
                                onPress={() => router.push('/trending')}
                            >
                                <Flame size={22} color="#ffffff" strokeWidth={2} />
                            </Pressable>
                        </View>
                        <Text style={styles.logo}>NewsSwipe</Text>
                        <View style={styles.headerRight}>
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

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                        <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
                    </View>
                </BlurView>
                <LinearGradient
                    colors={['rgba(0,0,0,0.8)', 'transparent']}
                    style={styles.headerGradient}
                />
            </View>

            {/* ── Content area ── */}
            <View style={styles.content}>

                {/* Loading */}
                {isLoading && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        exiting={FadeOut.duration(300)}
                        style={styles.deckContainer}
                    >
                        <View style={styles.skeletonStack}>
                            {/* Background card */}
                            <View style={[styles.skeletonWrapper, { transform: [{ scale: 0.955 }, { translateY: 14 }], opacity: 0.5 }]}>
                                <SkeletonCard />
                            </View>
                            {/* Foreground card */}
                            <View style={styles.skeletonWrapper}>
                                <SkeletonCard />
                            </View>
                        </View>
                        <Text style={styles.loadingText}>Fetching your feed…</Text>
                    </Animated.View>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <View style={styles.centerState}>
                        <View style={styles.errorCard}>
                            <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />
                            <Text style={styles.errorTitle}>Couldn't load news</Text>
                            <Text style={styles.errorMessage}>Something went wrong. Please try again.</Text>
                            <Pressable
                                style={styles.retryButton}
                                onPress={loadFeed}
                            >
                                <Text style={styles.retryText}>Try Again</Text>
                            </Pressable>
                        </View>
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
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        style={styles.deckContainer}
                    >
                        <SwipeDeck
                            articles={articles}
                            currentIndex={currentIndex}
                            onSwipeLeft={swipeLeft}
                            onSwipeRight={(article) => {
                                // onSwipeRight internally opens the browser and then calls this
                                swipeRight();
                            }}
                        />
                    </Animated.View>
                )}
            </View>

            {/* ── Offline Overlay ── */}
            {isOffline && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={[StyleSheet.absoluteFill, styles.offlineOverlay]}
                >
                    <View style={styles.offlineContent}>
                        <WifiOff size={64} color="#ffffff" strokeWidth={1.5} />
                        <Text style={styles.offlineTitle}>No Internet Connection</Text>
                        <Text style={styles.offlineSubtext}>Check your connection and try again</Text>
                        <Pressable
                            style={styles.offlineRetryButton}
                            onPress={loadFeed}
                        >
                            <Text style={styles.offlineRetryText}>Retry</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            )}
        </View>
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
        paddingTop: 12,
        paddingBottom: 16,
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    blurHeader: {
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.3)', // Added a bit of transparency to allow blur to show through more clearly
    },
    headerGradient: {
        height: 20,
    },
    logo: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -0.8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    progressBarContainer: {
        height: 2,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffffff',
    },
    headerBookmark: {
        opacity: 0.9,
    },
    headerIcon: {
        opacity: 0.9,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 32,
        paddingTop: 140, // Changed from marginTop to allow blur depth
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

    // ── Deck container for centered cards
    deckContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    skeletonStack: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT + 20, // Plus some room for the stack offset
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    skeletonWrapper: {
        position: 'absolute',
    },

    // ── Loading
    loadingText: {
        fontSize: 15,
        color: '#888',
        marginTop: 24,
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
        marginTop: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    errorCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        width: CARD_WIDTH,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },

    // ── Offline Overlay
    offlineOverlay: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    offlineContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    offlineTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        marginTop: 24,
    },
    offlineSubtext: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    offlineRetryButton: {
        marginTop: 32,
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 50,
    },
    offlineRetryText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 16,
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
