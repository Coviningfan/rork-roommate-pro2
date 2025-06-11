import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView
} from 'react-native';
import { colors } from '@/constants/colors';
import { Users } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';

export default function GuestsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState
        title="Guest Requests"
        description="Guest request functionality coming soon"
        icon={<Users size={48} color={colors.textSecondary} />}
      />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by J.A.B.V Labs</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});