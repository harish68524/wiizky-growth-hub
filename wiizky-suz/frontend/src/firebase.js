import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// REPLACE THIS OBJECT WITH YOUR ACTUAL KEYS FROM FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAXT6I9AW3HwTfgiEfiJdG-EbkW1B9-N8A",
  authDomain: "wiizky-smmp.firebaseapp.com",
  projectId: "wiizky-smmp",
  storageBucket: "wiizky-smmp.firebasestorage.app",
  messagingSenderId: "10887161577339",
  appId: "1:1088716157733:web:060d5160928d32d55fe0cc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();