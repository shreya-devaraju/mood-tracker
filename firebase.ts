import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
//new import -> for setting up authentication 
import { getAuth } from 'firebase/auth';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDnVZGw23foNDna22fsb_OHvSS15dUAOW4",
  authDomain: "mood-tracker-2583e.firebaseapp.com",
  projectId: "mood-tracker-2583e",
  storageBucket: "mood-tracker-2583e.firebasestorage.app",
  messagingSenderId: "455265883510",
  appId: "1:455265883510:web:7ede48d4d966a5977f9657"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//need to make sure export is here so index can use it
const db = getFirestore(app);
export { db };
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});