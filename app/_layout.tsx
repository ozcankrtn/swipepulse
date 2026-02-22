import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => { });

export default function RootLayout() {
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    const [isReady, setIsReady] = useState(false);
    const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);

    useEffect(() => {
        async function checkOnboarding() {
            try {
                // For testing: reset onboarding
                await AsyncStorage.removeItem('newsswipe_onboarding_done');

                const done = await AsyncStorage.getItem('newsswipe_onboarding_done');
                setOnboardingStatus(done);
            } catch (e) {
                console.error('Failed to load onboarding status', e);
                setOnboardingStatus('false');
            } finally {
                setIsReady(true);
            }
        }

        checkOnboarding();
    }, []);

    useEffect(() => {
        // Wait until navigation state is initialized and we have checked AsyncStorage
        if (!isReady || !rootNavigationState?.key) return;

        if (onboardingStatus === 'true') {
            router.replace('/');
        } else {
            router.replace('/onboarding');
        }

        // Hide splash screen once we've decided where to route
        SplashScreen.hideAsync().catch(() => { });

    }, [isReady, onboardingStatus, rootNavigationState?.key, router]);

    return (
        <GestureHandlerRootView style={styles.root}>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
});
