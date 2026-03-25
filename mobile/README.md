# VacancyRadar Tenant Mobile App

A React Native mobile application built with Expo for tenants to manage their rental experience.

## 📱 Features

### ✅ Core Features
- **Authentication** - Login & Registration for tenants
- **Dashboard** - Overview of lease, payments, and maintenance requests
- **Payments** - View payment history and make rent payments
- **Maintenance Requests** - Submit and track maintenance requests
- **Profile Management** - Manage tenant profile and settings
- **Notifications** - Real-time notifications for important updates

### 🎨 UI/UX
- Beautiful, modern design
- Smooth animations
- Intuitive navigation
- Responsive layouts
- Dark mode support (coming soon)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. **Navigate to mobile directory**
```bash
cd mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**

Edit `src/config/api.ts` and set your backend URL:
```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:5000/api'  // e.g., http://192.168.1.5:5000/api
  : 'https://your-production-api.com/api';
```

**Important:** For development, use your computer's local IP address, NOT `localhost` (because the mobile device needs to reach your development server).

4. **Start the development server**
```bash
npm start
```

5. **Run on device/simulator**
- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

## 📂 Project Structure

```
mobile/
├── src/
│   ├── components/           # Reusable components
│   │   └── common/          # Common UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── screens/             # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── home/           # Home/Dashboard
│   │   ├── payments/       # Payment screens
│   │   ├── maintenance/    # Maintenance screens
│   │   └── profile/        # Profile screens
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── config/              # App configuration
│   │   └── api.ts
│   ├── theme/               # Theme configuration
│   │   ├── colors.ts
│   │   └── theme.ts
│   └── types/               # TypeScript types
│       └── index.ts
├── App.tsx                  # App entry point
├── app.json                 # Expo configuration
├── package.json
└── README.md
```

## 🎨 Screens

### Authentication
- **LoginScreen** - Tenant login
- **RegisterScreen** - New tenant registration

### Main App
- **HomeScreen** - Dashboard with overview
- **PaymentsScreen** - Payment history and upcoming payments
- **MaintenanceScreen** - Maintenance request list and creation
- **ProfileScreen** - User profile and settings

## 🔧 Configuration

### API Configuration

Edit `src/config/api.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_IP:5000/api';
```

### App Configuration

Edit `app.json` to customize:
- App name
- Bundle identifier
- Icons and splash screen
- Permissions

## 📱 Running on Physical Device

### iOS (requires Mac)
1. Install Expo Go from App Store
2. Run `npm start`
3. Scan QR code with Camera app

### Android
1. Install Expo Go from Play Store
2. Run `npm start`
3. Scan QR code with Expo Go app

### Development Tips
- Use your computer's local IP address for API_BASE_URL
- Make sure your phone and computer are on the same WiFi network
- Check firewall settings if connection fails

## 🎨 Customization

### Colors

Edit `src/theme/colors.ts`:
```typescript
export const colors = {
  primary: '#4F46E5',
  secondary: '#10B981',
  // ... customize colors
};
```

### Components

All reusable components are in `src/components/common/`:
- **Button** - Customizable button with variants
- **Input** - Text input with icons and validation
- **Card** - Container component with shadow

## 🔐 Authentication Flow

1. User opens app
2. If not authenticated → Show Login/Register screens
3. User logs in → Token stored in AsyncStorage
4. Token sent with all API requests
5. If token expires → Auto logout and show login

## 📡 API Integration

### Making API Calls

```typescript
import api from '../config/api';

// GET request
const data = await api.get('/endpoint');

// POST request
const result = await api.post('/endpoint', { data });

// With auth token (automatic)
const protectedData = await api.get('/protected-endpoint');
```

### Auth Token Management

Tokens are automatically:
- Stored in AsyncStorage on login
- Attached to all requests
- Removed on logout or 401 error

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## 📦 Building for Production

### iOS

1. Configure app.json with iOS bundle identifier
2. Run: `expo build:ios`
3. Follow Expo prompts
4. Upload to App Store Connect

### Android

1. Configure app.json with Android package name
2. Run: `expo build:android`
3. Follow Expo prompts
4. Upload to Google Play Console

## 🚀 Deployment

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 📱 Features Roadmap

### Coming Soon
- [ ] Push notifications
- [ ] Document viewer
- [ ] Photo upload for maintenance requests
- [ ] In-app messaging with landlord
- [ ] Payment gateway integration
- [ ] Dark mode
- [ ] Offline support
- [ ] Biometric authentication

## 🐛 Troubleshooting

### Common Issues

**"Unable to connect to backend"**
- Check API_BASE_URL is set to your local IP (not localhost)
- Ensure backend server is running
- Check firewall settings
- Verify phone and computer are on same network

**"Module not found"**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -- --clear
```

**"Expo Go app crashes"**
- Update Expo Go app to latest version
- Update expo packages: `expo upgrade`
- Clear Expo cache: `expo start -c`

**"iOS Simulator not opening"**
- Make sure Xcode is installed
- Open Xcode once to accept license
- Run: `sudo xcode-select --switch /Applications/Xcode.app`

## 📚 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)

## 🔒 Security

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Implement proper token refresh logic
- Validate all user inputs
- Use HTTPS in production

## 📝 Code Style

- Follow React/TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add TypeScript types for all data
- Keep components small and focused

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test on both iOS and Android
4. Submit pull request

## 📄 License

ISC

---

**Built with ❤️ using React Native & Expo**
