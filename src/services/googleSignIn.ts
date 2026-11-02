import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

/**
 * The native Google Sign-In module, or null where it can't run: on the web build, in Expo Go
 * (which has no custom native code; a development build is needed), or before the client IDs
 * are configured. Loaded lazily so those places keep working without it.
 */
function load(): GoogleModule | null {
  if (Platform.OS === 'web' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const google = require('@react-native-google-signin/google-signin') as GoogleModule;
    // The web client ID is the audience the API verifies (Android tokens carry it); iOS
    // tokens carry the iOS client ID. No secrets: these IDs are public by design.
    google.GoogleSignin.configure({ webClientId, iosClientId, offlineAccess: false });
    return google;
  } catch {
    return null;
  }
}

let module: GoogleModule | null | undefined;
const google = () => (module === undefined ? (module = load()) : module);

export const googleSignInAvailable = () => !!google();

export type GoogleSignInResult = { idToken: string } | { cancelled: true };

export class GoogleSignInError extends Error {
  constructor(public reason: 'playServices' | 'inProgress' | 'failed') {
    super(reason);
  }
}

/**
 * Opens Google's own account picker and returns the ID token for the API to verify. Google's
 * session on the device is not kept: HM Craft's session is the only one, and the picker shows
 * again next time so another account can be chosen.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const native = google();
  if (!native) throw new GoogleSignInError('failed');
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = native;
  try {
    if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return { cancelled: true };
    const idToken = response.data.idToken;
    if (!idToken) throw new GoogleSignInError('failed');
    return { idToken };
  } catch (error) {
    if (error instanceof GoogleSignInError) throw error;
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return { cancelled: true };
      if (error.code === statusCodes.IN_PROGRESS) throw new GoogleSignInError('inProgress');
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInError('playServices');
    }
    throw new GoogleSignInError('failed');
  } finally {
    await GoogleSignin.signOut().catch(() => undefined);
  }
}
