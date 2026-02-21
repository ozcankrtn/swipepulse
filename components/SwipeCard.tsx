import React, { memo } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    ImageBackground,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bookmark } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFeedStore, type Article } from '../store/feedStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CARD_WIDTH = SCREEN_WIDTH - 32;
export const CARD_HEIGHT = SCREEN_HEIGHT * 0.72;

// Category badge color map
const CATEGORY_COLORS: Record<string, string> = {
    news: '#E53935',
    culture: '#8E24AA',
    sport: '#1E88E5',
    technology: '#00ACC1',
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
                        colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.92)']}
                        locations={[0.2, 0.55, 1]}
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
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.categoryText}>
                        {article.category.toUpperCase()}
                    </Text>
                </View>
            )}

            {/* Title */}
            <Text style={styles.title} numberOfLines={4}>
                {article.title}
            </Text>

            {/* Source row */}
            <View style={styles.sourceRow}>
                {article.source_logo_url ? (
                    <Image
                        source={{ uri: article.source_logo_url }}
                        style={styles.sourceLogo}
                    />
                ) : null}
                <Text style={styles.sourceName} numberOfLines={1}>
                    {article.source_name ?? 'Unknown Source'}
                </Text>
                {formattedDate && (
                    <Text style={styles.dateText}>{formattedDate}</Text>
                )}
            </View>

            {/* Hint label */}
            <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>← Skip  ·  Read →</Text>
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
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
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
        paddingBottom: 28,
        gap: 10,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1.2,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#ffffff',
        lineHeight: 30,
        letterSpacing: -0.3,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sourceLogo: {
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    sourceName: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
        flex: 1,
    },
    dateText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
    swipeHint: {
        alignSelf: 'center',
        marginTop: 4,
    },
    swipeHintText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 0.5,
    },
});

export default memo(SwipeCard);
