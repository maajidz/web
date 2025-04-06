'use client';

import { useState, useEffect } from 'react';

export type OperatingSystem = 'iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux' | 'Unknown';

export function useOSDetection(): OperatingSystem {
  const [os, setOs] = useState<OperatingSystem>('Unknown');

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      let detectedOs: OperatingSystem = 'Unknown';

      if (/android/i.test(userAgent)) {
        detectedOs = 'Android';
      } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
        // Check for iPad/iPhone/iPod and ensure it's not Windows Phone pretending
        detectedOs = 'iOS';
      } else if (/Win/.test(userAgent)) {
        detectedOs = 'Windows';
      } else if (/Mac/.test(userAgent)) {
        detectedOs = 'Mac';
      } else if (/Linux/.test(userAgent)) {
        detectedOs = 'Linux';
      }
      
      setOs(detectedOs);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return os;
} 