import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase'; // auth 추가 (로그인 확인용)
import { onAuthStateChanged } from 'firebase/auth'; // 로그인 감지
import './Detail.css';

function Detail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // ☁️ Cloudinary 설정 (Upload.js와 똑같이 입력하세요!)
  const CLOUD_NAME = "dcy83vtu9"; 
  const UPLOAD_PRESET = "portfolio_preset";

  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // 🔐 관리자 로그인 상태 확인
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 로그인했는지 감시
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true); // 로그인했으면 관리자 권한 부여
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

  // ☁️ Cloudinary 업로드 함수
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
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data = await response.json();
        console.log("업로드 된 주소:", data.secure_url); // 확인용 로그
        uploadedUrls.push(data.secure_url);
      }

      // 2. Firestore에 이미지 주소 추가 (기존 이미지 + 새 이미지)
      const docRef = doc(db, 'projects', project.id);
      
      // 기존 subImages가 없으면 빈 배열로 시작
      const currentSubImages = project.subImages || []; 
      const newSubImages = [...currentSubImages, ...uploadedUrls];
      
      await updateDoc(docRef, {
        subImages: newSubImages
      });

      alert('상세 이미지 추가 완료! 🎉');
      
      // 3. 화면 즉시 업데이트
      setProject(prev => ({
        ...prev,
        subImages: newSubImages
      }));
      
      setSelectedFiles([]); // 파일 선택 초기화

    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드 실패.. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="detail-container">로딩 중...</div>;
  if (!project) return null;

  return (
    <div className="detail-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>ESSENT.STUDIO</div>
        {/* 네비게이션 등등... */}
      </header>

      <div className="main-body">
        <main className="left-panel">
          {/* 1. 메인 이미지 */}
          {project.imageUrl && (
            <img src={project.imageUrl} alt="Main" className="img-block" />
          )}

          {/* 2. 상세 이미지들 (subImages) */}
          {project.subImages && project.subImages.map((imgUrl, idx) => (
            <img key={idx} src={imgUrl} alt={`Sub ${idx}`} className="img-block" />
          ))}

          {/* 📸 관리자만 보이는 업로드 구역 */}
          {isAdmin && (
            <div className="admin-upload-section" style={{ marginTop: '30px', padding: '20px', border: '1px dashed #666', borderRadius: '8px' }}>
              <h4 style={{color: '#fff', marginBottom: '10px'}}>📸 상세 이미지 추가 (관리자용)</h4>
              <input 
                type="file" 
                multiple 
                accept="image/*"
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
                  {uploading ? '업로드 중...' : '추가하기'}
                </button>
              )}
            </div>
          )}
        </main>

        <aside className="right-panel">
          <div className="txt-content">
            <h1 className="project-title">{project.title}</h1>
            <p className="project-desc">{project.desc}</p>
            {/* 메타 정보 등등... */}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Detail;