import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. 여기서 createUserWithEmailAndPassword를 추가로 불러옵니다.
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 2. 일단은 '로그인'을 시도합니다.
      await signInWithEmailAndPassword(auth, email, password);
      alert("관리자님 환영합니다! (로그인 성공) 😎");
      navigate('/upload');
    } catch (error) {
      // 3. 만약 로그인에 실패하면? (없는 계정이면) -> 바로 '회원가입'을 시켜버립니다!
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("새로운 관리자 계정이 생성되었습니다! 다시 로그인 버튼을 눌러주세요. 🎉");
      } catch (signupError) {
        console.error(signupError);
        alert("에러가 났어요: " + signupError.message);
      }
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', color: '#fff' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2 style={{ textAlign: 'center' }}>Manager Login</h2>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#888' }}>
          *없는 계정을 입력하면 자동으로 회원가입됩니다.*
        </p>
        <input 
          type="email" 
          placeholder="Email (새로 쓸 이메일 입력)" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Password (6자리 이상)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        <button 
          type="submit"
          style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          로그인 (또는 자동가입)
        </button>
      </form>
    </div>
  );
}

export default Login;