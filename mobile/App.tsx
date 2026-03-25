import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { SearchProvider } from './src/contexts/SearchContext';
import { TenancyProvider } from './src/contexts/TenancyContext';
import { ApplicationsProvider } from './src/contexts/ApplicationsContext';
import { ReviewsProvider } from './src/contexts/ReviewsContext';
import { PaymentsProvider } from './src/contexts/PaymentsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <SearchProvider>
              <TenancyProvider>
                <ApplicationsProvider>
                  <ReviewsProvider>
                    <PaymentsProvider>
                      <StatusBar style="light" />
                      <AppNavigator />
                    </PaymentsProvider>
                  </ReviewsProvider>
                </ApplicationsProvider>
              </TenancyProvider>
            </SearchProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
