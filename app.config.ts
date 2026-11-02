import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. Google Sign-In's config plugin needs the iOS URL scheme, which is the iOS
 * OAuth client ID reversed; it is read from the environment, never written into the repo. Until
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is set the plugin is left out, so builds still work (Android
 * needs no plugin options: autolinking adds the native module).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  // "123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc"
  const iosUrlScheme = iosClientId
    ? 'com.googleusercontent.apps.' + iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')
    : null;
  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, unknown]] : []),
    ],
  };
};
