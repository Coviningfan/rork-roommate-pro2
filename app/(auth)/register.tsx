import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { user, apartmentId, register, isLoading, isInitialized, error, clearError } = useAuthStore();
  
  // Initialize auth when component mounts
  useEffect(() => {
    const { initializeAuth } = useAuthStore.getState();
    initializeAuth();
  }, []);
  
  useEffect(() => {
    if (isInitialized && user) {
      console.log('User registered and logged in, redirecting...', { user: user.id, apartmentId });
      if (apartmentId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/apartment-config');
      }
    }
  }, [user, apartmentId, isInitialized]);
  
  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    
    setPasswordError('');
    return true;
  };
  
  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    
    setConfirmPasswordError('');
    return true;
  };
  
  const handleRegister = async () => {
    console.log('Register button pressed');
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    
    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      console.log('Validation failed');
      return;
    }
    
    try {
      console.log('Attempting registration...');
      await register(email, password);
      console.log('Registration successful');
      
      // Show success message for registration
      Alert.alert(
        'Account Created Successfully!',
        'Please check your email to verify your account. Once verified, you can log in and set up your apartment.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Registration error in component:', error);
      
      // Show actual errors only for real errors, not email confirmation
      Alert.alert('Registration Error', error.message || 'Registration failed', [
        { text: 'OK', onPress: clearError }
      ]);
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
  
  return (
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join RoomMate Pro to manage your roommate agreements</Text>
          <Text style={styles.brandText}>J.A.B.V Labs</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            required
          />
          
          <Input
            label="Password"
            placeholder="Create a password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={passwordError}
            required
          />
          
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={confirmPasswordError}
            required
          />
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: 16,
  },
});