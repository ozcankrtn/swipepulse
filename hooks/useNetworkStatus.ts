import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
    const [status, setStatus] = useState<{
        isConnected: boolean | null;
        isInternetReachable: boolean | null;
    }>({
        isConnected: true,
        isInternetReachable: true,
    });

    useEffect(() => {
        // Initial check
        NetInfo.fetch().then((state: NetInfoState) => {
            setStatus({
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
            });
        });

        // Subscribe to updates
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            setStatus({
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return status;
};
