import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import auth from '@react-native-firebase/auth';

const Login = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const onAuthStateChanged = (user) => {
    setUser(user);
    if (initializing) setInitializing(false);
    
    if (user) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Notes' }],
      });
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: '775315190752-0f3p7rjjtj786rtrgnfsf16ftllk69de.apps.googleusercontent.com',
      offlineAccess: false,
      forceCodeForRefreshToken: false,
      accountName: '',
      iosClientId: '',
    });

    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }
    
    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Lỗi đăng nhập email:', error);
      Alert.alert('Lỗi đăng nhập', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng ký');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }
    
    try {
      setLoading(true);
      await auth().createUserWithEmailAndPassword(email, password);
      Alert.alert('Thành công', 'Tài khoản đã được tạo thành công');
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      Alert.alert('Lỗi đăng ký', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      const isPlayServicesAvailable = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      
      if (!isPlayServicesAvailable) {
        Alert.alert('Đăng nhập', 'Google Play Services không khả dụng');
        setLoading(false);
        return;
      }
      
      const signInResult = await GoogleSignin.signIn();
      
      const idToken = signInResult?.data?.idToken;
      
      if (!idToken) {
        console.error('Không tìm thấy idToken trong dữ liệu trả về');
        Alert.alert('Đăng nhập', 'Không thể lấy token xác thực từ Google');
        setLoading(false);
        return;
      }
      
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      await auth().signInWithCredential(googleCredential);
      
    } catch (error) {
      console.log('Lỗi đăng nhập:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Đăng nhập', 'Người dùng đã hủy đăng nhập');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Đăng nhập', 'Quá trình đăng nhập đang diễn ra');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Đăng nhập', 'Google Play Services không khả dụng');
      } else {
        const errorMessage = error.message || 'Có lỗi xảy ra khi đăng nhập';
        Alert.alert('Đăng nhập', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Quên mật khẩu', 'Chức năng đang phát triển');
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>{isRegister ? "Create Account" : "Taking - Note"}</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username, Email & Phone Number"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {isRegister ? null : (
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {isRegister && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={isRegister ? handleEmailRegister : handleEmailSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>
                {isRegister ? "Register" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchModeButton}
            onPress={() => {
              setIsRegister(!isRegister);
              setPassword('');
              setConfirmPassword('');
            }}
          >
            <Text style={styles.switchModeText}>
              {isRegister ? "Already have an account? Sign In" : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
          
          {!isRegister && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>Or Sign In With</Text>
                <View style={styles.divider} />
              </View>
              
              <TouchableOpacity 
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
              >
                <Text style={styles.googleButtonIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    width: '85%',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 5,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: '#333',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#E667AF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#E667AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchModeButton: {
    marginTop: 15,
    alignSelf: 'center',
  },
  switchModeText: {
    color: '#E667AF',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 15,
    paddingHorizontal: 25,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  googleButtonIcon: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Login; 