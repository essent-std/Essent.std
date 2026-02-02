import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import './Mobile.css';
import './MobileDetail.css';
import Detail from './Detail';
import MobileDetail from './MobileDetail';
import emailjs from '@emailjs/browser';
import AdminPage from './AdminPage';
import Upload from './Upload';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';  
import Login from './Login';

// ==============================================================================
// 1. MainPage 컴포넌트
// ==============================================================================
function MainPage({ firestoreProjects, loading, categoriesStd, categoriesLab }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('Std'); 
  const [category, setCategory] = useState('All Project');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  // 🔥 모바일 디테일 오버레이용
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm] = useState({ name: '', content: '', email: '' });
  const [errors, setErrors] = useState({ name: '', content: '', email: '' });

  const isVideo = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  const handleReset = () => {
    window.scrollTo(0, 0);
    setCategory('All Project');
    setForm({ name: '', content: '', email: '' });
    setErrors({});
    setMenuOpen(false); 
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

  // 🔥 카드 클릭 핸들러
  const handleCardClick = (project) => {
    if (window.innerWidth <= 768) {
      setSelectedProject(project);
    } else {
      navigate(`/project/${project.id}`, { state: { project } });
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="logo" onClick={handleReset}>ESSENT.STUDIO</div>
        
        <div className="nav-switch" style={{ 
            opacity: menuOpen || selectedProject ? 0 : 1, 
            pointerEvents: menuOpen || selectedProject ? 'none' : 'auto',
            transition: 'opacity 0.2s ease'
          }}>
          <span className={mode === 'Std' ? 'active' : ''} onClick={() => { setMode('Std'); setCategory('All Project'); }}>Std</span> 
          <span style={{color: '#fff', margin: '0 4px'}}>/</span> 
          <span className={mode === 'Lab' ? 'active' : ''} onClick={() => { setMode('Lab'); setCategory('All Project'); }}>Lab</span>
        </div>
        
        <div className="lets-talk">Let's Talk</div>
        
        {/* 🔥 햄버거 메뉴 - selectedProject에도 반응 */}
        <div 
          className={`hamburger-menu ${menuOpen || selectedProject ? 'open' : ''}`}
          onClick={() => {
            if (selectedProject) {
              setSelectedProject(null);
            } else {
              setMenuOpen(!menuOpen);
            }
          }}
        >
          <span></span>
          <span></span>
        </div>
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
              {filteredProjects.map((project) => {
                const imageCount = (() => {
                  let count = 0;
                  if (project.thumbnail) count++;
                  else if (project.imageUrl) {
                    count += Array.isArray(project.imageUrl) ? project.imageUrl.length : 1;
                  }
                  if (project.subImages && Array.isArray(project.subImages)) {
                    count += project.subImages.length;
                  }
                  return count;
                })();

                return (
                  <div className="project-card" key={project.id} onClick={() => handleCardClick(project)}>
                    {project.thumbnail && isVideo(project.thumbnail) ? (
                      <video 
                        src={project.thumbnail}
                        className="project-img"
                        autoPlay muted loop playsInline
                        preload="metadata"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <img 
                        src={project.thumbnail || project.imageUrl} 
                        alt={project.title}
                        loading="lazy"
                        className="project-img"
                      />
                    )}
                    
                    {/* 🔥 레이어 아이콘 - 메인 페이지 카드에만 (768px 이하) */}
                    {imageCount > 1 && window.innerWidth <= 768 && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 2
                      }}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <defs>
                            <mask id={`card-mask-${project.id}`}>
                              <rect width="20" height="20" fill="white"/>
                              <rect x="-1" y="-1" width="15" height="15" rx="3" fill="black"/>
                            </mask>
                          </defs>
                          
                          <rect 
                            x="3" 
                            y="3" 
                            width="13" 
                            height="13" 
                            rx="2.5" 
                            fill="rgba(255, 255, 255, 0.8)"
                            mask={`url(#card-mask-${project.id})`}
                            style={{filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.15))'}}
                          />
                          
                          <rect 
                            x="0" 
                            y="0" 
                            width="13" 
                            height="13" 
                            rx="2.5" 
                            fill="#FFFFFF"
                            style={{filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'}}
                          />
                        </svg>
                      </div>
                    )}
                    
                    <div className="card-overlay">
                      <div>
                        <h3 style={{fontSize: '16px', fontWeight: 'bold'}}>{project.title}</h3>
                        <p style={{fontSize: '13px', color: '#ccc', marginTop: '5px'}}>{project.sub}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mobile-footer-content" style={{ padding: '40px 20px 30px 20px' }}>
            <div className="intro-text" style={{marginTop: 0}}>
              <p>Essent는 디자인으로 소통을 설계하는 디자인 스튜디오 입니다.</p>
              <p>디자인은 혼자 만드는 결과물이 아니라, 여러 이해 관계자와의 대화 속에서 완성된다고 생각합니다.</p>
              <p>Essent는 계속해서 배우고 정리하며, 의도를 정확히 전달하고 이해하는 과정을 통해 소통이 되는 디자이너로 일하기 위해 운영됩니다.</p>
            </div>
            
            <div className="contact-info">
              <div className="contact-row">
                <span className="contact-label">Email</span>
                <span className="contact-value"><a href="mailto:Essent.std@gmail.com">Essent.std@gmail.com</a></span>
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
          </div>
        </main>

        <aside className="right-sidebar">
          <div className="intro-text">
            <p style={{marginBottom: '24px'}}>Essent는 디자인으로 소통을 설계하는 디자인 스튜디오 입니다.</p>
            <p style={{marginBottom: '24px'}}>디자인은 혼자 만드는 결과물이 아니라, 여러 이해 관계자와의 대화 속에서 완성된다고 생각합니다.</p>
            <p>Essent는 계속해서 배우고 정리하며, 의도를 정확히 전달하고 이해하는 과정을 통해 소통이 되는 디자이너로 일하기 위해 운영됩니다.</p>
          </div>
          <div className="contact-info">
            <div className="contact-row"><span className="contact-label">Email</span><span className="contact-value"><a href="mailto:Essent.std@gmail.com">Essent.std@gmail.com</a></span></div>
            <div className="contact-row"><span className="contact-label">Instagram</span><span className="contact-value"><a href="https://www.instagram.com/Essent.std" target="_blank" rel="noopener noreferrer">@Essent.std</a></span></div>
            <div className="contact-row"><span className="contact-label">Behance</span><span className="contact-value"><a href="https://www.behance.net/essentstd" target="_blank" rel="noopener noreferrer">@Essent.std</a></span></div>
          </div>
          <div className="contact-form-area">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom:'1px solid #333', paddingBottom:'12px', marginBottom:'15px'}}>
              <h3 style={{fontSize:'22px', fontWeight:'normal', margin: 0}}>프로젝트 문의</h3>
              <button className="submit-btn" type="button" onClick={handleSubmit}>문의하기</button>
            </div>
            <form className="contact-form">
              <div className="input-group">
                <label className="form-label">담당자 이름</label>
                <input type="text" name="name" value={form.name} onChange={handleInput} className="form-input" />
                {errors.name && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>{errors.name}</p>}
              </div>
              <div className="input-group">
                <label className="form-label">프로젝트 내용</label>
                <textarea name="content" rows="4" value={form.content} onChange={handleInput} className="form-textarea"></textarea>
                {errors.content && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>{errors.content}</p>}
              </div>
              <div className="input-group">
                <label className="form-label">EMAIL</label>
                <input type="email" name="email" value={form.email} onChange={handleInput} className="form-input" />
                {errors.email && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>{errors.email}</p>}
              </div>
            </form>
          </div>
        </aside>
      </div>

      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <h2 className="mobile-menu-title">Let's Talk</h2>
          
          <div className="intro-text" style={{marginTop: 0}}>
            <p style={{marginBottom: '20px'}}>Essent는 디자인으로 소통을 설계하는 디자인 스튜디오 입니다.</p>
            <p style={{marginBottom: '20px'}}>디자인은 혼자 만드는 결과물이 아니라, 여러 이해 관계자와의 대화 속에서 완성된다고 생각합니다.</p>
            <p>Essent는 계속해서 배우고 정리하며, 의도를 정확히 전달하고 이해하는 과정을 통해 소통이 되는 디자이너로 일하기 위해 운영됩니다.</p>
          </div>

          <div className="contact-info" style={{marginTop: '30px', marginBottom: '40px'}}>
            <div className="contact-row">
              <span className="contact-label" style={{width:'100px'}}>Email</span>
              <span className="contact-value"><a href="mailto:Essent.std@gmail.com">Essent.std@gmail.com</a></span>
            </div>
            <div className="contact-row">
              <span className="contact-label" style={{width:'100px'}}>Instagram</span>
              <span className="contact-value"><a href="https://www.instagram.com/Essent.std" target="_blank" rel="noopener noreferrer">@Essent.std</a></span>
            </div>
            <div className="contact-row">
              <span className="contact-label" style={{width:'100px'}}>Behance</span>
              <span className="contact-value"><a href="https://www.behance.net/essentstd" target="_blank" rel="noopener noreferrer">@Essent.std</a></span>
            </div>
          </div>

          <div className="contact-form-area">
            <div className="form-header-area">
              <h3>프로젝트 문의</h3>
              <button className="form-submit-btn" type="button" onClick={handleSubmit}>문의하기</button>
            </div>

            <form className="contact-form">
              <div className="input-group">
                <label className="form-label">담당자 이름</label>
                <input type="text" name="name" value={form.name} onChange={handleInput} className="form-input" />
                {errors.name && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>{errors.name}</p>}
              </div>

              <div className="input-group">
                <label className="form-label">프로젝트 내용</label>
                <textarea name="content" value={form.content} onChange={handleInput} className="form-textarea"></textarea>
                {errors.content && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>*필수 항목입니다.</p>}
              </div>

              <div className="input-group">
                <label className="form-label">EMAIL</label>
                <input type="email" name="email" value={form.email} onChange={handleInput} className="form-input" />
                {errors.email && <p style={{color:'#ff3b30', fontSize:'13px', marginTop:'6px'}}>{errors.email}</p>}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 🔥 모바일 디테일 오버레이 */}
      {selectedProject && (
        <MobileDetailOverlay 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </div>
  );
}

// ==============================================================================
// 🔥 모바일 디테일 오버레이 컴포넌트
// ==============================================================================
function MobileDetailOverlay({ project, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [isClosing, setIsClosing] = useState(false);
  const scrollTimeout = useRef(null);
  const rafId = useRef(null); // 🔥 requestAnimationFrame ID

  const isVideo = (url) => url && url.match(/\.(mp4|webm|ogg|mov)$/i);
  
  const allImages = [];
  
  if (project?.thumbnail) {
    allImages.push(project.thumbnail);
  } else if (project?.imageUrl) {
    if (Array.isArray(project.imageUrl)) {
      allImages.push(...project.imageUrl);
    } else {
      allImages.push(project.imageUrl);
    }
  }
  
  if (project?.subImages && Array.isArray(project.subImages)) {
    allImages.push(...project.subImages);
  }

  // 🔥 스크롤 최적화 - requestAnimationFrame 사용
  const handleScroll = (e) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      const scrollLeft = e.target.scrollLeft;
      const itemWidth = e.target.offsetWidth;
      const index = Math.round(scrollLeft / itemWidth);
      
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        const targetScroll = index * itemWidth;
        if (sliderRef.current) {
          sliderRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        }
      }, 150);
    });
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (currentIndex === 0 && sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      
      if (scrollLeft <= 10) {
        const touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        };
        
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        
        const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY) * 2;
        
        if (isHorizontalSwipe && distanceX < -100) {
          handleClose();
        }
      }
    }
    
    setTouchStart({ x: 0, y: 0 });
  };

  // 🔥 클린업
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  // 🔥 이미지 프리로드
  useEffect(() => {
    allImages.forEach((src) => {
      if (!isVideo(src)) {
        const img = new Image();
        img.src = src;
      }
    });
  }, []);

  return (
    <div 
      className={`mobile-detail-overlay ${isClosing ? 'closing' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mobile-detail-container">
        <header className="mobile-detail-header">
          <div className="mobile-logo" onClick={handleClose}>
            ESSENT.STUDIO
          </div>
        </header>

        <div 
          ref={sliderRef}
          className="mobile-slider-wrapper"
          onScroll={handleScroll}
        >
          <div className="mobile-slider-track">
            {allImages.length === 0 ? (
              <div className="mobile-slide">
                <div style={{ color: '#666' }}>No images</div>
              </div>
            ) : (
              allImages.map((media, idx) => (
                <div 
                  key={idx} 
                  className="mobile-slide"
                >
                  {isVideo(media) ? (
                    <video 
                      src={media} 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={media} 
                      alt={`${idx + 1}`} 
                      draggable="false"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {allImages.length > 1 && (
          <div className="mobile-pagination">
            {allImages.map((_, idx) => (
              <div 
                key={idx}
                className={`mobile-dot ${idx === currentIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="mobile-info">
          <h1>{project.title}</h1>
          <p className="mobile-description">
            {project.desc || project.description}
          </p>
          
          <div className="mobile-meta">
            {project.date && (
              <div className="mobile-meta-row">
                <span className="mobile-meta-label">Date</span>
                <span className="mobile-meta-value">{project.date}</span>
              </div>
            )}
            {project.client && (
              <div className="mobile-meta-row">
                <span className="mobile-meta-label">Client</span>
                <span className="mobile-meta-value">{project.client}</span>
              </div>
            )}
            {project.role && (
              <div className="mobile-meta-row">
                <span className="mobile-meta-label">Role</span>
                <span className="mobile-meta-value">{project.role}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// DetailRouter 컴포넌트
// ==============================================================================
function DetailRouter() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.classList.add('detail-open');
    
    return () => {
      document.body.classList.remove('detail-open');
    };
  }, []);

  return isMobile ? <MobileDetail /> : <Detail />;
}

// ==============================================================================
// App 컴포넌트
// ==============================================================================
function App() {
  const [firestoreProjects, setFirestoreProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesStd, setCategoriesStd] = useState([]);
  const [categoriesLab, setCategoriesLab] = useState([]);

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

  return (
    <Routes>
      <Route path="/" element={
        <MainPage 
          firestoreProjects={firestoreProjects} 
          loading={loading}
          categoriesStd={categoriesStd}
          categoriesLab={categoriesLab}
        />
      } />
      <Route path="/project/:id" element={<DetailRouter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/upload" element={<Upload />} />
    </Routes>
  );
}
  
export default App;