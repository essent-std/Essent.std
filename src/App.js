import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Detail from './Detail';
import emailjs from '@emailjs/browser';
import AdminPage from './AdminPage';
import Upload from './Upload';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';  
import Login from './Login';

function MainPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('Std'); 
  const [category, setCategory] = useState('All Project');
  const [searchTerm, setSearchTerm] = useState('');

  const [firestoreProjects, setFirestoreProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoriesStd, setCategoriesStd] = useState([]);
  const [categoriesLab, setCategoriesLab] = useState([]);

  const [form, setForm] = useState({ name: '', content: '', email: '' });
  const [errors, setErrors] = useState({ name: '', content: '', email: '' });

  // 🆕 동영상인지 확인하는 함수 (확장자 체크)
  const isVideo = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFirestoreProjects(projects);

        const categoryDoc = await getDoc(doc(db, 'settings', 'categories'));
        if (categoryDoc.exists()) {
          const data = categoryDoc.data();
          setCategoriesStd(data.std || []);
          setCategoriesLab(data.lab || []);
        }
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReset = () => {
    window.scrollTo(0, 0);
    setCategory('All Project');
    setForm({ name: '', content: '', email: '' });
    setErrors({});
    navigate('/');
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); 
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = '* 필수 항목입니다.';
    if (!form.content.trim()) newErrors.content = '* 필수 항목입니다.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    if (!form.email.trim()) newErrors.email = '* 필수 항목입니다.';
    else if (!emailRegex.test(form.email)) newErrors.email = '* 올바른 이메일 형식이 아닙니다.'; 

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const templateParams = {
        from_name: form.name,
        reply_to: form.email,
        message: form.content
      };

      emailjs.send('service_kjp37ef', 'template_ps03fo8', templateParams, '4B-9egCPFKnE3sLzN')
      .then(() => {
        alert('문의가 성공적으로 전송되었습니다!');
        setForm({ name: '', content: '', email: '' });
      })
      .catch((error) => {
        console.error('EmailJS 오류:', error);
        alert('전송 중 오류가 발생했습니다.');
      });
    }
  };

  const currentCategories = mode === 'Std' ? categoriesStd : categoriesLab;
  const modeFilteredProjects = firestoreProjects.filter(p => p.mode === mode);
  
  const filteredProjects = modeFilteredProjects.filter(project => {
    const categoryMatch = category === 'All Project' || project.category === category;
    const searchMatch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (project.sub && project.sub.toLowerCase().includes(searchTerm.toLowerCase()));
    return categoryMatch && searchMatch;
  });

  const handleCardClick = (project) => {
    navigate(`/project/${project.id}`, { state: { project } });
  };

  return (
    <div className="App">
      <header className="header">
        <div className="logo" onClick={handleReset}>ESSENT.STUDIO</div>
        <div className="nav-switch">
          <span className={mode === 'Std' ? 'active' : ''} onClick={() => { setMode('Std'); setCategory('All Project'); }}>Std</span> 
          <span style={{color: '#fff', margin: '0 4px'}}>/</span> 
          <span className={mode === 'Lab' ? 'active' : ''} onClick={() => { setMode('Lab'); setCategory('All Project'); }}>Lab</span>
        </div>
        <div className="lets-talk">Let's Talk</div>
      </header>

      <div className="container">
        <main className="left-content">
          <div className="sub-header">
            <div className="filter-bar">
              <span className={`filter-item ${category === 'All Project' ? 'active' : ''}`} onClick={() => setCategory('All Project')}>All Project</span>
              {currentCategories.map(cat => (
                <span key={cat} className={`filter-item ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</span>
              ))}
            </div>
          </div>

          <div className="title-area">
            <h1 style={{fontSize: '40px', fontWeight: '600', lineHeight:'1', margin: 0}}>{category}</h1>
            <input type="text" placeholder="Search..." className="search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {loading ? (
            <div style={{padding: '40px', textAlign: 'center', color: '#888'}}>프로젝트 불러오는 중...</div>
          ) : filteredProjects.length === 0 ? (
            <div style={{padding: '40px', textAlign: 'center', color: '#888'}}>{searchTerm ? '검색 결과가 없습니다.' : '아직 프로젝트가 없습니다.'}</div>
          ) : (
            <div className="masonry-grid">
              {filteredProjects.map((project) => (
                <div className="project-card" key={project.id} onClick={() => handleCardClick(project)}>
                  
                  {/* 🆕 썸네일이 동영상이면 비디오 재생, 아니면 이미지 */}
                  {project.thumbnail && isVideo(project.thumbnail) ? (
                    <video 
                      src={project.thumbnail}
                      className="project-img"
                      autoPlay  // 자동 재생
                      muted     // 소리 끔 (필수)
                      loop      // 무한 반복
                      playsInline // 모바일 호환
                      style={{ objectFit: 'cover' }} // 꽉 차게 보이기
                    />
                  ) : (
                    <img 
                      src={project.thumbnail || project.imageUrl} 
                      alt={project.title}
                      className="project-img"
                    />
                  )}

                  <div className="card-overlay">
                    <div>
                      <h3 style={{fontSize: '16px', fontWeight: 'bold'}}>{project.title}</h3>
                      <p style={{fontSize: '13px', color: '#ccc', marginTop: '5px'}}>{project.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="right-sidebar">
          <div className="intro-text">
            <p style={{marginBottom: '24px'}}>Essent는 디자인으로 소통을 설계하는 디자인 스튜디오 입니다.</p>
            <p style={{marginBottom: '24px'}}>디자인은 혼자 만드는 결과물이 아니라, 여러 이해 관계자와의 대화 속에서 완성된다고 생각합니다.</p>
            <p>Essent는 계속해서 배우고 정리하며, 의도를 정확히 전달하고 이해하는 과정을 통해 소통이 되는 디자이너로 일하기 위해 운영됩니다.</p>
          </div>

          <div className="contact-info">
            <div className="contact-row">
              <span className="contact-label">Email</span>
              <span className="contact-value"><a href="mailto:Essent.des@gmail.com">Essent.std@gmail.com</a></span>
            </div>
            <div className="contact-row">
              <span className="contact-label">Instagram</span>
              <span className="contact-value"><a href="https://www.instagram.com/Essent.std" target="_blank" rel="noopener noreferrer">@Essent.std</a></span>
            </div>
            <div className="contact-row">
              <span className="contact-label">Behance</span>
              <span className="contact-value"><a href="https://www.behance.net/essentstd" target="_blank" rel="noopener noreferrer">@Essent.std</a></span>
            </div>
          </div>

          <div className="contact-form-area">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom:'1px solid #333', paddingBottom:'12px', marginBottom:'15px'}}>
              <h3 style={{fontSize:'22px', fontWeight:'normal', margin: 0}}>프로젝트 문의</h3>
              <button className="submit-btn" type="button" onClick={handleSubmit}>문의하기</button>
            </div>

            <form className="contact-form">
              <div className="input-group">
                <label className="form-label">담당자 이름</label>
                <input type="text" name="name" value={form.name} onChange={handleInput} className="form-input" autoComplete="off" />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div className="input-group">
                <label className="form-label">프로젝트 내용</label>
                <textarea name="content" rows="4" value={form.content} onChange={handleInput} className="form-textarea"></textarea>
                {errors.content && <p className="error-text">{errors.content}</p>}
              </div>
              <div className="input-group">
                <label className="form-label">EMAIL</label>
                <input type="email" name="email" value={form.email} onChange={handleInput} className="form-input" autoComplete="off" />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/project/:id" element={<Detail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
}

export default App;