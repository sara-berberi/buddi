import { Redirect } from 'expo-router';

// Landing route. The auth gate in _layout.tsx redirects authenticated users to
// the tabs and unauthenticated users to /auth; this just gives "/" a target.
export default function Index() {
  return <Redirect href="/auth" />;
}
