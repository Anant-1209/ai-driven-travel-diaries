// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBk8h9Gh_IEBv1IGkViAltv8fnTVkj272g",
//   authDomain: "blog-348b3.firebaseapp.com",
//   projectId: "blog-348b3",
//   storageBucket: "gs://blog-348b3.appspot.com",
//   messagingSenderId: "159399322730",
//   appId: "1:159399322730:web:fa30b610c3788861ddd613",
//   measurementId: "G-Z4Z71Q8ME7"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);


// export { app, analytics };



// firebase.js

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyBk8h9Gh_IEBv1IGkViAltv8fnTVkj272g",
  authDomain: "blog-348b3.firebaseapp.com",
  projectId: "blog-348b3",
  storageBucket: "blog-348b3.appspot.com",
  messagingSenderId: "159399322730",
  appId: "1:159399322730:web:fa30b610c3788861ddd613",
  measurementId: "G-Z4Z71Q8ME7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app); // Initialize Firebase Storage

export { app, analytics, storage }; // Export storage
