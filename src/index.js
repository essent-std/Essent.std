import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// PWA 설정 파일 import
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// 👇 [여기서부터 복사] 이 코드를 통째로 추가하세요
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
  console.log('🧹 모든 캐시가 삭제되었습니다.');
}



// 🔥 [핵심] 이 줄이 있어야 PWA(앱 다운로드 기능)가 켜집니다!
// register를 unregister로 바꾸세요!
serviceWorkerRegistration.unregister();