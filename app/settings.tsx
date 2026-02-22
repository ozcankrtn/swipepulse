import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Platform,
    ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Settings,
    Trash2,
    Bookmark,
    LayoutList,
    ShieldCheck,
    Info,
    UserCircle,
    LogOut
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useFeedStore } from '../store/feedStore';

const CATEGORY_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'news', label: 'News' },
    { id: 'culture', label: 'Culture' },
    { id: 'sport', label: 'Sport' },
    { id: 'technology', label: 'Technology' },
];

export default function SettingsScreen() {
    const router = useRouter();
    const {
        clearAllSeen,
        clearBookmarks,
        user,
        setUser,
        defaultCategory,
        setDefaultCategory
    } = useFeedStore();

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        setUser(null);
                    }
                }
            ]
        );
    };

    const handleCategoryPress = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', ...CATEGORY_OPTIONS.map(c => c.label)],
                    cancelButtonIndex: 0,
                    title: 'Default Category',
                    message: 'Select which category you see first on app start.'
                },
                (buttonIndex) => {
                    if (buttonIndex > 0) {
                        const selected = CATEGORY_OPTIONS[buttonIndex - 1].id as any;
                        setDefaultCategory(selected);
                    }
                }
            );
        } else {
            Alert.alert(
                'Default Category',
                'Select which category you see first on app start.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    ...CATEGORY_OPTIONS.map(c => ({
                        text: c.label,
                        onPress: () => setDefaultCategory(c.id as any)
                    }))
                ]
            );
        }
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear History',
            'Are you sure you want to clear your swipe history? This will make previously seen articles appear again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => {
                        clearAllSeen();
                        Alert.alert('Success', 'Swipe history cleared.');
                    }
                }
            ]
        );
    };

    const handleClearBookmarks = () => {
        Alert.alert(
            'Clear Bookmarks',
            'Are you sure you want to clear all your bookmarks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        await clearBookmarks();
                        Alert.alert('Success', 'Bookmarks cleared.');
                    }
                }
            ]
        );
    };

    const currentDefaultLabel = CATEGORY_OPTIONS.find(c => c.id === defaultCategory)?.label || 'News';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={28} color="#ffffff" />
                </Pressable>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PREFERENCES</Text>
                    <Pressable style={styles.row} onPress={handleCategoryPress}>
                        <View style={styles.rowLeft}>
                            <LayoutList size={22} color="#6366f1" />
                            <Text style={styles.rowLabel}>Default Category</Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={styles.valueText}>{currentDefaultLabel}</Text>
                            <ChevronRight size={20} color="#444" />
                        </View>
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DATA</Text>
                    <Pressable style={styles.row} onPress={handleClearHistory}>
                        <View style={styles.rowLeft}>
                            <Trash2 size={22} color="#ef4444" />
                            <Text style={styles.rowLabel}>Clear Swipe History</Text>
                        </View>
                        <ChevronRight size={20} color="#444" />
                    </Pressable>
                    <View style={styles.divider} />
                    <Pressable style={styles.row} onPress={handleClearBookmarks}>
                        <View style={styles.rowLeft}>
                            <Bookmark size={22} color="#ef4444" />
                            <Text style={styles.rowLabel}>Clear Bookmarks</Text>
                        </View>
                        <ChevronRight size={20} color="#444" />
                    </Pressable>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ABOUT</Text>
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Info size={22} color="#6366f1" />
                            <Text style={styles.rowLabel}>App Version</Text>
                        </View>
                        <Text style={styles.valueText}>1.0.0</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.privacySection}>
                        <View style={styles.rowLeft}>
                            <ShieldCheck size={22} color="#6366f1" />
                            <Text style={styles.rowLabel}>Data Privacy</Text>
                        </View>
                        <Text style={styles.privacyText}>
                            NewsSwipe does not collect personal data. Swipe interactions are stored anonymously.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    scrollContent: {
        paddingVertical: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginHorizontal: 24,
        marginBottom: 12,
        letterSpacing: 1.2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: '#111',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    rowLabel: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '500',
    },
    rowSublabel: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    valueText: {
        fontSize: 16,
        color: '#6366f1',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#1a1a1a',
        marginLeft: 64, // Align with text
    },
    privacySection: {
        paddingHorizontal: 24,
        paddingVertical: 18,
        backgroundColor: '#111',
        gap: 12,
    },
    privacyText: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
        marginLeft: 38,
    },
});
