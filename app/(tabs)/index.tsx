import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { user } = useAuthStore();

  return (
    <View>
      <Avatar 
        source={user?.photoURL} 
        name={user?.displayName || user?.email} 
        size={isTablet ? "large" : "medium"} 
      />
    </View>
  );
}