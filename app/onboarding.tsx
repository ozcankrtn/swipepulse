import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Slides Components ──────────────────────────────────────────────────────

const Slide1Visual = () => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withSequence(
                withTiming(-3, { duration: 2000 }),
                withTiming(3, { duration: 2000 })
            ),
            -1,
            true
        );
    }, [rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotateZ: `${rotation.value}deg` }],
    }));

    return (
        <View style={visualStyles.slideContainer}>
            <View style={visualStyles.stackWrapper}>
                {/* Background Cards */}
                <View style={[visualStyles.mockCard, visualStyles.cardUnder, { transform: [{ rotate: '-6deg' }, { translateY: -10 }] }]} />
                <View style={[visualStyles.mockCard, visualStyles.cardUnder, { transform: [{ rotate: '4deg' }, { translateY: -5 }] }]} />

                {/* Main Card */}
                <Animated.View style={[visualStyles.mockCard, visualStyles.cardMain, animatedStyle]}>
                    <LinearGradient
                        colors={['#222', '#000']}
                        style={visualStyles.cardGradient}
                    >
                        <LinearGradient
                            colors={['rgba(79, 195, 247, 0.2)', 'transparent']}
                            style={visualStyles.imagePlaceholder}
                        />
                        <View style={visualStyles.cardTextContent}>
                            <View style={visualStyles.sourceRow}>
                                <View style={visualStyles.sourceCircle} />
                                <Text style={visualStyles.sourceText}>Reuters</Text>
                            </View>
                            <Text style={visualStyles.cardHeadline}>Breaking: Markets hit all-time high</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </View>
    );
};

const Slide2Visual = () => {
    const translateX = useSharedValue(0);
    const opacityLeft = useSharedValue(0);
    const opacityRight = useSharedValue(0);

    useEffect(() => {
        translateX.value = withRepeat(
            withSequence(
                // Swipe Left
                withDelay(500, withTiming(-100, { duration: 800 })),
                withTiming(0, { duration: 400 }),
                // Swipe Right
                withDelay(500, withTiming(100, { duration: 800 })),
                withTiming(0, { duration: 400 })
            ),
            -1,
            false
        );
    }, [translateX]);

    const cardStyle = useAnimatedStyle(() => {
        const rotation = (translateX.value / 100) * -10;
        return {
            transform: [
                { translateX: translateX.value },
                { rotate: `${rotation}deg` }
            ],
        };
    });

    const leftOverlayStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? Math.min(Math.abs(translateX.value) / 50, 0.8) : 0,
    }));

    const rightOverlayStyle = useAnimatedStyle(() => ({
        opacity: translateX.value > 0 ? Math.min(translateX.value / 50, 0.8) : 0,
    }));

    return (
        <View style={visualStyles.slideContainer}>
            <View style={visualStyles.demoCardWrapper}>
                <Animated.View style={[visualStyles.mockCard, visualStyles.cardMain, cardStyle]}>
                    <LinearGradient
                        colors={['#222', '#000']}
                        style={visualStyles.cardGradient}
                    >
                        <View style={visualStyles.demoContent}>
                            <View style={visualStyles.demoLine} />
                            <View style={[visualStyles.demoLine, { width: '60%' }]} />
                        </View>

                        {/* LEFT Overlay (Skip) */}
                        <Animated.View style={[visualStyles.overlay, { backgroundColor: '#ef4444' }, leftOverlayStyle]}>
                            <X color="white" size={40} strokeWidth={3} />
                        </Animated.View>

                        {/* RIGHT Overlay (Like) */}
                        <Animated.View style={[visualStyles.overlay, { backgroundColor: '#22c55e' }, rightOverlayStyle]}>
                            <Check color="white" size={40} strokeWidth={3} />
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </View>
    );
};

const Slide3Visual = () => {
    const categories = [
        { label: 'News', color: '#3b82f6' },
        { label: 'Culture', color: '#a855f7' },
        { label: 'Sport', color: '#22c55e' },
        { label: 'Technology', color: '#f59e0b' },
    ];

    return (
        <View style={visualStyles.slideContainer}>
            <View style={visualStyles.slide3Wrapper}>
                <View style={visualStyles.pillsGrid}>
                    {categories.map((cat, i) => (
                        <Animated.View
                            key={cat.label}
                            entering={FadeInDown.delay(i * 100).duration(600)}
                            style={[visualStyles.pill, { backgroundColor: cat.color }]}
                        >
                            <Text style={visualStyles.pillText}>{cat.label}</Text>
                        </Animated.View>
                    ))}
                </View>
                <Animated.View
                    entering={FadeInDown.delay(600).duration(800)}
                    style={visualStyles.statContainer}
                >
                    <Text style={visualStyles.statText}>2,400+ sources. Updated hourly.</Text>
                </Animated.View>
            </View>
        </View>
    );
};

