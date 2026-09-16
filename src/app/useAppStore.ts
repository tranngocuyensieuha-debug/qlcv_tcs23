import { useContext } from 'react';

import { AppStoreContext, type AppStoreValue } from './AppStoreContext';

export function useAppStore(): AppStoreValue {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useAppStore phải được dùng trong AppStoreProvider.');
  return store;
}
