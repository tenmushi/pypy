// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmsLD9_-HI4sKopWn9JH0O-8ztrBsU13g",
  authDomain: "puyopuyo-ef6b4.firebaseapp.com",
  projectId: "puyopuyo-ef6b4",
  storageBucket: "puyopuyo-ef6b4.firebasestorage.app",
  messagingSenderId: "79743779018",
  appId: "1:79743779018:web:f35b0a74a31fd0fcefb433",
  measurementId: "G-LGSB86FHFP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
