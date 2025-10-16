// Google Sign-In with Firebase Auth (best practice setup)
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, linkWithCredential, signInWithCredential } from "firebase/auth";
import { auth } from "./firebase";

// Create Google provider
const provider = new GoogleAuthProvider();
// Optional: Add scopes
// provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// Optional: Set custom parameters
// provider.setCustomParameters({ 'login_hint': 'user@example.com' });

// Optional: Set language
// auth.languageCode = 'en';
// auth.useDeviceLanguage();

// Sign in with popup
export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    return { user, token, credential };
  } catch (error) {
    // Handle account-exists-with-different-credential error
    if (error.code === "auth/account-exists-with-different-credential") {
      return { error, pendingCred: error.credential };
    }
    return { error };
  }
}

// Sign in with redirect
export function signInWithGoogleRedirect() {
  return signInWithRedirect(auth, provider);
}

// Get redirect result (call on page load after redirect)
export async function getGoogleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    return { user, token, credential };
  } catch (error) {
    if (error.code === "auth/account-exists-with-different-credential") {
      return { error, pendingCred: error.credential };
    }
    return { error };
  }
}

// Link pending credential to existing user
export async function linkGoogleCredential(user, pendingCred) {
  try {
    const linkedUser = await linkWithCredential(user, pendingCred);
    return { linkedUser };
  } catch (error) {
    return { error };
  }
}

// Manual sign-in with Google ID token (advanced)
export async function signInWithGoogleIdToken(idToken) {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    return { user: userCred.user };
  } catch (error) {
    return { error };
  }
}

// Sign out
export async function signOutGoogle() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { error };
  }
}
