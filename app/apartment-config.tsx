import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Home, Users } from 'lucide-react-native';

export default function ApartmentConfigScreen() {
  const [roomCode, setRoomCode] = useState('');
  const [roomCodeError, setRoomCodeError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { user, apartmentId, createApartment, joinApartment, isInitialized, switchApartment } = useAuthStore();
  const { action } = useLocalSearchParams<{ action?: string }>();
  
  // Allow access if user is creating/joining additional apartments
  const allowAccess = action === 'create' || action === 'join' || !apartmentId;
  
  useEffect(() => {
    if (isInitialized) {
      if (!user) {
        router.replace('/(auth)');
      } else if (apartmentId && !allowAccess) {
        router.replace('/(tabs)');
      }
    }
  }, [user, apartmentId, isInitialized, allowAccess]);
  
  const handleCreateApartment = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an apartment');
      return;
    }
    
    setIsCreating(true);
    setErrorMessage(null);
    
    try {
      console.log('Starting apartment creation...');
      const result = await createApartment();
      console.log('Apartment creation result:', result);
      
      Alert.alert(
        'Apartment Created!',
        `Your apartment has been created successfully. Share this code with your roommate: ${result.roomCode}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // If user already had an apartment, switch to the new one
              if (apartmentId && action) {
                switchApartment(result.apartmentId, result.roomCode, 'My Apartment');
              }
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error: unknown) {
      console.error('Create apartment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create apartment. Please try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      setErrorMessage(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };
  
  const validateRoomCode = () => {
    if (!roomCode) {
      setRoomCodeError('Room code is required');
      return false;
    }
    
    // Basic validation for the format XXX-XXX or existing codes
    if (roomCode.length < 3) {
      setRoomCodeError('Room code is too short');
      return false;
    }
    
    setRoomCodeError('');
    return true;
  };
  
  const handleJoinApartment = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join an apartment');
      return;
    }
    
    if (!validateRoomCode()) {
      return;
    }
    
    setIsJoining(true);
    setErrorMessage(null);
    
    try {
      const newApartmentId = await joinApartment(roomCode);
      Alert.alert(
        'Joined Apartment!',
        'You have successfully joined the apartment.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join apartment. Please check the room code and try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
      setErrorMessage(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };
  
  // Show loading while Supabase initializes
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }
  
  const getTitle = () => {
    if (action === 'create') return 'Create New Apartment';
    if (action === 'join') return 'Join Another Apartment';
    return 'Apartment Configuration';
  };
  
  const getSubtitle = () => {
    if (action === 'create') return 'Create a new apartment to manage';
    if (action === 'join') return 'Join an existing apartment with a room code';
    return 'Create or join an apartment to continue';
  };
  
  return (
    <>
      <Stack.Screen options={{ title: getTitle(), headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
            <Text style={styles.brandText}>J.A.B.V Labs</Text>
          </View>
          
          <View style={styles.cardsContainer}>
            {(!action || action === 'create') && (
              <Card style={styles.card} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <View style={[styles.cardIcon, styles.createIcon]}>
                    <Home size={32} color="#FFFFFF" />
                  </View>
                </View>
                
                <Text style={styles.cardTitle}>Create Apartment</Text>
                <Text style={styles.cardDescription}>
                  Create a new apartment and invite your roommate to join using the generated code.
                </Text>
                
                <Button
                  title="Create Apartment"
                  onPress={handleCreateApartment}
                  loading={isCreating}
                  style={styles.cardButton}
                  fullWidth
                />
              </Card>
            )}
            
            {(!action || action === 'join') && (
              <Card style={styles.card} variant="elevated">
                <View style={styles.cardIconContainer}>
                  <View style={[styles.cardIcon, styles.joinIcon]}>
                    <Users size={32} color="#FFFFFF" />
                  </View>
                </View>
                
                <Text style={styles.cardTitle}>Join Apartment</Text>
                <Text style={styles.cardDescription}>
                  Join an existing apartment using the code provided by your roommate.
                </Text>
                
                <Input
                  label="Room Code"
                  placeholder="Enter room code (e.g., ABC-DEF)"
                  value={roomCode}
                  onChangeText={setRoomCode}
                  error={roomCodeError}
                  autoCapitalize="characters"
                />
                
                <Button
                  title="Join Apartment"
                  onPress={handleJoinApartment}
                  loading={isJoining}
                  style={styles.cardButton}
                  fullWidth
                />
              </Card>
            )}
          </View>
          
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by J.A.B.V Labs</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  brandText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 8,
  },
  cardsContainer: {
    flex: 1,
    gap: 24,
  },
  card: {
    padding: 24,
    marginBottom: 24,
  },
  cardIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createIcon: {
    backgroundColor: colors.primary,
  },
  joinIcon: {
    backgroundColor: colors.secondary,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  cardButton: {
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});