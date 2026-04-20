import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

import { NotificationsProvider, useNotifications } from '../contexts/NotificationsContext';

// Auth Screens
import { LandingScreen } from '../screens/auth/LandingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { PaymentsScreen } from '../screens/payments/PaymentsScreen';
import { PaymentMethodsScreen } from '../screens/payments/PaymentMethodsScreen';
import { AddPaymentMethodScreen } from '../screens/payments/AddPaymentMethodScreen';
import { PaymentHistoryScreen } from '../screens/payments/PaymentHistoryScreen';
import { MakePaymentScreen } from '../screens/payments/MakePaymentScreen';
import { MaintenanceScreen } from '../screens/maintenance/MaintenanceScreen';
import { CreateMaintenanceRequestScreen } from '../screens/maintenance/CreateMaintenanceRequestScreen';
import { MaintenanceRequestDetailScreen } from '../screens/maintenance/MaintenanceRequestDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { HelpSupportScreen } from '../screens/profile/HelpSupportScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { DocumentsScreen } from '../screens/documents/DocumentsScreen';
import { MapSearchScreen } from '../screens/search/MapSearchScreen';
import { SearchFiltersScreen } from '../screens/search/SearchFiltersScreen';
import { SavedSearchesScreen } from '../screens/search/SavedSearchesScreen';
import { SearchHistoryScreen } from '../screens/search/SearchHistoryScreen';
import { PropertyDetailsScreen } from '../screens/search/PropertyDetailsScreen';
import { PropertyListScreen } from '../screens/search/PropertyListScreen';
import { ApplicationFormScreen } from '../screens/applications/ApplicationFormScreen';
import { ApplicationsDashboardScreen } from '../screens/applications/ApplicationsDashboardScreen';
import { ApplicationDetailScreen } from '../screens/applications/ApplicationDetailScreen';
import { ReviewsDashboardScreen } from '../screens/reviews/ReviewsDashboardScreen';
import { ReviewDetailScreen } from '../screens/reviews/ReviewDetailScreen';
import { ReviewFormScreen } from '../screens/reviews/ReviewFormScreen';
import { PropertyReviewsScreen } from '../screens/reviews/PropertyReviewsScreen';
import { TenancyHomeScreen } from '../screens/tenancy/TenancyHomeScreen';
import { MoveInPrepScreen } from '../screens/tenancy/MoveInPrepScreen';
import { LeasePreviewScreen } from '../screens/tenancy/LeasePreviewScreen';
import { CheckInScreen } from '../screens/tenancy/CheckInScreen';
import { CheckOutScreen } from '../screens/tenancy/CheckOutScreen';
import { DepositTrackingScreen } from '../screens/tenancy/DepositTrackingScreen';
import { PhotoComparisonScreen } from '../screens/tenancy/PhotoComparisonScreen';

const Stack = createStackNavigator();
const RootStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SearchStack = createStackNavigator();
const TenancyStack = createStackNavigator();
const MaintenanceStack = createStackNavigator();
const ApplicationsStack = createStackNavigator();
const ReviewsStack = createStackNavigator();
const PaymentsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const SearchStackNavigator = () => {
  return (
    <SearchStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <SearchStack.Screen name="SearchMap" component={MapSearchScreen} options={{ title: 'Search' }} />
      <SearchStack.Screen
        name="PropertyList"
        component={PropertyListScreen}
        options={{ title: 'Property List' }}
      />
      <SearchStack.Screen
        name="SearchFilters"
        component={SearchFiltersScreen}
        options={{ title: 'Filters' }}
      />
      <SearchStack.Screen
        name="SavedSearches"
        component={SavedSearchesScreen}
        options={{ title: 'Saved Searches' }}
      />
      <SearchStack.Screen
        name="SearchHistory"
        component={SearchHistoryScreen}
        options={{ title: 'Search History' }}
      />
      <SearchStack.Screen
        name="PropertyDetails"
        component={PropertyDetailsScreen}
        options={{ title: 'Property Details' }}
      />
      <SearchStack.Screen
        name="PropertyReviews"
        component={PropertyReviewsScreen}
        options={{ title: 'Reviews' }}
      />
      <SearchStack.Screen
        name="ReviewForm"
        component={ReviewFormScreen}
        options={{ title: 'Write Review' }}
      />
      <SearchStack.Screen
        name="ApplicationForm"
        component={ApplicationFormScreen}
        options={{ title: 'Application' }}
      />
    </SearchStack.Navigator>
  );
};

