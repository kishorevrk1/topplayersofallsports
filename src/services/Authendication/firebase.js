// Firebase initialization and best practice setup
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// Add other Firebase SDK imports as needed

const firebaseConfig = {
  apiKey: "AIzaSyCJxbVTzI01UElBJ559GLXNKb9VM40DvRU",
  authDomain: "tesstiubg.firebaseapp.com",
  projectId: "tesstiubg",
  storageBucket: "tesstiubg.firebasestorage.app",
  messagingSenderId: "260337926756",
  appId: "1:260337926756:web:5d86fd0588c0da1a135571",
  measurementId: "G-QD4LX6FDEG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };
