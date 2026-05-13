import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    // Detect if mobile/tablet to decide strategy
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log("Mobile/Tablet detected, using signInWithRedirect for better compatibility");
      await signInWithRedirect(auth, googleProvider);
      return; 
    }

    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Firebase Auth Error:", error);
    
    // Check for specific common errors
    if (error.code === 'auth/unauthorized-domain') {
      const currentDomain = window.location.hostname;
      alert(`Domínio não autorizado: O domínio '${currentDomain}' precisa ser adicionado aos domínios autorizados no Console do Firebase (Configurações de Autenticação).`);
    } else if (error.code === 'auth/popup-blocked') {
      alert("Popup bloqueado: Por favor, permita popups para este site no seu navegador.");
    } else if (error.code === 'auth/popup-closed-by-user') {
      // Users closed the window
    } else if (error.code === 'auth/cancelled-popup-request') {
      alert("Solicitação cancelada: Uma tentativa de login já estava em andamento. Aguarde alguns segundos e tente novamente. Se o erro persistir, atualize a página.");
    } else if (error.message && error.message.includes('cookies')) {
      alert("Erro de Cookies: O Google não conseguiu validar seus cookies. Certifique-se de que Cookies de Terceiros estão habilitados nas configurações do navegador.");
    } else {
      alert("Erro ao entrar com Google: " + (error.message || "Erro desconhecido"));
    }
    throw error;
  }
};
export const signOut = () => auth.signOut();
