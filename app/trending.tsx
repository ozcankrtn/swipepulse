import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Flame, ChevronLeft, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

interface TrendingArticle {
    id: string;
    title: string;
    image_url: string;
    article_url: string;
    source_name: string;
    category: string;
    swipe_right_count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    news: '#4FC3F7',
    culture: '#CE93D8',
    sport: '#A5D6A7',
    technology: '#FFB74D',
};

export default function TrendingScreen() {
    const [articles, setArticles] = useState<TrendingArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchTrending = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('trending_articles')
                .select('*')
                .limit(20);

            if (error) throw error;
            setArticles((data ?? []) as TrendingArticle[]);
        } catch (err) {
            console.error('Error fetching trending:', err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchTrending();
    }, [fetchTrending]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchTrending();
    };

    const openArticle = async (url: string) => {
        try {
            await WebBrowser.openBrowserAsync(url, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                toolbarColor: '#0a0a0f',
            });
        } catch (e) {
            console.error('Failed to open browser:', e);
        }
    };

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.row}>
                    <View style={[styles.rankContainer, { opacity: 0.1 }]}>
                        <Text style={styles.rankText}>{i}</Text>
                    </View>
                    <View style={[styles.thumbnail, { backgroundColor: '#1a1a2e' }]} />
                    <View style={[styles.content, { gap: 8 }]}>
                        <View style={{ height: 14, width: '90%', backgroundColor: '#1a1a2e', borderRadius: 4 }} />
                        <View style={{ height: 14, width: '60%', backgroundColor: '#1a1a2e', borderRadius: 4 }} />
                        <View style={{ height: 12, width: '40%', backgroundColor: '#1a1a2e', borderRadius: 4, marginTop: 4 }} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderItem = ({ item, index }: { item: TrendingArticle; index: number }) => {
        const categoryColor = CATEGORY_COLORS[item.category] ?? '#555';

        return (
            <Pressable style={styles.row} onPress={() => openArticle(item.article_url)}>
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, styles.fallbackThumbnail]}>
                        <Text style={styles.fallbackThumbnailText}>
                            {item.source_name?.[0]?.toUpperCase() ?? '?'}
                        </Text>
                    </View>
                )}

                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.sourceInfo} numberOfLines={1}>
                            {item.source_name} · {item.swipe_right_count} reads
                        </Text>
                        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}33` }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>
                                {item.category.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Trending Now',
                    headerStyle: { backgroundColor: '#0a0a0f' },
                    headerTintColor: '#ffffff',
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} style={{ marginLeft: -8 }}>
                            <ChevronLeft size={28} color="#ffffff" />
                        </Pressable>
                    ),
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: '900',
                    }
                }}
            />
            <StatusBar barStyle="light-content" />

            {isLoading ? (
                renderSkeleton()
            ) : error ? (
                <View style={styles.centerState}>
                    <View style={styles.errorCard}>
                        <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />
                        <Text style={styles.errorTitle}>Couldn't load news</Text>
                        <Text style={styles.errorMessage}>Something went wrong. Please try again.</Text>
                        <Pressable
                            style={styles.retryButton}
                            onPress={fetchTrending}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={articles}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#6366f1"
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    listContent: {
        paddingVertical: 12,
    },
    row: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 16,
    },
    rankContainer: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#444455',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#1a1a2e',
    },
    fallbackThumbnail: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2a2a4a',
    },
    fallbackThumbnailText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        gap: 6,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 18,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    sourceInfo: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 20,
    },
    skeletonContainer: {
        flex: 1,
        paddingVertical: 12,
    },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    errorCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 16,
    },
    errorMessage: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
    },
    retryButton: {
        marginTop: 24,
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
});
