import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SOW_TRANSLATIONS } from '../translations/SowTranslations';

export default function ScannerCamera({ onPhotoTaken, onClose, lang = 'EN' }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {SOW_TRANSLATIONS[lang]?.camera_permission_msg || SOW_TRANSLATIONS.EN.camera_permission_msg}
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>
              {SOW_TRANSLATIONS[lang]?.camera_grant_btn || SOW_TRANSLATIONS.EN.camera_grant_btn}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtnText} onPress={onClose}>
            <Text style={styles.closeText}>
              {SOW_TRANSLATIONS[lang]?.camera_cancel_btn || SOW_TRANSLATIONS.EN.camera_cancel_btn}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.7,
        });
        if (onPhotoTaken) {
          onPhotoTaken(photo.base64);
        }
      } catch (err) {
        console.error('Failed to take picture:', err);
        setIsProcessing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <SafeAreaView style={styles.overlay}>
          {/* Header row with close button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.spacer} />

          {/* Bottom row with shutter button */}
          <View style={styles.footer}>
            {isProcessing ? (
              <ActivityIndicator size="large" color="#ffffff" />
            ) : (
              <TouchableOpacity style={styles.shutterContainer} onPress={takePicture}>
                <View style={styles.shutterInner} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    alignItems: 'flex-start',
  },
  closeIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionBtn: {
    backgroundColor: '#E85D04',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  permissionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  closeBtnText: {
    padding: 10,
  },
  closeText: {
    color: '#AAA',
    fontSize: 16,
  }
});
