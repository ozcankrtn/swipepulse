import React, { memo } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Pressable,
    Share,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFeedStore, type Article } from '../store/feedStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CARD_WIDTH = SCREEN_WIDTH * 0.92;
export const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

// Category badge color map
const CATEGORY_COLORS: Record<string, string> = {
    news: '#4FC3F7',
    culture: '#CE93D8',
    sport: '#A5D6A7',
    technology: '#FFB74D',
};

interface SwipeCardProps {
    article: Article;
    /** Visual depth in stack: 0 = top, 1 = second, 2 = third */
    stackIndex: number;
}

function SwipeCard({ article, stackIndex }: SwipeCardProps) {
    const categoryColor =
        article.category ? (CATEGORY_COLORS[article.category] ?? '#555') : '#555';

    const isTopCard = stackIndex === 0;

    const isBookmarked = useFeedStore((state) => state.bookmarks.some((b) => b.id === article.id));
    const toggleBookmark = useFeedStore((state) => state.toggleBookmark);

    const handleBookmark = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleBookmark(article);
    };

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await Share.share({
                title: article.title,
                message: `${article.title}\n\n${article.article_url}`,
                ...(Platform.OS === 'ios' && article.article_url ? { url: article.article_url } : {}),
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <View style={[styles.card, isTopCard && styles.cardShadow]}>
            {article.image_url ? (
                <ImageBackground
                    source={{ uri: article.image_url }}
                    style={styles.image}
                    imageStyle={styles.imageRadius}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                        locations={[0, 0.35, 0.6, 1]}
                        style={styles.gradient}
                    >
                        <CardContent
                            article={article}
                            categoryColor={categoryColor}
                        />
                    </LinearGradient>
                </ImageBackground>
            ) : (
                /* Fallback when no image */
                <View style={[styles.image, styles.fallbackBg]}>
                    <LinearGradient
                        colors={['#1a1a2e', '#16213e', '#0f3460']}
                        style={styles.gradient}
                    >
                        <CardContent
                            article={article}
                            categoryColor={categoryColor}
                        />
                    </LinearGradient>
                </View>
            )}

            <Pressable style={styles.shareButton} onPress={handleShare}>
                <Share2 size={24} color="#ffffff" />
            </Pressable>

            <Pressable style={styles.bookmarkButton} onPress={handleBookmark}>
                <Bookmark
                    size={24}
                    color="#ffffff"
                    fill={isBookmarked ? "#ffffff" : "transparent"}
                />
            </Pressable>
        </View>
    );
}

// ── Sub-component: text & metadata area ──────────────────────────────────
interface CardContentProps {
    article: Article;
    categoryColor: string;
}

function CardContent({ article, categoryColor }: CardContentProps) {
    const formattedDate = article.published_at
        ? formatRelativeDate(article.published_at)
        : null;

    return (
        <View style={styles.contentArea}>
            {/* Category badge */}
            {article.category && (
                <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}33` }]}>
                    <Text style={[styles.categoryText, { color: categoryColor }]}>
                        {article.category.toUpperCase()}
                    </Text>
                </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={3}>
                {article.title}
            </Text>

            {/* Source row */}
            <View style={styles.sourceRow}>
                <View style={styles.sourceInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                    {article.source_logo_url ? (
                        <Image
                            source={{ uri: article.source_logo_url }}
                            style={styles.sourceLogo}
                        />
                    ) : null}
                    <Text style={styles.sourceName} numberOfLines={1}>
                        {article.source_name ?? 'Unknown Source'}
                    </Text>
                </View>
                {formattedDate && (
                    <Text style={styles.dateText}>{formattedDate}</Text>
                )}
            </View>
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
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
    },
    image: {
        flex: 1,
    },
    imageRadius: {
        borderRadius: 24,
    },
    fallbackBg: {
        backgroundColor: '#1a1a2e',
    },
    shareButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    bookmarkButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    contentArea: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        gap: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 30,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sourceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    categoryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sourceLogo: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    sourceName: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: '500',
        opacity: 0.75,
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
});

export default memo(SwipeCard);
