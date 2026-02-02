import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";       // 로그인 기능 추가
import { getFirestore } from "firebase/firestore"; // 데이터베이스 기능 추가

// 님께서 가져오신 새 열쇠들입니다!
const firebaseConfig = {
  apiKey: "AIzaSyCYvxrbPP9f49DlxNcYJXyYywJ54N-bnyw",
  authDomain: "essent-studio.firebaseapp.com",
  projectId: "essent-studio",
  storageBucket: "essent-studio.firebasestorage.app",
  messagingSenderId: "198995652116",
  appId: "1:198995652116:web:c0ce2e5a1b2f920f24c101"
};

// 파이어베이스 시작!
const app = initializeApp(firebaseConfig);

// 다른 파일에서 쓸 수 있게 내보내기 (이게 꼭 있어야 합니다!)
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;