# VacancyRadar Tenant Mobile App - Complete Guide

## 📱 Overview

A complete **React Native mobile application** built with **Expo** for tenants to manage their rental experience. This app connects to the VacancyRadar backend API and provides a beautiful, intuitive interface for tenants.

## 🎯 Key Features

### ✅ Implemented Features

1. **Authentication System**
   - Tenant login
   - New tenant registration
   - Secure token-based auth
   - Auto-logout on token expiration
   - Persistent session (AsyncStorage)

2. **Dashboard/Home Screen**
   - Lease information overview
   - Next payment due
   - Quick action buttons
   - Open maintenance requests
   - Beautiful, card-based UI

3. **Payment Management**
   - Payment history
   - Upcoming payments
   - Payment status tracking
   - Pay now functionality
   - Payment summary stats

4. **Maintenance Requests**
   - View all requests
   - Filter by status (pending, in progress, completed)
   - Create new requests
   - Priority and category badges
   - Status tracking

5. **User Profile**
   - View profile information
   - Account settings
   - Logout functionality
   - Menu navigation

### 🎨 UI/UX Features

- **Beautiful Design** - Modern, clean interface
- **Smooth Navigation** - Tab-based + stack navigation
- **Responsive** - Works on all screen sizes
- **Custom Components** - Reusable Button, Input, Card components
- **Icons** - Ionicons throughout
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages
- **Pull to Refresh** - Refresh data on all screens

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Button.tsx          # Reusable button component
│   │       ├── Input.tsx           # Text input with validation
│   │       └── Card.tsx            # Card container
│   │
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx     # Login screen
│   │   │   └── RegisterScreen.tsx  # Registration screen
│   │   ├── home/
│   │   │   └── HomeScreen.tsx      # Dashboard
│   │   ├── payments/
│   │   │   └── PaymentsScreen.tsx  # Payment history
│   │   ├── maintenance/
│   │   │   └── MaintenanceScreen.tsx  # Maintenance requests
│   │   └── profile/
│   │       └── ProfileScreen.tsx   # User profile
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Navigation setup
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth state management
│   │
│   ├── config/
│   │   └── api.ts                  # API configuration & axios setup
│   │
│   ├── theme/
│   │   ├── colors.ts               # Color palette
│   │   └── theme.ts                # React Native Paper theme
│   │
│   └── types/
│       └── index.ts                # TypeScript interfaces
│
├── App.tsx                         # App entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── README.md                       # Full documentation
├── QUICKSTART.md                   # 5-minute setup guide
└── MOBILE_GUIDE.md                 # This file
```

## 🏗️ Architecture

### Navigation Structure

```
App
 └── AuthProvider (Context)
      ├── AuthStack (Not logged in)
      │    ├── LoginScreen
      │    └── RegisterScreen
      │
      └── TabNavigator (Logged in)
           ├── HomeScreen
           ├── PaymentsScreen
           ├── MaintenanceScreen
           └── ProfileScreen
```

### Data Flow

```
Component → API Call → Backend → Response → Update State → Re-render
```

### State Management

- **Local State** - useState for component-level state
- **Context** - AuthContext for global auth state
- **AsyncStorage** - Persistent token storage

## 🔧 Setup & Configuration

### 1. Installation

```bash
cd mobile
npm install
```

### 2. API Configuration

Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:5000/api'  // Development
  : 'https://your-api.com/api';      // Production
```

**Important:** Use your computer's local IP, NOT `localhost`!

### 3. Find Your Local IP

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

### 4. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with phone (must be on same WiFi)

## 📱 Screens Breakdown

### Authentication Screens

#### LoginScreen
- Email & password inputs
- Form validation
- Loading state
- Error handling
- Link to register

#### RegisterScreen
- Full registration form
- Password confirmation
- All field validation
- Link to login

### Main Screens

#### HomeScreen
- **Lease Card** - Unit info, lease end date, rent amount
- **Payment Card** - Next payment due, days remaining
- **Quick Actions** - 4 action cards (Payments, Maintenance, Documents, Profile)
- **Open Requests** - List of pending maintenance requests
- Pull to refresh

#### PaymentsScreen
- **Summary Card** - Total paid, pending amounts
- **Payment List** - All payments with status badges
- Filter by status
- "Pay Now" button for pending payments
- Color-coded status (paid=green, pending=yellow, late=red)

#### MaintenanceScreen
- **Filter Tabs** - All, Pending, In Progress, Completed
- **Request Cards** - Title, description, priority, status
- **FAB Button** - Create new request
- Color-coded priorities and statuses

#### ProfileScreen
- User info display
- Menu items list
- Logout button
- App version

## 🎨 Components

### Button Component

```typescript
<Button
  title="Login"
  onPress={handleLogin}
  variant="primary"        // primary | secondary | outline | text
  size="medium"           // small | medium | large
  loading={isLoading}
  disabled={false}
  fullWidth={true}
/>
```

### Input Component

```typescript
<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  leftIcon="mail"
  error={errors.email}
  isPassword={false}
/>
```

### Card Component

```typescript
<Card 
  onPress={() => navigate('Detail')}
  padding={16}
>
  {/* Content */}
</Card>
```

## 🔐 Authentication

### Login Flow

1. User enters email & password
2. `AuthContext.login()` called
3. API request to `/auth/login`
4. Token received
5. Token saved to AsyncStorage
6. User object saved to AsyncStorage
7. User state updated
8. Navigator switches to TabNavigator

### Token Management

- **Stored in AsyncStorage** - Persists across app restarts
- **Auto-attached** - Added to all API requests via interceptor
- **Auto-logout** - 401 responses clear token and log out

### Logout Flow

