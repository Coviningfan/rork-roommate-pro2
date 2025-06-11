import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { user, apartmentId, login, isLoading, isInitialized, error, clearError } = useAuthStore();
  
  // Initialize auth when component mounts
  useEffect(() => {
    const { initializeAuth } = useAuthStore.getState();
    initializeAuth();
  }, []);
  
  useEffect(() => {
    if (isInitialized && user) {
      console.log('User logged in, redirecting...', { user: user.id, apartmentId });
      if (apartmentId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/apartment-config');
      }
    }
  }, [user, apartmentId, isInitialized]);
  
  useEffect(() => {
    if (error) {
      setLoginError(error);
      clearError();
    }
  }, [error]);
  
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
  
  const handleLogin = async () => {
    console.log('Login button pressed');
    
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
      console.log('Validation failed');
      return;
    }
    
    setLoginError(null);
    
    try {
      console.log('Attempting login...');
      await login(email, password);
      console.log('Login successful');
      // Navigation is handled in the useEffect
    } catch (error: any) {
      console.error('Login error in component:', error);
      setLoginError(error.message || 'Login failed');
    }
  };
  
  const handleRegister = () => {
    router.push('/(auth)/register');
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
          <Text style={styles.title}>RoomMate Pro</Text>
          <Text style={styles.subtitle}>Manage your roommate agreements with ease</Text>
          <Text style={styles.brandText}>J.A.B.V Labs</Text>
        </View>
        
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setLoginError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            required
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLoginError(null);
            }}
            secureTextEntry
            error={passwordError}
            required
          />
          
          {loginError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          )}
          
          <Button
            title="Log In"
            onPress={handleLogin}
            style={styles.loginButton}
            loading={isLoading}
            fullWidth
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerText}>Create Account</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
    marginBottom: 24,
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
  loginButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    marginRight: 4,
  },
  registerText: {
    color: colors.primary,
    fontWeight: '600',
  },
});