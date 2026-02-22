import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_WIDTH, CARD_HEIGHT } from './SwipeCard';

const SkeletonCard = () => {
    const shimmerProgress = useSharedValue(0);

    useEffect(() => {
        shimmerProgress.value = withRepeat(
            withTiming(1, { duration: 1200 }),
            -1,
            false // Do not reverse, restart from 0
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmerProgress.value,
            [0, 1],
            [-CARD_WIDTH, CARD_WIDTH]
        );
        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View style={styles.card}>
            {/* Base Image Placeholder (Full bleed) */}
            <View style={styles.baseContent}>
                <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
                    <LinearGradient
                        colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                {/* Overlays to create the specific layout shapes */}
                <View style={styles.contentArea}>
                    {/* Category pill placeholder */}
                    <View style={styles.pill} />

                    {/* Title lines */}
                    <View style={[styles.line, { width: '90%' }]} />
                    <View style={[styles.line, { width: '60%' }]} />

                    <View style={styles.spacer} />

                    {/* Source line */}
                    <View style={[styles.line, { width: '40%', height: 12 }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    baseContent: {
        flex: 1,
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        width: CARD_WIDTH,
    },
    contentArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
    },
    pill: {
        width: 80,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    line: {
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    spacer: {
        height: 8,
    },
});

export default SkeletonCard;
