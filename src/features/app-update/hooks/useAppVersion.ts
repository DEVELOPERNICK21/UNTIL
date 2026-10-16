import { useMemo } from 'react';
import { getAppVersionUseCase } from '../../../app/di';

export function useAppVersion(): string {
  return useMemo(() => {
    const { version, buildNumber } = getAppVersionUseCase.execute();
    return buildNumber ? `${version} (${buildNumber})` : version;
  }, []);
}
