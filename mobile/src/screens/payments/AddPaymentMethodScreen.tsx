import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../../theme/colors';
import { Card } from '../../components/common/Card';
import { usePayments } from '../../contexts/PaymentsContext';
import { PaymentMethodType } from '../../types';

const providers = ['M-Pesa', 'Airtel Money', 'MTN MoMo'];

export const AddPaymentMethodScreen = ({ navigation }: any) => {
  const { addMethod } = usePayments();
  const [type, setType] = useState<PaymentMethodType>('mobile_money');
  const [makeDefault, setMakeDefault] = useState(true);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [provider, setProvider] = useState(providers[0]);
  const [phone, setPhone] = useState('');

  const handleScan = async () => {
    if (!cameraPermission) {
      await requestCameraPermission();
      return;
    }
    
    if (!cameraPermission.granted) {
      Alert.alert(
        'Camera permission',
        'Camera access is required to scan cards.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant', onPress: requestCameraPermission },
        ]
      );
      return;
    }
    
    setScannerOpen(true);
  };

  const handleScanned = ({ data }: { data: string }) => {
    setScannerOpen(false);
    // Clean up the scanned data (remove spaces, limit to 19 chars)
    setCardNumber(data.replace(/\s/g, '').slice(0, 19));
  };

  const handleSave = () => {
    if (type === 'card') {
      if (!cardNumber || cardNumber.length < 12) {
        Alert.alert('Missing info', 'Enter a valid card number.');
        return;
      }
      const last4 = cardNumber.slice(-4);
      addMethod({
        type: 'card',
        label: `Card •••• ${last4}`,
        brand: 'Card',
        last4,
        expiry,
        isDefault: makeDefault,
      });
    } else {
      if (!phone.trim()) {
        Alert.alert('Missing info', 'Enter a mobile money number.');
        return;
      }
      addMethod({
        type: 'mobile_money',
        label: `${provider} •••• ${phone.slice(-4)}`,
        provider,
        phone,
        isDefault: makeDefault,
      });
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'card' && styles.toggleButtonActive]}
          onPress={() => setType('card')}
        >
          <Text style={[styles.toggleText, type === 'card' && styles.toggleTextActive]}>Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'mobile_money' && styles.toggleButtonActive]}
          onPress={() => setType('mobile_money')}
        >
          <Text style={[styles.toggleText, type === 'mobile_money' && styles.toggleTextActive]}>
            Mobile Money
          </Text>
        </TouchableOpacity>
      </View>

      {type === 'card' ? (
        <Card style={styles.card} padding={16}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Card details</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
              <Ionicons name="scan-outline" size={16} color={colors.primary} />
              <Text style={styles.scanText}>Scan</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Card Number"
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            style={styles.input}
          />
          <TextInput
            placeholder="Cardholder Name"
            value={cardHolder}
            onChangeText={setCardHolder}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              placeholder="MM/YY"
              value={expiry}
              onChangeText={setExpiry}
              style={[styles.input, styles.rowInput]}
            />
            <TextInput
              placeholder="CVC"
              value={cvc}
              onChangeText={setCvc}
              style={[styles.input, styles.rowInput]}
              keyboardType="number-pad"
            />
          </View>
        </Card>
      ) : (
        <Card style={styles.card} padding={16}>
          <Text style={styles.sectionTitle}>Mobile money</Text>
          <View style={styles.providerRow}>
            {providers.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.providerChip, provider === item && styles.providerChipActive]}
                onPress={() => setProvider(item)}
              >
                <Text style={[styles.providerText, provider === item && styles.providerTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </Card>
      )}

      <Card style={styles.card} padding={16}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Set as default</Text>
          <Switch value={makeDefault} onValueChange={setMakeDefault} />
        </View>
      </Card>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="save-outline" size={18} color={colors.white} />
        <Text style={styles.saveText}>Save Payment Method</Text>
      </TouchableOpacity>

      <Modal visible={scannerOpen} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'ean13', 'ean8'],
            }}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Scan the card barcode</Text>
            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerOpen(false)}>
              <Ionicons name="close" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGray,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginTop: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  scanText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  providerChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  providerChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  providerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  providerTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    color: colors.white,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  scannerText: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 12,
  },
  scannerClose: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
});