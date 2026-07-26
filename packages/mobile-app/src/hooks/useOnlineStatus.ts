import { useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return unsubscribe;
  }, []);

  return isOnline;
}
