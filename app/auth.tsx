import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AuthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                // Supabase might send a confirmation email or log in automatically
                router.replace('/');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                router.replace('/');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />

                {/* Background Gradient */}
                <LinearGradient
                    colors={['#1a1a1a', '#0a0a0a']}
                    style={StyleSheet.absoluteFill}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={[styles.innerContent, { paddingTop: insets.top + 40 }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.logoText}>NewsSwipe</Text>
                            <Text style={styles.tagline}>Stay informed, one swipe at a time.</Text>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabsContainer}>
                            <Pressable
                                style={[styles.tab, mode === 'signin' && styles.activeTab]}
                                onPress={() => {
                                    setMode('signin');
                                    setError(null);
                                }}
                            >
                                <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                                    Sign In
                                </Text>
                                {mode === 'signin' && <View style={styles.activeIndicator} />}
                            </Pressable>
                            <Pressable
                                style={[styles.tab, mode === 'signup' && styles.activeTab]}
                                onPress={() => {
                                    setMode('signup');
                                    setError(null);
                                }}
                            >
                                <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                                    Create Account
                                </Text>
                                {mode === 'signup' && <View style={styles.activeIndicator} />}
                            </Pressable>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor="#666"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#666"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <Pressable
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.buttonText}>
                                            {mode === 'signin' ? 'Continue' : 'Create Account'}
                                        </Text>
                                        <ChevronRight size={20} color="#000" />
                                    </>
                                )}
                            </Pressable>
                        </View>

                        {/* Footer */}
                        <Pressable
                            style={styles.skipButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.skipText}>Skip for now</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
    },
    innerContent: {
        flex: 1,
        paddingHorizontal: 32,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 16,
        color: '#888',
        marginTop: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 32,
        gap: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTab: {
        // No background for active tab in this design, just text color and indicator
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#ffffff',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 3,
        width: 24,
        backgroundColor: '#ffffff',
        borderRadius: 2,
    },
    form: {
        width: '100%',
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        height: 60,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputIcon: {
        marginRight: 16,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#ffffff',
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000000',
        fontSize: 18,
        fontWeight: '700',
    },
    skipButton: {
        marginTop: 'auto',
        marginBottom: 40,
        paddingVertical: 8,
    },
    skipText: {
        color: '#888',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
});
