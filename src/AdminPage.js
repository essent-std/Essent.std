import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import './AdminPage.css';

function AdminPage() {
  const navigate = useNavigate();
  
  // 🔐 로그인 및 상태 관리
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 📂 데이터 상태
  const [projects, setProjects] = useState([]);
  const [categoriesStd, setCategoriesStd] = useState([]);
  const [categoriesLab, setCategoriesLab] = useState([]);
  
  // 🔍 필터 및 선택 상태
  const [filterMode, setFilterMode] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]); // ✅ 선택된 프로젝트 ID들

  // 카테고리 추가 입력값
  const [newCategoryStd, setNewCategoryStd] = useState('');
  const [newCategoryLab, setNewCategoryLab] = useState('');

  // 1. 인증 체크
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. 데이터 불러오기
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchCategories();
    }
  }, [user]);

  // 🔑 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error(error);
      alert("로그인 실패! 정보를 확인해주세요.");
    }
  };

  // 🚪 로그아웃 & 메인으로 나가기 (자동 로그아웃 기능)
  const handleExitToMain = async () => {
    if (window.confirm("메인 홈페이지로 돌아가시겠습니까?\n(자동으로 로그아웃됩니다)")) {
      try {
        await signOut(auth); // ✅ 로그아웃 실행
        navigate('/');       // ✅ 메인으로 이동
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectList);
    } catch (error) {
      console.error('불러오기 실패:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'categories');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategoriesStd(data.std || []);
        setCategoriesLab(data.lab || []);
      } else {
        const defaultData = {
          std: ['Brand', 'Package', 'Editorial', 'Poster'],
          lab: ['Interaction', 'Code', 'Experiment']
        };
        await setDoc(docRef, defaultData);
        setCategoriesStd(defaultData.std);
        setCategoriesLab(defaultData.lab);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredProjects.map(p => p.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // ✅ 개별 체크박스 선택/해제
  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // ✅ 선택된 항목 일괄 삭제 (Bulk Delete)
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`선택한 ${selectedIds.length}개의 프로젝트를 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 선택된 모든 ID에 대해 삭제 요청을 동시에 보냄
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'projects', id))));
      
      alert("선택한 프로젝트가 모두 삭제되었습니다.");
      setSelectedIds([]); // 선택 초기화
      fetchProjects();    // 목록 새로고침
    } catch (error) {
      console.error("일괄 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`"${projectTitle}" 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      fetchProjects();
    } catch (error) { console.error(error); }
  };

  // ... (카테고리 추가/삭제 함수들은 기존과 동일) ...
  const handleAddCategoryStd = async () => {
    if (!newCategoryStd.trim()) return;
    try {
      const docRef = doc(db, 'settings', 'categories');
      await updateDoc(docRef, { std: arrayUnion(newCategoryStd.trim()) });
      setNewCategoryStd('');
      fetchCategories();
    } catch (error) { console.error(error); }
  };
  const handleAddCategoryLab = async () => {
    if (!newCategoryLab.trim()) return;
    try {
      const docRef = doc(db, 'settings', 'categories');
      await updateDoc(docRef, { lab: arrayUnion(newCategoryLab.trim()) });
      setNewCategoryLab('');
      fetchCategories();
    } catch (error) { console.error(error); }
  };
  const handleDeleteCategoryStd = async (cat) => {
    if (!window.confirm(`"${cat}" 삭제?`)) return;
    try {
      const docRef = doc(db, 'settings', 'categories');
      await updateDoc(docRef, { std: arrayRemove(cat) });
      fetchCategories();
    } catch (error) { console.error(error); }
  };
  const handleDeleteCategoryLab = async (cat) => {
    if (!window.confirm(`"${cat}" 삭제?`)) return;
    try {
      const docRef = doc(db, 'settings', 'categories');
      await updateDoc(docRef, { lab: arrayRemove(cat) });
      fetchCategories();
    } catch (error) { console.error(error); }
  };

  // 필터 로직
  const filteredProjects = projects.filter(project => {
    const matchMode = filterMode === 'all' || (project.mode || 'Std') === filterMode;
    const matchCategory = filterCategory === 'all' || project.category === filterCategory;
    return matchMode && matchCategory;
  });

  const getCurrentCategories = () => {
    if (filterMode === 'Std') return categoriesStd;
    if (filterMode === 'Lab') return categoriesLab;
    return [...categoriesStd, ...categoriesLab];
  };

  if (loading) return <div className="admin-loading">로딩 중...</div>;

  // 로그인 폼
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#000', color: '#fff' }}>
        <h1>Manager Login</h1>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
          <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px' }} />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '10px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🎨 관리 대시보드</h1>
        <div className="admin-user-info">
          <span>{user.email}</span>
          {/* ✅ 메인으로 나가기 버튼 (로그아웃 기능 포함) */}
          <button onClick={handleExitToMain} className="btn-logout" style={{backgroundColor: '#444'}}>
            🏠 메인페이지로 (로그아웃)
          </button>
        </div>
      </header>

      <section className="admin-section">
        <button onClick={() => navigate('/upload')} className="btn-primary">
          ➕ 새 프로젝트 추가
        </button>
      </section>

      <section className="admin-section">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>📂 프로젝트 관리 ({filteredProjects.length}개)</h2>
          
          {/* ✅ 선택된 항목이 있을 때만 삭제 버튼 표시 */}
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              style={{ padding: '8px 15px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🗑️ 선택된 {selectedIds.length}개 삭제하기
            </button>
          )}
        </div>

        <div className="filter-bar">
          <label>Mode: <select value={filterMode} onChange={(e) => { setFilterMode(e.target.value); setFilterCategory('all'); }}><option value="all">전체</option><option value="Std">Std</option><option value="Lab">Lab</option></select></label>
          <label>Category: <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}><option value="all">전체</option>{getCurrentCategories().map((cat, i) => <option key={i} value={cat}>{cat}</option>)}</select></label>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              {/* ✅ 전체 선택 체크박스 */}
              <th style={{width: '40px', textAlign: 'center'}}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={filteredProjects.length > 0 && selectedIds.length === filteredProjects.length}
                />
              </th>
              <th>썸네일</th>
              <th>제목</th>
              <th>Mode</th>
              <th>Category</th>
              <th>날짜</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr><td colSpan="7" className="empty-message">프로젝트가 없습니다.</td></tr>
            ) : (
              filteredProjects.map(project => (
                // ✅ 이렇게 깔끔하게 바꾸세요!
<tr key={project.id}>
                  {/* ✅ 개별 선택 체크박스 */}
                  <td style={{textAlign: 'center'}}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(project.id)}
                      onChange={() => handleSelectOne(project.id)}
                    />
                  </td>
                  <td>
                    {project.imageUrl ? <img src={project.imageUrl} alt="" className="admin-thumbnail" style={{width:'40px', height:'40px', objectFit:'cover'}}/> : <div style={{width:'40px', height:'40px', background:'#eee'}}></div>}
                  </td>
                  <td>{project.title}</td>
                  <td><span className={`badge badge-${(project.mode || 'Std').toLowerCase()}`}>{project.mode || 'Std'}</span></td>
                  <td>{project.category}</td>
                  <td>{project.date || '-'}</td>
                  <td>
                    <button onClick={() => handleDeleteProject(project.id, project.title)} className="btn-delete">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* ... 기존 카테고리 관리 섹션들 (그대로 유지) ... */}
      <section className="admin-section">
        <h2>🏷️ Std 카테고리 관리</h2>
        <div className="category-add">
          <input type="text" value={newCategoryStd} onChange={(e) => setNewCategoryStd(e.target.value)} placeholder="새 Std 카테고리" onKeyPress={(e) => e.key === 'Enter' && handleAddCategoryStd()} />
          <button onClick={handleAddCategoryStd} className="btn-add">추가</button>
        </div>
        <ul className="category-list">
          {categoriesStd.map((cat, i) => (<li key={i}><span className="badge badge-std">{cat}</span><button onClick={() => handleDeleteCategoryStd(cat)} className="btn-delete-small">❌</button></li>))}
        </ul>
      </section>

      <section className="admin-section">
        <h2>🏷️ Lab 카테고리 관리</h2>
        <div className="category-add">
          <input type="text" value={newCategoryLab} onChange={(e) => setNewCategoryLab(e.target.value)} placeholder="새 Lab 카테고리" onKeyPress={(e) => e.key === 'Enter' && handleAddCategoryLab()} />
          <button onClick={handleAddCategoryLab} className="btn-add">추가</button>
        </div>
        <ul className="category-list">
          {categoriesLab.map((cat, i) => (<li key={i}><span className="badge badge-lab">{cat}</span><button onClick={() => handleDeleteCategoryLab(cat)} className="btn-delete-small">❌</button></li>))}
        </ul>
      </section>
    </div>
  );
}

export default AdminPage;