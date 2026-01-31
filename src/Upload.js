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
  
  // 🆕 메타 정보
  const [date, setDate] = useState('');
  const [role, setRole] = useState('');
  const [client, setClient] = useState('');
  
  // 🆕 카테고리 목록
  const [categoriesStd, setCategoriesStd] = useState([]);
  const [categoriesLab, setCategoriesLab] = useState([]);
  
  // 🆕 이미지 분리
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [detailFiles, setDetailFiles] = useState([]);
  
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [detailPreviews, setDetailPreviews] = useState([]);
  
  const [uploading, setUploading] = useState(false);

  // 🆕 카테고리 불러오기
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

  // 썸네일 이미지 선택
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // 상세 이미지들 선택 (여러 개)
  const handleDetailFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setDetailFiles(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setDetailPreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnailFile) {
      alert('썸네일 이미지를 선택해주세요!');
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

      // 1️⃣ 썸네일 업로드
      const thumbnailFormData = new FormData();
      thumbnailFormData.append('file', thumbnailFile);
      thumbnailFormData.append('upload_preset', cloudinaryConfig.uploadPreset);
      thumbnailFormData.append('folder', 'portfolio/thumbnails');

      console.log('2. 썸네일 업로드 중...');
      const thumbnailResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
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

      // 2️⃣ 상세 이미지들 업로드
      const detailImageUrls = [];
      
      if (detailFiles.length > 0) {
        console.log('4. 상세 이미지 업로드 중...');
        
        for (let i = 0; i < detailFiles.length; i++) {
          const formData = new FormData();
          formData.append('file', detailFiles[i]);
          formData.append('upload_preset', cloudinaryConfig.uploadPreset);
          formData.append('folder', 'portfolio/details');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData
            }
          );

          if (!response.ok) {
            throw new Error(`상세 이미지 ${i + 1} 업로드 실패`);
          }

          const data = await response.json();
          detailImageUrls.push(data.secure_url);
          console.log(`   - 상세 이미지 ${i + 1}/${detailFiles.length} 완료`);
        }
      }

      // 3️⃣ Firestore에 프로젝트 정보 저장
      const projectData = {
        mode: mode,
        category: category,
        title: title,
        sub: subtitle,
        desc: description,
        
        // 🆕 이미지 분리
        thumbnail: thumbnailData.secure_url,
        subImages: detailImageUrls,
        
        // 🆕 메타 정보
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

      // 폼 초기화
      setTitle('');
      setSubtitle('');
      setDescription('');
      setCategory('');
      setDate('');
      setRole('');
      setClient('');
      setThumbnailFile(null);
      setDetailFiles([]);
      setThumbnailPreview(null);
      setDetailPreviews([]);

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
                setCategory(''); // 모드 변경 시 카테고리 초기화
              }}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              <option value="Std">Std</option>
              <option value="Lab">Lab</option>
            </select>
          </div>

          {/* 🆕 카테고리 선택 (Mode에 따라 동적 변경) */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Category *</p>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            >
              <option value="">카테고리 선택</option>
              {mode === 'Std' 
                ? categoriesStd.map(cat => <option key={cat} value={cat}>{cat}</option>)
                : categoriesLab.map(cat => <option key={cat} value={cat}>{cat}</option>)
              }
            </select>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="프로젝트 제목 *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* 부제목 */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="부제목"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '20px' }}>
            <textarea
              placeholder="프로젝트 설명"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="5"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 메타 정보 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '10px',
            marginBottom: '20px' 
          }}>
            <input
              type="text"
              placeholder="Date (예: 2026)"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            />
            <input
              type="text"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            />
            <input
              type="text"
              placeholder="Client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '14px',
                border: '1px solid #333',
                backgroundColor: '#1e1e1e',
                color: 'white',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* 썸네일 이미지 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#ddd' }}>📌 썸네일 이미지 (메인 페이지용) *</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1e1e1e',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
            {thumbnailPreview && (
              <img 
                src={thumbnailPreview} 
                alt="썸네일 미리보기" 
                style={{ 
                  width: '100%', 
                  marginTop: '10px',
                  borderRadius: '4px',
                  border: '1px solid #333'
                }} 
              />
            )}
          </div>

          {/* 상세 이미지들 */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ marginBottom: '10px', color: '#ddd' }}>📸 상세 이미지들 (여러 개 선택 가능)</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleDetailFilesChange}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1e1e1e',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
            {detailPreviews.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px',
                marginTop: '10px' 
              }}>
                {detailPreviews.map((preview, idx) => (
                  <img 
                    key={idx}
                    src={preview} 
                    alt={`상세 ${idx + 1}`} 
                    style={{ 
                      width: '100%',
                      borderRadius: '4px',
                      border: '1px solid #333'
                    }} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
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
            {uploading ? '업로드 중...' : '프로젝트 올리기 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
