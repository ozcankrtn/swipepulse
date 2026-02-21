import React, { useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    runOnJS,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import type { Article } from '../store/feedStore';
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from './SwipeCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// How far the card must travel (px) to trigger a swipe action
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
// Max rotation in degrees at full swipe
const MAX_ROTATION = 14;

// Spring physics — feels weighty but snappy
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
};
const SNAP_SPRING_CONFIG = {
    damping: 12,
    stiffness: 150,
    mass: 0.6,
    velocity: 30,
};

interface SwipeDeckProps {
    articles: Article[];
    currentIndex: number;
    onSwipeLeft: () => void;
    onSwipeRight: (article: Article) => void;
}

export default function SwipeDeck({
    articles,
    currentIndex,
    onSwipeLeft,
    onSwipeRight,
}: SwipeDeckProps) {
    // We render only the top 3 cards for performance
    const visibleCards = articles.slice(currentIndex, currentIndex + 3);

    if (visibleCards.length === 0) return null;

    return (
        <View style={styles.deckContainer}>
            {/*
             * Render in REVERSE so the top card is last in the tree
             * and appears visually on top (highest z-index)
             */}
            {visibleCards
                .slice()
                .reverse()
                .map((article, reversedIdx) => {
                    const stackIndex = visibleCards.length - 1 - reversedIdx;
                    const isTopCard = stackIndex === 0;

                    return isTopCard ? (
                        <DraggableCard
                            key={article.id}
                            article={article}
                            stackIndex={stackIndex}
                            onSwipeLeft={onSwipeLeft}
                            onSwipeRight={onSwipeRight}
                        />
                    ) : (
                        <StackedCard
                            key={article.id}
                            article={article}
                            stackIndex={stackIndex}
                        />
                    );
                })}
        </View>
    );
}

// ── StackedCard: static card behind the top card ─────────────────────────
interface StackedCardProps {
    article: Article;
    stackIndex: number;
}

function StackedCard({ article, stackIndex }: StackedCardProps) {
    // Cards behind slide down and shrink slightly to create depth
    const scale = 1 - stackIndex * 0.045;
    const translateY = stackIndex * 14;

    return (
        <View
            style={[
                styles.cardWrapper,
                {
                    transform: [{ scale }, { translateY }],
                    zIndex: -stackIndex,
                },
            ]}
            pointerEvents="none"
        >
            <SwipeCard article={article} stackIndex={stackIndex} />
        </View>
    );
}

// ── DraggableCard: top card with full gesture handling ───────────────────
interface DraggableCardProps {
    article: Article;
    stackIndex: number;
    onSwipeLeft: () => void;
    onSwipeRight: (article: Article) => void;
}

function DraggableCard({
    article,
    stackIndex,
    onSwipeLeft,
    onSwipeRight,
}: DraggableCardProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const isFlying = useRef(false);

    const openArticle = useCallback(
        async (a: Article) => {
            if (a.article_url) {
                await WebBrowser.openBrowserAsync(a.article_url, {
                    presentationStyle:
                        WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                    createTask: false,
                });
            }
            onSwipeRight(a);
        },
        [onSwipeRight],
    );

    const swipeOffLeft = useCallback(() => {
        isFlying.current = true;
        translateX.value = withSpring(
            -SCREEN_WIDTH * 1.5,
            SNAP_SPRING_CONFIG,
            () => runOnJS(onSwipeLeft)(),
        );
    }, [onSwipeLeft, translateX]);

    const swipeOffRight = useCallback(() => {
        isFlying.current = true;
        translateX.value = withSpring(
            SCREEN_WIDTH * 1.5,
            SNAP_SPRING_CONFIG,
            () => runOnJS(openArticle)(article),
        );
    }, [article, openArticle, translateX]);

    const snapBack = useCallback(() => {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
    }, [translateX, translateY]);

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            if (isFlying.current) return;
            translateX.value = e.translationX;
            translateY.value = e.translationY * 0.3; // subtle vertical drag
        })
        .onEnd((e) => {
            if (isFlying.current) return;
            const shouldSwipeLeft = e.translationX < -SWIPE_THRESHOLD;
            const shouldSwipeRight = e.translationX > SWIPE_THRESHOLD;

            if (shouldSwipeLeft) {
                runOnJS(swipeOffLeft)();
            } else if (shouldSwipeRight) {
                runOnJS(swipeOffRight)();
            } else {
                runOnJS(snapBack)();
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-MAX_ROTATION, 0, MAX_ROTATION],
            Extrapolation.CLAMP,
        );

        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    // LEFT indicator overlay (fades in as you drag left)
    const leftIndicatorStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [-SWIPE_THRESHOLD, -60, 0],
            [1, 0.5, 0],
            Extrapolation.CLAMP,
        );
        return { opacity };
    });

    // RIGHT indicator overlay (fades in as you drag right)
    const rightIndicatorStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            translateX.value,
            [0, 60, SWIPE_THRESHOLD],
            [0, 0.5, 1],
            Extrapolation.CLAMP,
        );
        return { opacity };
    });

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.cardWrapper, animatedStyle, { zIndex: 10 }]}>
                <SwipeCard article={article} stackIndex={stackIndex} />

                {/* LEFT swipe overlay */}
                <Animated.View
                    style={[styles.swipeOverlay, styles.leftOverlay, leftIndicatorStyle]}
                    pointerEvents="none"
                >
                    <Animated.Text style={styles.skipLabel}>SKIP</Animated.Text>
                </Animated.View>

                {/* RIGHT swipe overlay */}
                <Animated.View
                    style={[styles.swipeOverlay, styles.rightOverlay, rightIndicatorStyle]}
                    pointerEvents="none"
                >
                    <Animated.Text style={styles.readLabel}>READ</Animated.Text>
                </Animated.View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    deckContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardWrapper: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    swipeOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leftOverlay: {
        backgroundColor: 'rgba(239, 68, 68, 0.55)',
    },
    rightOverlay: {
        backgroundColor: 'rgba(34, 197, 94, 0.55)',
    },
    skipLabel: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    readLabel: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 4,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
});
