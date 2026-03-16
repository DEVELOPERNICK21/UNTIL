import { useEffect, useState } from 'react';
import {
  checkForAppUpdate,
  recordUpdateCheck,
  shouldSkipUpdateCheck,
  UpdateType,
} from '../services/updateService';

export interface UseAppUpdateCheckState {
  updateType: 'FORCE_UPDATE' | 'OPTIONAL_UPDATE' | 'NONE';
  storeUrl?: string;
  loading: boolean;
}

export function useAppUpdateCheck(): UseAppUpdateCheckState {
  const [state, setState] = useState<UseAppUpdateCheckState>({
    updateType: 'NONE',
    storeUrl: undefined,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (shouldSkipUpdateCheck()) {
        if (!isMounted) return;
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const result = await checkForAppUpdate();
      recordUpdateCheck();

      if (!isMounted) return;

      let mapped: UseAppUpdateCheckState['updateType'] = 'NONE';
      switch (result.type as UpdateType) {
        case 'FORCE_UPDATE':
          mapped = 'FORCE_UPDATE';
          break;
        case 'OPTIONAL_UPDATE':
          mapped = 'OPTIONAL_UPDATE';
          break;
        default:
          mapped = 'NONE';
      }

      setState({
        updateType: mapped,
        storeUrl: result.storeUrl,
        loading: false,
      });
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

