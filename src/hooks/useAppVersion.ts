import { useMemo } from 'react';
import { getAppVersionUseCase } from '../di';

export function useAppVersion(): string {
  return useMemo(() => {
    const { version, buildNumber } = getAppVersionUseCase.execute();
    return buildNumber ? `${version} (${buildNumber})` : version;
  }, []);
}
