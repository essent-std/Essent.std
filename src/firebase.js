// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ⚠️ 아래 firebaseConfig 내용을 아까 콘솔에서 본인의 것으로 바꿔치기 하세요!
const firebaseConfig = {
  apiKey: "AIzaSyCpje9SyErU9ubTb3mQcISLbaGbl7g70JY",
  authDomain: "essent-admin-6605e.firebaseapp.com",
  projectId: "essent-admin-6605e",
  storageBucket: "essent-admin-6605e.firebasestorage.app",
  messagingSenderId: "614009990980",
  appId: "1:614009990980:web:00314a8e17db7a7489f111"
};


// 파이어베이스 초기화
const app = initializeApp(firebaseConfig);

// 우리가 쓸 기능들 내보내기
export const db = getFirestore(app);       // 데이터베이스 (글 저장)
export const auth = getAuth(app);          // 인증 (로그인)
export const storage = getStorage(app);    // 스토리지 (이미지 저장)

export default app;