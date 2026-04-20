import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SearchProvider } from './src/contexts/SearchContext';
import { ListingsProvider } from './src/contexts/ListingsContext';
import { TenancyProvider } from './src/contexts/TenancyContext';
import { ApplicationsProvider } from './src/contexts/ApplicationsContext';
import { ReviewsProvider } from './src/contexts/ReviewsContext';
import { PaymentsProvider } from './src/contexts/PaymentsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

const AppContent = () => {
  const { user } = useAuth();
  const content = (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );

  if (!user) {
    return content;
  }

  return (
    <SearchProvider>
      <ListingsProvider>
        <TenancyProvider>
          <ApplicationsProvider>
            <ReviewsProvider>
              <PaymentsProvider>{content}</PaymentsProvider>
            </ReviewsProvider>
          </ApplicationsProvider>
        </TenancyProvider>
      </ListingsProvider>
    </SearchProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
