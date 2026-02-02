import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MobileDetail.css';

// 프로젝트 데이터 (App.js와 동일)
const projects = [
  {
    id: 1,
    title: 'Project Alpha',
    year: '2024',
    category: 'branding',
    thumbnail: 'https://picsum.photos/400/300?random=1',
    subImages: [
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3'
    ],
    description: 'A comprehensive branding project for a tech startup.'
  },
  {
    id: 2,
    title: 'Project Beta',
    year: '2023',
    category: 'space',
    thumbnail: 'https://picsum.photos/400/300?random=4',
    subImages: [
      'https://picsum.photos/400/300?random=5'
    ],
    description: 'Interior design for a modern office space.'
  },
  {
    id: 3,
    title: 'Project Gamma',
    year: '2024',
    category: 'digital',
    thumbnail: 'https://picsum.photos/400/300?random=6',
    subImages: [
      'https://picsum.photos/400/300?random=7',
      'https://picsum.photos/400/300?random=8',
      'https://picsum.photos/400/300?random=9'
    ],
    description: 'Digital campaign for a fashion brand.'
  },
  {
    id: 4,
    title: 'Project Delta',
    year: '2023',
    category: 'branding',
    thumbnail: 'https://picsum.photos/400/300?random=10',
    subImages: [],
    description: 'Brand identity for a coffee shop chain.'
  },
  {
    id: 5,
    title: 'Project Epsilon',
    year: '2024',
    category: 'space',
    thumbnail: 'https://picsum.photos/400/300?random=11',
    subImages: [
      'https://picsum.photos/400/300?random=12'
    ],
    description: 'Restaurant interior design project.'
  },
  {
    id: 6,
    title: 'Project Zeta',
    year: '2023',
    category: 'digital',
    thumbnail: 'https://picsum.photos/400/300?random=13',
    subImages: [
      'https://picsum.photos/400/300?random=14',
      'https://picsum.photos/400/300?random=15'
    ],
    description: 'E-commerce website design and development.'
  }
];

function MobileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);

  const project = projects.find(p => p.id === parseInt(id));
  const isVideo = (url) => url && url.match(/\.(mp4|webm|ogg|mov)$/i);

  // 모든 이미지 수집
  const allImages = [];
  
  if (project?.thumbnail) {
    allImages.push(project.thumbnail);
  }
  
  if (project?.subImages && Array.isArray(project.subImages)) {
    allImages.push(...project.subImages);
  }

  // 🔥 스크롤 이벤트 - 현재 인덱스 감지 (Hook을 최상단에 배치)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleScroll = () => {
      const scrollLeft = slider.scrollLeft;
      const itemWidth = slider.offsetWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    };

    slider.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      slider.removeEventListener('scroll', handleScroll);
    };
  }, [currentIndex]);

  // 🔥 터치 이벤트
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStart - touchEnd;
    
    // 오른쪽 스와이프 & 첫 이미지 = 닫기
    if (distance < -100 && currentIndex === 0) {
      navigate('/');
    }
  };

  // 🔥 프로젝트가 없을 때만 early return
  if (!project) {
    return (
      <div className="mobile-detail">
        <header className="mobile-detail-header">
          <div className="mobile-logo" onClick={() => navigate('/')}>
            ESSENT.STUDIO
          </div>
        </header>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Project not found</h2>
          <button onClick={() => navigate('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-detail">
      <header className="mobile-detail-header">
        <div className="mobile-logo" onClick={() => navigate('/')}>
          ESSENT.STUDIO
        </div>
      </header>

      <div 
        ref={sliderRef}
        className="mobile-slider-wrapper"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-slider-track">
          {allImages.length === 0 ? (
            <div className="mobile-slide">
              <div style={{ color: '#999', textAlign: 'center' }}>
                No images available
              </div>
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
                  />
                ) : (
                  <img 
                    src={media} 
                    alt={`${project.title} ${idx + 1}`}
                    draggable="false"
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* 🔥 Pagination Dots */}
        <div className="mobile-pagination">
          {allImages.map((_, idx) => (
            <div 
              key={idx}
              className={`mobile-dot ${idx === currentIndex ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="mobile-info">
        <h2>{project.title}</h2>
        <p className="mobile-year">{project.year}</p>
        <p className="mobile-category">{project.category.toUpperCase()}</p>
        <p className="mobile-description">{project.description}</p>
      </div>
    </div>
  );
}

export default MobileDetail;