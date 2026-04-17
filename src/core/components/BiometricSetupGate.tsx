/**
 * src/core/components/BiometricSetupGate.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted inside the authenticated navigator.
 * Reads the "pending setup" flag written by LoginScreen and, if all conditions
 * are met, shows BiometricSetupPrompt exactly once.
 *
 * Conditions to show the prompt:
 *   1. A pending setup record exists (email + password written by LoginScreen).
 *   2. Hardware is supported and biometrics are enrolled.
 *   3. Biometric login is NOT already enabled for this email.
 *   4. The number of OS-enrolled fingerprints does NOT exceed MAX_FINGERPRINTS.
 *      (If it does, we still show the prompt — BiometricSetupPrompt will render
 *       a "too many fingerprints" warning instead of the enable button.)
 */

import React, { useEffect, useState } from 'react';
import { BiometricService, BiometricCapability } from '../lib/biometricService';
import { BiometricSetupPrompt } from './BiometricSetupPrompt';

export function BiometricSetupGate() {
  const [visible, setVisible]         = useState(false);
  const [capability, setCapability]   = useState<BiometricCapability | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    checkPendingSetup();
  }, []);

  const checkPendingSetup = async () => {
    try {
      // 1. Is there a pending setup request from LoginScreen?
      const pending = await BiometricService.getPendingSetup();
      if (!pending) return;

      // 2. Check hardware AND whether biometrics are already enabled for this email
      const cap = await BiometricService.getCapability(pending.email);

      if (!cap.isSupported || !cap.isEnrolled || cap.isEnabled) {
        // Hardware not available, nothing enrolled, or already enabled — skip
        await BiometricService.clearPendingSetup();
        return;
      }

      // 3. Show the prompt (BiometricSetupPrompt handles the too_many_fingerprints
      //    case itself by rendering a warning UI instead of the enable button)
      setCapability(cap);
      setCredentials(pending);
      setVisible(true);
    } catch {
      // Silently ignore — biometric setup is non-critical
    }
  };

  const handleEnable = async () => {
    setVisible(false);
    await BiometricService.clearPendingSetup();
    setCredentials(null);
  };

  const handleDismiss = async () => {
    setVisible(false);
    await BiometricService.clearPendingSetup();
    setCredentials(null);
  };

  if (!visible || !capability || !credentials) return null;

  return (
    <BiometricSetupPrompt
      visible={visible}
      capability={capability}
      email={credentials.email}
      password={credentials.password}
      onEnable={handleEnable}
      onDismiss={handleDismiss}
    />
  );
}