1. User clicks logout
2. Confirmation alert
3. `AuthContext.logout()` called
4. Token & user data cleared from AsyncStorage
5. User state set to null
6. Navigator switches to AuthStack

## 📡 API Integration

### API Setup (api.ts)

```typescript
// Axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear auth and logout
    }
    return Promise.reject(error);
  }
);
```

### Making API Calls

```typescript
// GET
const data = await api.get('/endpoint');

// POST
const result = await api.post('/endpoint', { data });

// PUT
await api.put('/endpoint/:id', { updates });

// DELETE
await api.delete('/endpoint/:id');
```

### Error Handling

```typescript
try {
  const response = await api.get('/data');
  setData(response.data);
} catch (error: any) {
  if (error.response) {
    // Server responded with error
    Alert.alert('Error', error.response.data.error);
  } else if (error.request) {
    // No response received
    Alert.alert('Network Error', 'Unable to connect to server');
  } else {
    // Other errors
    Alert.alert('Error', error.message);
  }
}
```

## 🎨 Theming

### Color Palette

Located in `src/theme/colors.ts`:

```typescript
export const colors = {
  primary: '#4F46E5',      // Indigo
  secondary: '#10B981',    // Green
  error: '#EF4444',        // Red
  warning: '#F59E0B',      // Amber
  success: '#10B981',      // Green
  info: '#3B82F6',         // Blue
  // ... more colors
};
```

### Customizing Theme

1. Edit colors in `src/theme/colors.ts`
2. Colors automatically apply throughout app
3. React Native Paper components use theme

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error shown)
- [ ] Register new user
- [ ] View dashboard
- [ ] Navigate all tabs
- [ ] View payment history
- [ ] View maintenance requests
- [ ] Filter maintenance requests
- [ ] Pull to refresh on all screens
- [ ] Logout
- [ ] Token persistence (close/reopen app)

### Test Data

If backend is seeded:
- Email: `demo@vacancyradar.com`
- Password: `demo123`

## 🚀 Building for Production

### iOS

```bash
# Configure
eas build:configure

# Build
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## 📦 Dependencies

### Core
- `expo` - Expo framework
- `react-native` - React Native
- `react-navigation` - Navigation
- `react-native-paper` - UI components

### State Management
- `@react-native-async-storage/async-storage` - Local storage

### API
- `axios` - HTTP client

### UI
- `@expo/vector-icons` - Icons
- `react-native-gesture-handler` - Touch gestures
- `react-native-reanimated` - Animations

### Utilities
- `date-fns` - Date formatting

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Push notifications
- [ ] Photo upload for maintenance requests
- [ ] Document viewer
- [ ] In-app chat with landlord
- [ ] Payment gateway integration
- [ ] Receipt downloads

### Phase 3 Features
- [ ] Dark mode
- [ ] Biometric authentication
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Analytics tracking
- [ ] In-app announcements

## 🐛 Troubleshooting

### "Network request failed"

**Problem:** Can't connect to backend

**Solutions:**
1. Check backend is running: `http://YOUR_IP:5000/health`
2. Verify API_BASE_URL has YOUR local IP (not localhost)
3. Ensure phone and computer on same WiFi
4. Check firewall isn't blocking port 5000
5. Try turning off VPN

### "Unable to resolve module"

**Problem:** Missing dependencies

**Solution:**
```bash
rm -rf node_modules
npm install
expo start -c
```

### "Simulator not opening"

**iOS:**
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

**Android:**
- Open Android Studio
- Start emulator manually
- Run `npm start` then press `a`

### "AsyncStorage has been extracted"

**Problem:** Missing AsyncStorage package

**Solution:**
```bash
npm install @react-native-async-storage/async-storage
```

## 📱 Device Testing

### iOS
1. Install Expo Go from App Store
2. Scan QR code with Camera app
3. App opens in Expo Go

### Android
1. Install Expo Go from Play Store
2. Open Expo Go
3. Scan QR code
4. App loads

### Requirements
- Phone and computer on same WiFi
- Backend server running
- Correct API_BASE_URL

## 🔒 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Client and server-side
3. **Use HTTPS** - In production
4. **Secure token storage** - AsyncStorage with encryption (future)
5. **Implement refresh tokens** - Long-term auth
6. **Rate limiting** - Prevent abuse
7. **Input sanitization** - Prevent injection

## 📚 Learning Resources

- [Expo Docs](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)
- [Axios](https://axios-http.com/)

## 🎓 Code Examples

### Creating a New Screen

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const MyScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
});
```

### Adding to Navigation

```typescript
// In AppNavigator.tsx
import { MyScreen } from '../screens/my/MyScreen';

// Add to Tab Navigator
<Tab.Screen name="MyScreen" component={MyScreen} />
```

## 📊 Performance Tips

1. **Optimize images** - Use appropriate sizes
2. **Lazy load** - Load data as needed
3. **Memoize** - Use React.memo for expensive components
4. **Virtual lists** - Use FlatList for long lists
5. **Debounce** - Debounce search inputs
6. **Cache data** - Store frequently used data
7. **Minimize re-renders** - Use useCallback, useMemo

## ✅ Production Checklist

Before deploying:
- [ ] Update API_BASE_URL to production URL
- [ ] Test on real devices (iOS & Android)
- [ ] Check all error handling
- [ ] Verify loading states
- [ ] Test offline behavior
- [ ] Update app version in app.json
- [ ] Add proper icons and splash screen
- [ ] Test payment flows thoroughly
- [ ] Verify token refresh logic
- [ ] Check memory leaks
- [ ] Optimize bundle size
- [ ] Enable production builds
- [ ] Set up crash reporting
- [ ] Configure analytics
- [ ] Test on different screen sizes

---

**Your mobile app is ready! Start building amazing features! 📱✨**
