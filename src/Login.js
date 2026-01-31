import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase'; // 우리가 만든 firebase 설정 가져오기

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("관리자님 환영합니다! 😎");
      navigate('/upload'); // 로그인 성공하면 메인으로 이동 (나중에 관리자 페이지로 바꿀 예정)
    } catch (error) {
      console.error(error);
      alert("로그인 실패.. 아이디나 비번을 확인해주세요.");
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', color: '#fff' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2 style={{ textAlign: 'center' }}>Manager Login</h2>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: 'none' }}
        />
        <button 
          type="submit"
          style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}

export default Login;