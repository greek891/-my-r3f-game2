import React, { useRef } from 'react';
import './JewelCase.css'

export default function JewelCase({ 
  imageSrc, 
  altText = "PSX Game Case", 
  tiltIntensity = 15
}) {
  const caseRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!caseRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltIntensity; 
    const rotateY = ((x - centerX) / centerX) * tiltIntensity;  

    caseRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!caseRef.current) return;
    caseRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
    caseRef.current.style.transition = 'transform 0.5s ease-out';
  };

  const handleMouseEnter = () => {
    if (!caseRef.current) return;
    caseRef.current.style.transition = 'transform 0.1s ease-out';
  };

  return (
    <div 
      className="case-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="jewel-case" ref={caseRef}>
        <img src={imageSrc} alt={altText} />
        <div className="glare"></div>
      </div>
    </div>
  );
}