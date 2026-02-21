import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    StatusBar,
    Animated,
} from 'react-native';
import { Bookmark, Trash2 } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useFeedStore, type Article } from '../store/feedStore';
import { Stack, useRouter } from 'expo-router';

export default function BookmarksScreen() {
    const bookmarks = useFeedStore((state) => state.bookmarks);
    const toggleBookmark = useFeedStore((state) => state.toggleBookmark);
    const router = useRouter();

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

    const renderRightActions = (progress: any, dragX: any, article: Article) => {
        const trans = dragX.interpolate({
            inputRange: [-100, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <Pressable
                style={styles.deleteAction}
                onPress={() => toggleBookmark(article)}
            >
                <Animated.View style={[styles.deleteIconContainer, { transform: [{ scale: trans }] }]}>
                    <Trash2 size={24} color="#ffffff" />
                    <Text style={styles.deleteText}>Remove</Text>
                </Animated.View>
            </Pressable>
        );
    };

    const renderItem = ({ item }: { item: Article }) => {
        return (
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
                rightThreshold={40}
                containerStyle={styles.swipeableContainer}
            >
                <Pressable
                    style={styles.row}
                    onPress={() => openArticle(item.article_url)}
                >
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
                        <View style={styles.metadata}>
                            <Text style={styles.sourceName} numberOfLines={1}>
                                {item.source_name ?? 'Unknown Source'}
                            </Text>
                            {item.published_at && (
                                <Text style={styles.date}>
                                    {formatRelativeDate(item.published_at)}
                                </Text>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Swipeable>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Saved',
                    headerStyle: { backgroundColor: '#0a0a0f' },
                    headerTintColor: '#ffffff',
                    headerShadowVisible: false,
                    headerBackTitle: '',
                }}
            />
            <StatusBar barStyle="light-content" />

            {bookmarks.length === 0 ? (
                <View style={styles.emptyState}>
                    <Bookmark size={64} color="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <Text style={styles.emptyTitle}>No saved articles yet</Text>
                    <Text style={styles.emptySub}>
                        Tap the bookmark icon on any article to save it for later.
                    </Text>
                    <Pressable style={styles.exploreButton} onPress={() => router.back()}>
                        <Text style={styles.exploreButtonText}>Explore Feed</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatRelativeDate(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0f',
    },
    listContent: {
        paddingVertical: 12,
    },
    swipeableContainer: {
        backgroundColor: '#E53935', // red background behind row when swiping
    },
    row: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#0a0a0f',
        alignItems: 'center',
        gap: 16,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 12,
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
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 20,
    },
    metadata: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sourceName: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
        flex: 1,
    },
    date: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginLeft: 96, // align with text content (20 padding + 60 image + 16 gap)
    },
    deleteAction: {
        width: 90,
        backgroundColor: '#E53935',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    deleteText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Empty state
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 16,
        marginBottom: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#ffffff',
        marginTop: 8,
    },
    emptySub: {
        fontSize: 15,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    exploreButton: {
        marginTop: 16,
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 50,
    },
    exploreButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 15,
    },
});
