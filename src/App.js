import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isOpacityMode, setIsOpacityMode] = useState(false);
  const containerRef = useRef(null);
  const imageRefs = [useRef(null), useRef(null)];
  
  // Store complete transforms for both images
  const transforms = useRef([
    { scale: 1, x: 0, y: 0, width: 0, height: 0, loaded: false },
    { scale: 1, x: 0, y: 0, width: 0, height: 0, loaded: false }
  ]);

  // Current transform for rendering
  const [currentTransform, setCurrentTransform] = useState({
    scale: 1,
    x: 0,
    y: 0
  });

  const centerBothImages = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    
    // Center both images using their natural dimensions
    imageRefs.forEach((ref, index) => {
      if (ref.current && ref.current.naturalWidth > 0) {
        const centerX = (container.width - ref.current.naturalWidth * transforms.current[index].scale) / 2;
        const centerY = (container.height - ref.current.naturalHeight * transforms.current[index].scale) / 2;
        
        transforms.current[index] = {
          ...transforms.current[index],
          x: centerX,
          y: centerY,
          width: ref.current.naturalWidth,
          height: ref.current.naturalHeight,
          loaded: true
        };
      }
    });
    
    // Update the current transform
    setCurrentTransform({
      scale: transforms.current[activeImageIndex].scale,
      x: transforms.current[activeImageIndex].x,
      y: transforms.current[activeImageIndex].y
    });
  };

  const zoomImages = (zoomIn = true, targetIndex = null) => {
    const scaleFactor = zoomIn ? 1.1 : 0.9;
    
    // Get container center for zoom point
    const container = containerRef.current.getBoundingClientRect();
    const centerX = container.width / 2;
    const centerY = container.height / 2;

    if (isLocked && targetIndex !== null) {
      // Zoom only the specified image when locked
      const current = transforms.current[targetIndex];
      const newScale = Math.max(0.1, Math.min(current.scale * scaleFactor, 10));
      
      const imgX = (centerX - current.x) / current.scale;
      const imgY = (centerY - current.y) / current.scale;
      
      const newX = centerX - imgX * newScale;
      const newY = centerY - imgY * newScale;
      
      transforms.current[targetIndex] = {
        ...current,
        scale: newScale,
        x: newX,
        y: newY
      };
      
      if (targetIndex === activeImageIndex) {
        setCurrentTransform({
          scale: newScale,
          x: newX,
          y: newY
        });
      }
    } else {
      // Zoom both images together when unlocked
      const newTransforms = transforms.current.map(current => {
        const newScale = Math.max(0.1, Math.min(current.scale * scaleFactor, 10));
        
        const imgX = (centerX - current.x) / current.scale;
        const imgY = (centerY - current.y) / current.scale;
        
        const newX = centerX - imgX * newScale;
        const newY = centerY - imgY * newScale;
        
        return {
          ...current,
          scale: newScale,
          x: newX,
          y: newY
        };
      });
      
      transforms.current = newTransforms;
      setCurrentTransform({
        scale: transforms.current[activeImageIndex].scale,
        x: transforms.current[activeImageIndex].x,
        y: transforms.current[activeImageIndex].y
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length >= 2) {
      images.forEach(image => URL.revokeObjectURL(image.url));
      
      const newImages = files.slice(0, 2).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
      
      setImages(newImages);
      setActiveImageIndex(0);
      setIsLocked(false);
      setIsOpacityMode(false);
      
      // Reset transforms for new images
      transforms.current = [
        { scale: 1, x: 0, y: 0, width: 0, height: 0, loaded: false },
        { scale: 1, x: 0, y: 0, width: 0, height: 0, loaded: false }
      ];
      
      setCurrentTransform({ scale: 1, x: 0, y: 0 });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const toggleImage = () => {
    if (!isOpacityMode) {
      setActiveImageIndex(prev => prev === 0 ? 1 : 0);
    }
  };

  const toggleLock = () => {
    setIsLocked(prev => !prev);
  };

  const toggleOpacityMode = () => {
    setIsOpacityMode(prev => !prev);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    
    transforms.current[activeImageIndex].startX = e.clientX - transforms.current[activeImageIndex].x;
    transforms.current[activeImageIndex].startY = e.clientY - transforms.current[activeImageIndex].y;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    if (isLocked) {
      // Only move the active image
      const current = transforms.current[activeImageIndex];
      const newX = mouseX - current.startX;
      const newY = mouseY - current.startY;
      
      transforms.current[activeImageIndex].x = newX;
      transforms.current[activeImageIndex].y = newY;
    } else {
      // Move both images together
      const deltaX = mouseX - transforms.current[activeImageIndex].startX - transforms.current[activeImageIndex].x;
      const deltaY = mouseY - transforms.current[activeImageIndex].startY - transforms.current[activeImageIndex].y;
      
      transforms.current.forEach(transform => {
        transform.x += deltaX;
        transform.y += deltaY;
      });
      
      transforms.current[activeImageIndex].startX = mouseX - transforms.current[activeImageIndex].x;
      transforms.current[activeImageIndex].startY = mouseY - transforms.current[activeImageIndex].y;
    }
    
    setCurrentTransform({
      scale: transforms.current[activeImageIndex].scale,
      x: transforms.current[activeImageIndex].x,
      y: transforms.current[activeImageIndex].y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    
    const delta = -Math.sign(e.deltaY);
    if (isLocked) {
      zoomImages(delta > 0, activeImageIndex);
    } else {
      zoomImages(delta > 0);
    }
  };

  const centerActiveImage = () => {
    if (!containerRef.current || !imageRefs[activeImageIndex].current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    const img = imageRefs[activeImageIndex].current;
    const current = transforms.current[activeImageIndex];
    
    const newX = (container.width - img.naturalWidth * current.scale) / 2;
    const newY = (container.height - img.naturalHeight * current.scale) / 2;
    
    transforms.current[activeImageIndex].x = newX;
    transforms.current[activeImageIndex].y = newY;
    setCurrentTransform(prev => ({ ...prev, x: newX, y: newY }));
  };

  const resetView = () => {
    transforms.current = [
      { scale: 1, x: 0, y: 0, width: transforms.current[0].width, height: transforms.current[0].height, loaded: true },
      { scale: 1, x: 0, y: 0, width: transforms.current[1].width, height: transforms.current[1].height, loaded: true }
    ];
    setCurrentTransform({ scale: 1, x: 0, y: 0 });
    centerBothImages();
  };

  // Set up wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isLocked, activeImageIndex]);

  // Update current transform when active image changes
  useEffect(() => {
    const current = transforms.current[activeImageIndex];
    setCurrentTransform({
      scale: current.scale,
      x: current.x,
      y: current.y
    });
  }, [activeImageIndex]);

  // Handle image load for both images
  const handleImageLoad = (index) => {
    return () => {
      if (!imageRefs[index].current) return;
      
      transforms.current[index] = {
        ...transforms.current[index],
        width: imageRefs[index].current.naturalWidth,
        height: imageRefs[index].current.naturalHeight,
        loaded: true
      };
      
      // Center both images when the second one loads
      if (transforms.current[0].loaded && transforms.current[1].loaded) {
        centerBothImages();
      }
    };
  };

  // Clean up
  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.url));
    };
  }, [images]);

  return (
    <div className="App">
      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {images.length === 0 ? (
          <div className="drop-instructions">
            <p>Drag and drop two images here to compare them</p>
          </div>
        ) : (
          <div 
            className="image-container"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {images.map((image, index) => (
              <img
                key={index}
                ref={imageRefs[index]}
                src={image.url}
                alt={`Image ${index + 1}`}
                style={{
                  transform: `translate(${transforms.current[index].x}px, ${transforms.current[index].y}px) scale(${transforms.current[index].scale})`,
                  imageRendering: transforms.current[index].scale > 1 ? 'pixelated' : 'auto',
                  display: isOpacityMode ? 'block' : (index === activeImageIndex ? 'block' : 'none'),
                  position: 'absolute',
                  opacity: isOpacityMode ? 0.5 : 1
                }}
                onLoad={handleImageLoad(index)}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="controls">
          <button onClick={toggleImage} disabled={isOpacityMode}>
            Toggle Image ({activeImageIndex === 0 ? images[1].name : images[0].name})
          </button>
          <button onClick={toggleLock} style={{ background: isLocked ? '#f44336' : '#4CAF50' }}>
            {isLocked ? 'Unlock Zoom/Pan' : 'Lock Zoom/Pan'}
          </button>
          <button onClick={toggleOpacityMode} style={{ background: isOpacityMode ? '#2196F3' : '#4CAF50' }}>
            {isOpacityMode ? 'Disable Overlay' : 'Enable Overlay'}
          </button>
          <button onClick={() => isLocked ? zoomImages(true, activeImageIndex) : zoomImages(true)}>
            Zoom In (+)
          </button>
          <button onClick={() => isLocked ? zoomImages(false, activeImageIndex) : zoomImages(false)}>
            Zoom Out (-)
          </button>
          <button onClick={resetView}>Reset View</button>
          <button onClick={centerActiveImage}>Center Current Image</button>
          <div className="image-info">
            Currently showing: {isOpacityMode ? 'Both Images' : images[activeImageIndex].name}
          </div>
          <div className="zoom-info">
            Zoom: {Math.round(transforms.current[activeImageIndex].scale * 100)}%
            {!isLocked && ` (Both: ${Math.round(transforms.current[0].scale * 100)}%/${Math.round(transforms.current[1].scale * 100)}%)`}
          </div>
          <div className="lock-status">
            Mode: {isOpacityMode ? 'Overlay Mode' : isLocked ? 'Individual Zoom/Pan' : 'Synchronized Zoom/Pan'}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;