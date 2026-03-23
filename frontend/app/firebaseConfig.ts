import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCrIrUKYdwyN0qi6mtT0XS5ijgf4IzBNJk",
  authDomain: "enareview-47d8d.firebaseapp.com",
  projectId: "enareview-47d8d",
  storageBucket: "enareview-47d8d.firebasestorage.app",
  messagingSenderId: "331462890307",
  appId: "1:331462890307:web:87de0b24e7df3dfc2ed5f6",
  measurementId: "G-VXMXDLG5L0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