// ── Main Screen ────────────────────────────────────────────────────────────

const SLIDES = [
    {
        id: 1,
        hook: "5 MINUTES. THE WHOLE WORLD.",
        title: "News That Moves\nAs Fast As You Do",
        subtitle: "No endless scrolling. No noise. Just the stories that matter, one swipe at a time.",
        visual: <Slide1Visual />,
    },
    {
        id: 2,
        hook: "SWIPE LEFT. SWIPE RIGHT.",
        title: "You're in Control",
        subtitle: "Skip what bores you. Read what excites you. The more you swipe, the smarter your feed gets.",
        visual: <Slide2Visual />,
    },
    {
        id: 3,
        hook: "YOUR WORLD. YOUR RULES.",
        title: "Pick Your Universe",
        subtitle: "From breaking news to tech breakthroughs — filter your world in one tap.",
        visual: <Slide3Visual />,
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = async () => {
        if (activeIndex < SLIDES.length - 1) {
            setActiveIndex(activeIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem('onboarding_done', 'true');
            router.replace('/');
        } catch (e) {
            console.error('Failed to save onboarding status', e);
        }
    };

    const currentSlide = SLIDES[activeIndex];

    return (
        <View style={styles.container}>
            {/* Top Bar */}
            <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={handleComplete} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </Pressable>
            </View>

            {/* Content area: Visuals and Text */}
            <View style={styles.content}>
                {/* Visual Area */}
                <View style={styles.visualWrapper}>
                    {SLIDES.map((slide, index) => (
                        index === activeIndex && (
                            <Animated.View
                                key={slide.id}
                                entering={FadeIn.duration(600)}
                                style={StyleSheet.absoluteFill}
                            >
                                {slide.visual}
                            </Animated.View>
                        )
                    ))}
                </View>

                {/* Text Area */}
                <View style={styles.textWrapper}>
                    <Animated.Text
                        key={`hook-${activeIndex}`}
                        entering={FadeInDown.duration(600)}
                        style={styles.hook}
                    >
                        {currentSlide.hook}
                    </Animated.Text>
                    <Animated.Text
                        key={`title-${activeIndex}`}
                        entering={FadeInDown.delay(100).duration(600)}
                        style={styles.title}
                    >
                        {currentSlide.title}
                    </Animated.Text>
                    <Animated.Text
                        key={`subtitle-${activeIndex}`}
                        entering={FadeInDown.delay(200).duration(600)}
                        style={styles.subtitle}
                    >
                        {currentSlide.subtitle}
                    </Animated.Text>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
                <View style={styles.dotsContainer}>
                    {SLIDES.map((_, i) => {
                        const isActive = i === activeIndex;
                        return (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    isActive && styles.dotActive
                                ]}
                            />
                        );
                    })}
                </View>

                <Pressable style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    visualWrapper: {
        height: 320,
        marginBottom: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textWrapper: {
        alignItems: 'flex-start',
    },
    hook: {
        fontSize: 11,
        letterSpacing: 3,
        fontWeight: '700',
        color: '#4FC3F7',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: -1,
        marginBottom: 16,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        lineHeight: 22,
    },
    footer: {
        paddingHorizontal: 32,
        gap: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        width: 24,
        backgroundColor: '#ffffff',
    },
    nextButton: {
        backgroundColor: '#ffffff',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    nextButtonText: {
        color: '#0a0a0a',
        fontSize: 18,
        fontWeight: '700',
    },
});

const visualStyles = StyleSheet.create({
    slideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stackWrapper: {
        width: 180,
        height: 260,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mockCard: {
        width: 180,
        height: 260,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'absolute',
    },
    cardMain: {
        backgroundColor: '#111',
        zIndex: 5,
    },
    cardUnder: {
        backgroundColor: '#0a0a0a',
        borderColor: 'rgba(255,255,255,0.05)',
        zIndex: 1,
    },
    cardGradient: {
        flex: 1,
    },
    imagePlaceholder: {
        width: '100%',
        height: '50%',
        backgroundColor: '#111',
    },
    cardTextContent: {
        padding: 12,
        flex: 1,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    sourceCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4FC3F7',
    },
    sourceText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '600',
    },
    cardHeadline: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 20,
    },
    demoCardWrapper: {
        width: 180,
        height: 260,
    },
    demoContent: {
        padding: 16,
        gap: 8,
        marginTop: 100,
    },
    demoLine: {
        height: 8,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    slide3Wrapper: {
        alignItems: 'center',
        width: '100%',
    },
    pillsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
    },
    pillText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 13,
    },
    statContainer: {
        marginTop: 32,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statText: {
        color: '#4FC3F7',
        fontSize: 14,
        fontWeight: '600',
    },
});
