import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Firebase Auth Error:", error);
    // Specifically check for unauthorized domain error
    if (error.code === 'auth/unauthorized-domain') {
      alert("Erro de Autenticação: Este domínio (onrender.com) não está autorizado no Console do Firebase. Por favor, adicione 'painel-produ-o.onrender.com' aos domínios autorizados nas configurações de Autenticação do Firebase.");
    } else {
      alert("Erro ao entrar com Google: " + (error.message || "Erro desconhecido"));
    }
    throw error;
  }
};
export const signOut = () => auth.signOut();
