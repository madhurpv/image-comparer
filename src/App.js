import React, { useState } from 'react';
import './App.css';
import ImageComparator from './components/ImageComparator';

function App() {
  const [images, setImages] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    
    if (files.length >= 2) {
      setImages(files.slice(0, 2).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      })));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">Image Comparator</h1>
        <button 
          className="dark-mode-toggle"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <ImageComparator 
        images={images} 
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;