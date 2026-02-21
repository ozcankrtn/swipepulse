import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react-native';

export default function OnboardingScreen() {
    const router = useRouter();

    const handleGetStarted = async () => {
        try {
            await AsyncStorage.setItem('onboarding_done', 'true');
            router.replace('/');
        } catch (e) {
            console.error('Failed to save onboarding status', e);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>SwipePulse</Text>
                    <Text style={styles.tagline}>Swipe the news. Skip the noise.</Text>
                </View>

                <View style={styles.features}>
                    <View style={styles.featureRow}>
                        <ArrowLeft size={24} color="#ffffff" />
                        <Text style={styles.featureText}>Swipe left to skip</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <ArrowRight size={24} color="#ffffff" />
                        <Text style={styles.featureText}>Swipe right to read</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Layers size={24} color="#ffffff" />
                        <Text style={styles.featureText}>Categories to filter by topic</Text>
                    </View>
                </View>
            </View>

            <Pressable style={styles.button} onPress={handleGetStarted}>
                <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        padding: 24,
        paddingTop: 64,
        paddingBottom: 48,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 64,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    tagline: {
        fontSize: 18,
        color: '#a1a1aa',
        textAlign: 'center',
    },
    features: {
        gap: 32,
        paddingHorizontal: 16,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    featureText: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        shadowColor: '#ffffff',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonText: {
        color: '#0a0a0a',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
