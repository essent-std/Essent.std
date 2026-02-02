import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth'; 
import './Detail.css';

function Detail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ☁️ Cloudinary 설정 (기존 설정 유지)
  const CLOUD_NAME = "dcy83vtu9"; 
  const UPLOAD_PRESET = "portfolio_preset";

  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // 🔐 관리자 로그인 상태 확인
  const [isAdmin, setIsAdmin] = useState(false);

  // 🆕 동영상인지 확인하는 함수 (확장자 체크)
  const isVideo = (url) => {
    return url && url.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true); 
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 프로젝트 데이터 로드
  useEffect(() => {
    if (!project && id) {
      const fetchProject = async () => {
        try {
          const docRef = doc(db, 'projects', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProject({ id: docSnap.id, ...docSnap.data() });
          } else {
            alert('프로젝트를 찾을 수 없습니다.');
            navigate('/');
          }
        } catch (error) {
          console.error('프로젝트 로드 실패:', error);
          navigate('/');
        } finally {
          setLoading(false);
        }
      };
      
      fetchProject();
    }
  }, [id, project, navigate]);

  // 파일 선택
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // ☁️ Cloudinary 업로드 함수 (동영상 지원 수정)
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    const uploadedUrls = [];

    try {
      // 1. 선택한 파일들을 Cloudinary로 전송
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, // 👈 auto/upload 로 변경 (비디오 지원)
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        console.log("업로드 된 주소:", data.secure_url); 
        uploadedUrls.push(data.secure_url);
      }

      // 2. Firestore에 이미지/영상 주소 추가
      const docRef = doc(db, 'projects', project.id);
      
      const currentSubImages = project.subImages || []; 
      const newSubImages = [...currentSubImages, ...uploadedUrls];
      
      await updateDoc(docRef, {
        subImages: newSubImages
      });

      alert('상세 파일 추가 완료! 🎉');
      
      // 3. 화면 즉시 업데이트
      setProject(prev => ({
        ...prev,
        subImages: newSubImages
      }));
      
      setSelectedFiles([]); 

    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 실패.. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="detail-container">로딩 중...</div>;
  if (!project) return null;

  // 썸네일이나 메인 이미지가 없을 경우를 대비한 변수 처리
  const mainImage = project.thumbnail || project.imageUrl;

  return (
    <div className="detail-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>ESSENT.STUDIO</div>
      </header>

      <div className="main-body">
        <main className="left-panel">
          {/* 1. 메인 이미지 (또는 동영상) */}
          {mainImage && (
            <div className="media-wrapper">
              {isVideo(mainImage) ? (
                <video 
                  src={mainImage} 
                  className="img-block" 
                  controls autoPlay muted loop playsInline 
                />
              ) : (
                <img src={mainImage} alt="Main" className="img-block" />
              )}
            </div>
          )}

          {/* 2. 상세 이미지들 (또는 동영상) */}
          {project.subImages && project.subImages.map((imgUrl, idx) => (
            <div key={idx} className="media-wrapper">
              {isVideo(imgUrl) ? (
                <video 
                  src={imgUrl} 
                  className="img-block" 
                  controls autoPlay muted loop playsInline 
                />
              ) : (
                <img src={imgUrl} alt={`Sub ${idx}`} className="img-block" />
              )}
            </div>
          ))}

          {/* 📸 관리자만 보이는 업로드 구역 */}
          {isAdmin && (
            <div className="admin-upload-section" style={{ marginTop: '30px', padding: '20px', border: '1px dashed #666', borderRadius: '8px' }}>
              <h4 style={{color: '#fff', marginBottom: '10px'}}>📸 상세 파일 추가 (이미지 & 동영상)</h4>
              <input 
                type="file" 
                multiple 
                accept="image/*, video/*" // 👈 비디오 선택 허용
                onChange={handleFileSelect}
                style={{color: '#fff', marginBottom: '10px'}}
              />
              
              {selectedFiles.length > 0 && (
                <button 
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: uploading ? '#555' : 'blue',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {uploading ? '업로드 중... (영상은 오래 걸릴 수 있음)' : '추가하기'}
                </button>
              )}
            </div>
          )}
        </main>

        <aside className="right-panel">
          <div className="txt-content">
            <h1 className="project-title">{project.title}</h1>
            <p className="project-subtitle" style={{color:'#888', marginBottom:'20px'}}>{project.sub}</p>
            
            <div className="project-meta" style={{marginBottom:'30px', fontSize:'14px', color:'#ccc'}}>
              <p>Date : {project.date}</p>
              <p>Role : {project.role}</p>
              <p>Client : {project.client}</p>
            </div>

            <p className="project-desc" style={{whiteSpace: 'pre-line'}}>
              {project.desc}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Detail;