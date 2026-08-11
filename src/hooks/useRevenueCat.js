import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VEHICLE_LIMITS = {
  autocoach_solo: 1,
  autocoach_duo: 2,
  autocoach_family: 3,
  autocoach_family_plus: 4,
  autocoach_fleet_s: 6,
  autocoach_fleet_m: 10,
  autocoach_fleet_l: 20
};

export function useRevenueCat(T = (key) => key) {
  const [isPro, setIsPro] = useState(false);
  const [vehicleLimit, setVehicleLimit] = useState(0);
  const [activeProductIds, setActiveProductIds] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Load cached Pro state immediately
  useEffect(() => {
    AsyncStorage.getItem('rc_is_pro').then(val => {
      if (val === 'true') setIsPro(true);
    }).catch(() => {});
    
    AsyncStorage.getItem('rc_vehicle_limit').then(val => {
      if (val) setVehicleLimit(parseInt(val, 10));
    }).catch(() => {});

    AsyncStorage.getItem('rc_active_product_ids').then(val => {
      if (val) setActiveProductIds(JSON.parse(val));
    }).catch(() => {});
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('rc_is_pro', isPro ? 'true' : 'false').catch(() => {});
  }, [isPro]);

  useEffect(() => {
    AsyncStorage.setItem('rc_vehicle_limit', vehicleLimit.toString()).catch(() => {});
  }, [vehicleLimit]);

  useEffect(() => {
    AsyncStorage.setItem('rc_active_product_ids', JSON.stringify(activeProductIds)).catch(() => {});
  }, [activeProductIds]);

  const updateStateFromCustomerInfo = (customerInfo) => {
    const entitlements = customerInfo?.entitlements?.active || {};
    const activeIds = customerInfo?.activeSubscriptions || [];
    
    let maxLimit = 0;
    
    // Check all active entitlements and find the one with the highest vehicle limit
    Object.keys(entitlements).forEach(entitlementId => {
      const limit = VEHICLE_LIMITS[entitlementId];
      if (limit && limit > maxLimit) {
        maxLimit = limit;
      }
    });

    if (maxLimit > 0) {
      setIsPro(true);
      setVehicleLimit(maxLimit);
      setActiveProductIds(activeIds);
      return true;
    } else {
      setIsPro(false);
      setVehicleLimit(0);
      setActiveProductIds([]);
      return false;
    }
  };

  useEffect(() => {
    const setupRevenueCat = async () => {
      try {
        if (Platform.OS === 'ios') {
          Purchases.configure({ apiKey: 'appl_ImrkxiDpfbsHCCTNvTUpoQlhFgH' });
        } else if (Platform.OS === 'android') {
          Purchases.configure({ apiKey: 'goog_sZtMrfVzOYCNJjTNctzwXkDKiVf' });
        }

        const customerInfo = await Purchases.getCustomerInfo();
        updateStateFromCustomerInfo(customerInfo);
        
        // Listen for real-time updates
        Purchases.addCustomerInfoUpdateListener(updateStateFromCustomerInfo);
      } catch (e) {
        console.warn('Error setting up RevenueCat', e);
      }
    };
    setupRevenueCat();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(updateStateFromCustomerInfo);
    };
  }, []);

  const purchaseProduct = async (productId) => {
    if (activeProductIds.includes(productId)) {
      return await new Promise((resolve) => {
        Alert.alert(
          T('alert_sub_title') || 'Already Subscribed',
          T('alert_sub_body') || 'You already have this active subscription.',
          [{ text: T('ok') || 'OK', onPress: () => setTimeout(() => resolve(true), 300) }]
        );
      });
    }
    
    if (!productId) return false;
    setPurchasing(true);
    
    try {
      // Fetch products to purchase by ID
      const products = await Purchases.getProducts([productId]);
      if (products.length > 0) {
        const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
        const success = updateStateFromCustomerInfo(customerInfo);
        return success;
      } else {
        throw new Error('Product not found in stores.');
      }
    } catch (e) {
      if (e.userCancelled) {
        // User cancelled, ignore
      } else {
        await new Promise((resolve) => {
          Alert.alert(
            T('alert_error_title') || 'Purchase Error',
            e.message,
            [{ text: T('ok') || 'OK', onPress: () => setTimeout(resolve, 300) }]
          );
        });
      }
    } finally {
      setPurchasing(false);
    }
    return false;
  };

  const restorePurchases = async () => {
    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const success = updateStateFromCustomerInfo(customerInfo);
      
      if (!success) {
        Alert.alert(
          T('alert_restore_fail_title') || 'Restore Failed',
          T('alert_restore_fail_body') || 'No active subscriptions found.'
        );
      }
      return success;
    } catch (e) {
      await new Promise((resolve) => {
        Alert.alert(
          T('alert_restore_error_title') || 'Restore Error',
          e.message,
          [{ text: T('ok') || 'OK', onPress: () => setTimeout(resolve, 300) }]
        );
      });
    } finally {
      setRestoring(false);
    }
    return false;
  };

  return {
    isPro,
    vehicleLimit,
    activeProductIds,
    purchasing,
    restoring,
    purchaseProduct,
    restorePurchases
  };
}
