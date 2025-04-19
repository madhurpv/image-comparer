import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Rnd } from 'react-rnd';

const ImageComparisonTool = () => {
  const [images, setImages] = useState([null, null]);
  const [activeImage, setActiveImage] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Proper wheel event listener with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => Math.max(0.1, Math.min(prev * delta, 10)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length < 2) return;

    const newImages = [...images];
    const readers = acceptedFiles.slice(0, 2).map(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const index = acceptedFiles.indexOf(file);
        newImages[index] = reader.result;
        setImages([...newImages]);
      };
      reader.readAsDataURL(file);
      return reader;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: 'image/*',
    maxFiles: 2
  });

  const handleDragStop = (e, d) => {
    setPosition({ x: d.x, y: d.y });
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const renderImage = (index) => {
    if (!images[index]) return null;

    return (
      <img
        src={images[index]}
        alt={`Image ${index + 1}`}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: activeImage === index || activeImage === 2 ? 'block' : 'none',
          imageRendering: 'pixelated',
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      />
    );
  };

  return (
    <div style={{ padding: '20px', height: 'calc(100vh - 40px)' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setActiveImage(0)} disabled={!images[0]}>
          Show Image 1
        </button>
        <button onClick={() => setActiveImage(1)} disabled={!images[1]}>
          Show Image 2
        </button>
        <button onClick={() => setActiveImage(2)} disabled={!images[0] || !images[1]}>
          Show Both
        </button>
        <button onClick={resetView} disabled={!images[0] && !images[1]}>
          Reset View
        </button>
        <div style={{ marginLeft: 'auto' }}>
          Zoom: {(scale * 100).toFixed(0)}%
        </div>
      </div>

      {(!images[0] || !images[1]) ? (
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#eee' : 'white',
            height: '80%'
          }}
        >
          <input {...getInputProps()} />
          <p>Drag and drop two images here, or click to select files</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            border: '1px solid #ccc',
            overflow: 'hidden',
            height: '80%',
            backgroundColor: '#f0f0f0',
            touchAction: 'none'
          }}
        >
          <Rnd
            position={position}
            onDragStop={handleDragStop}
            enableResizing={false}
            bounds="parent"
          >
            {renderImage(0)}
            {renderImage(1)}
          </Rnd>
        </div>
      )}
    </div>
  );
};

export default ImageComparisonTool;