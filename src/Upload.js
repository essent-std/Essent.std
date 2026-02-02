import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { cloudinaryConfig } from './cloudinaryConfig';

function Upload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('Std');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 메타 정보
  const [date, setDate] = useState('');
  const [role, setRole] = useState('');
  const [client, setClient] = useState('');
  
  // 카테고리 목록
  const [categoriesStd, setCategoriesStd] = useState([]);
  const [categoriesLab, setCategoriesLab] = useState([]);
  
  // 이미지/영상 파일 관리
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [detailPreviews, setDetailPreviews] = useState([]);
  
  const [uploading, setUploading] = useState(false);

  // 카테고리 불러오기
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const docRef = doc(db, 'settings', 'categories');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategoriesStd(data.std || []);
        setCategoriesLab(data.lab || []);
      }
    } catch (error) {
      console.error('카테고리 불러오기 실패:', error);
    }
  };

  // 썸네일 파일 선택 (이미지 or 동영상)
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // 상세 파일들 선택 (이미지 or 동영상)
  const handleDetailFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setDetailFiles(files);
    
    // 미리보기 만들 때 타입(video/image)도 같이 저장
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setDetailPreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnailFile) {
      alert('썸네일 파일을 선택해주세요!');
      return;
    }

    if (!title.trim()) {
      alert('제목을 입력해주세요!');
      return;
    }

    if (!category) {
      alert('카테고리를 선택해주세요!');
      return;
    }

    try {
      setUploading(true);
      console.log('1. 업로드 시작...');

      // 1️⃣ 썸네일 업로드 (Video 지원을 위해 auto/upload 사용)
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', thumbnailFile);
      thumbnailFormData.append('upload_preset', cloudinaryConfig.uploadPreset);
      thumbnailFormData.append('folder', 'portfolio/thumbnails');

      console.log('2. 썸네일 업로드 중...');
      const thumbnailResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`, // 👈 여기가 핵심!
        {
          method: 'POST',
          body: thumbnailFormData
        }
      );

      if (!thumbnailResponse.ok) {
        throw new Error('썸네일 업로드 실패');
      }

      const thumbnailData = await thumbnailResponse.json();
      console.log('3. 썸네일 업로드 완료:', thumbnailData.secure_url);

      // 2️⃣ 상세 파일들 업로드
      const detailImageUrls = [];
      
      if (detailFiles.length > 0) {
        console.log('4. 상세 파일 업로드 중...');
        
        for (let i = 0; i < detailFiles.length; i++) {
          const formData = new FormData();
          formData.append('file', detailFiles[i]);
          formData.append('upload_preset', cloudinaryConfig.uploadPreset);
          formData.append('folder', 'portfolio/details');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`, // 👈 여기도 auto로 변경!
            {
              method: 'POST',
              body: formData
            }
          );

          if (!response.ok) {
            throw new Error(`상세 파일 ${i + 1} 업로드 실패`);
          }

          const data = await response.json();
          detailImageUrls.push(data.secure_url);
          console.log(`   - 상세 파일 ${i + 1}/${detailFiles.length} 완료`);
        }
      }

      // 3️⃣ Firestore에 프로젝트 정보 저장
      const projectData = {
        mode: mode,
        category: category,
        title: title,
        sub: subtitle,
        desc: description,
        
        thumbnail: thumbnailData.secure_url,
        subImages: detailImageUrls,
        
        date: date || new Date().getFullYear().toString(),
        role: role || 'Design',
        client: client || 'Client',
        
        color: '#333',
        height: '400px',
        createdAt: serverTimestamp()
      };

      console.log('5. Firestore 저장 중:', projectData);

      const docRef = await addDoc(collection(db, 'projects'), projectData);

      console.log('6. 저장 완료! 문서 ID:', docRef.id);

      alert('✅ 업로드 성공!');
      window.location.reload(); // 업로드 후 새로고침

    } catch (error) {
      console.error('❌ 업로드 실패:', error);
      alert(`업로드 실패: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#121212',
      color: '#fff',
      padding: '50px 20px'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '32px', margin: 0 }}>Project Upload</h1>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            관리자 페이지
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 모드 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Mode *</p>
            <select 
              value={mode} 
              onChange={(e) => {
                setMode(e.target.value);
                setCategory('');
              }}
              style={inputStyle}
            >
              <option value="Std">Std</option>
              <option value="Lab">Lab</option>
            </select>
          </div>

          {/* 카테고리 선택 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Category *</p>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">카테고리 선택</option>
              {mode === 'Std' 
                ? categoriesStd.map(cat => <option key={cat} value={cat}>{cat}</option>)
                : categoriesLab.map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>

          {/* 제목, 부제목, 설명 */}
          <input type="text" placeholder="프로젝트 제목 *" value={title} onChange={(e) => setTitle(e.target.value)} required style={{...inputStyle, marginBottom: '20px'}} />
          <input type="text" placeholder="부제목" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} style={{...inputStyle, marginBottom: '20px'}} />
          <textarea placeholder="프로젝트 설명" value={description} onChange={(e) => setDescription(e.target.value)} rows="5" style={{...inputStyle, marginBottom: '20px', resize: 'vertical'}} />

          {/* 메타 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="Date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Client" value={client} onChange={(e) => setClient(e.target.value)} style={inputStyle} />
          </div>

          {/* 썸네일 업로드 (비디오 가능!) */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#ddd' }}>📌 썸네일 (이미지 또는 영상) *</p>
            <input
              type="file"
              accept="image/*, video/*" // 👈 비디오 허용!
              onChange={handleThumbnailChange}
              required
              style={inputStyle}
            />
            {thumbnailPreview && (
              <div style={{ marginTop: '10px' }}>
                {thumbnailFile && thumbnailFile.type.startsWith('video') ? (
                  <video src={thumbnailPreview} autoPlay muted loop style={{ width: '100%', borderRadius: '4px', border: '1px solid #333' }} />
                ) : (
                  <img src={thumbnailPreview} alt="썸네일" style={{ width: '100%', borderRadius: '4px', border: '1px solid #333' }} />
                )}
              </div>
            )}
          </div>

          {/* 상세 파일 업로드 (비디오 가능!) */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#ddd' }}>📸 상세 파일 (이미지 & 동영상)</p>
            <input
              type="file"
              accept="image/*, video/*" // 👈 비디오 허용!
              multiple
              onChange={handleDetailFilesChange}
              style={inputStyle}
            />
            {detailPreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                {detailPreviews.map((item, idx) => (
                  <div key={idx}>
                    {item.type === 'video' ? (
                      <video src={item.url} controls style={{ width: '100%', borderRadius: '4px', border: '1px solid #333' }} />
                    ) : (
                      <img src={item.url} alt={`상세 ${idx}`} style={{ width: '100%', borderRadius: '4px', border: '1px solid #333' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              backgroundColor: uploading ? '#555' : '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {uploading ? '업로드 중... (영상은 조금 더 걸려요)' : '프로젝트 올리기 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 스타일 변수 (깔끔하게 정리)
const inputStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '16px',
  border: '1px solid #333',
  backgroundColor: '#1e1e1e',
  color: 'white',
  borderRadius: '4px'
};

export default Upload;