const TenancyStackNavigator = () => {
  return (
    <TenancyStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <TenancyStack.Screen
        name="TenancyHome"
        component={TenancyHomeScreen}
        options={{ title: 'Check-in & Tenancy' }}
      />
      <TenancyStack.Screen
        name="MoveInPrep"
        component={MoveInPrepScreen}
        options={{ title: 'Move-in Prep' }}
      />
      <TenancyStack.Screen
        name="LeasePreview"
        component={LeasePreviewScreen}
        options={{ title: 'Lease Preview' }}
      />
      <TenancyStack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: 'QR Check-in' }}
      />
      <TenancyStack.Screen
        name="CheckOut"
        component={CheckOutScreen}
        options={{ title: 'QR Check-out' }}
      />
      <TenancyStack.Screen
        name="DepositTracking"
        component={DepositTrackingScreen}
        options={{ title: 'Deposit Tracking' }}
      />
      <TenancyStack.Screen
        name="PhotoComparison"
        component={PhotoComparisonScreen}
        options={{ title: 'Condition Comparison' }}
      />
    </TenancyStack.Navigator>
  );
};

const ApplicationsStackNavigator = () => {
  return (
    <ApplicationsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ApplicationsStack.Screen
        name="ApplicationsDashboard"
        component={ApplicationsDashboardScreen}
        options={{ title: 'My Applications' }}
      />
      <ApplicationsStack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
        options={{ title: 'Application Detail' }}
      />
      <ApplicationsStack.Screen
        name="ApplicationForm"
        component={ApplicationFormScreen}
        options={{ title: 'Application' }}
      />
    </ApplicationsStack.Navigator>
  );
};

const ReviewsStackNavigator = () => {
  return (
    <ReviewsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ReviewsStack.Screen
        name="ReviewsDashboard"
        component={ReviewsDashboardScreen}
        options={{ title: 'My Reviews' }}
      />
      <ReviewsStack.Screen
        name="ReviewDetail"
        component={ReviewDetailScreen}
        options={{ title: 'Review Detail' }}
      />
      <ReviewsStack.Screen
        name="ReviewForm"
        component={ReviewFormScreen}
        options={{ title: 'Write Review' }}
      />
    </ReviewsStack.Navigator>
  );
};

const MaintenanceStackNavigator = () => {
  return (
    <MaintenanceStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MaintenanceStack.Screen
        name="MaintenanceHome"
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
      <MaintenanceStack.Screen
        name="CreateRequest"
        component={CreateMaintenanceRequestScreen}
        options={{ title: 'New Request' }}
      />
      <MaintenanceStack.Screen
        name="RequestDetail"
        component={MaintenanceRequestDetailScreen}
        options={{ title: 'Request Details' }}
      />
    </MaintenanceStack.Navigator>
  );
};

const TabNavigator = () => {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          } else if (route.name === 'Maintenance') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Tenancy') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'Applications') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Reviews') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Tenancy" 
        component={TenancyStackNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Reviews"
        component={ReviewsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStackNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsStackNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Maintenance" 
        component={MaintenanceStackNavigator} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ 
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const AppStack = () => {
  return (
    <NotificationsProvider>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={TabNavigator} />
        <RootStack.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{
            headerShown: true,
            title: 'Documents',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </RootStack.Navigator>
    </NotificationsProvider>
  );
};
const PaymentsStackNavigator = () => {
  return (
    <PaymentsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <PaymentsStack.Screen name="PaymentsHome" component={PaymentsScreen} options={{ title: 'Payments' }} />
      <PaymentsStack.Screen
        name="PaymentMethods"
        component={PaymentMethodsScreen}
        options={{ title: 'Payment Methods' }}
      />
      <PaymentsStack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethodScreen}
        options={{ title: 'Add Method' }}
      />
      <PaymentsStack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{ title: 'Payment History' }}
      />
      <PaymentsStack.Screen
        name="MakePayment"
        component={MakePaymentScreen}
        options={{ title: 'Make Payment' }}
      />
    </PaymentsStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <ProfileStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <ProfileStack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{ title: 'Help & Support' }}
      />
      <ProfileStack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About' }}
      />
    </ProfileStack.Navigator>
  );
};
