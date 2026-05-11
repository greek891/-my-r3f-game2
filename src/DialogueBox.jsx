import { useState, useEffect, useRef } from 'react';

// Initialize the audio outside the component so it only loads once.
const uiClickSound = new Audio('/beep.mp3'); 
uiClickSound.volume = 0.1; 

// 👇 NEW: We catch the isMuted prop passed down from App.jsx
export function DialogueBox({ speaker, screens, onComplete, isMuted }) {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [viewingImage, setViewingImage] = useState(false); 
  
  const typingIntervalRef = useRef(null);

  const currentScreen = screens[currentScreenIndex];

  // 👇 NEW: Tie the audio object's native mute state to our React prop
  useEffect(() => {
    uiClickSound.muted = isMuted;
  }, [isMuted]);

  // Helper function to play the sound on clicks
  const playClickSound = () => {
    // Only attempt to play if we aren't muted
    if (isMuted) return; 
    
    uiClickSound.currentTime = 0; 
    uiClickSound.play().catch(e => console.log("Audio play blocked:", e));
  };

  useEffect(() => {
    if (!currentScreen) return;

    setDisplayedText('');
    setIsTyping(true);
    setViewingImage(false);

    let charIndex = 0;
    
    typingIntervalRef.current = setInterval(() => {
      if (charIndex < currentScreen.text.length) {
        setDisplayedText(currentScreen.text.substring(0, charIndex + 1));
        
        // 🔊 THE TYPEWRITER SOUND:
        // We check the native muted property here so we don't have to add 
        // `isMuted` to the useEffect dependencies (which would restart the typing)
        if (charIndex % 2 === 0 && !uiClickSound.muted) {
          uiClickSound.currentTime = 0;
          uiClickSound.play().catch(e => console.log("Audio play blocked:", e));
        }

        charIndex++;
      } else {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, 30); 

    return () => clearInterval(typingIntervalRef.current);
  }, [currentScreenIndex, screens]); 

  const handleClick = () => {
    playClickSound(); // 🔊 Play sound when clicking to skip or advance

    if (isTyping) {
      clearInterval(typingIntervalRef.current);
      setDisplayedText(currentScreen.text);
      setIsTyping(false);
      return;
    } 
    
    if (currentScreenIndex < screens.length - 1) {
      setCurrentScreenIndex(prev => prev + 1);
      return;
    }

    if (!currentScreen.buttons) {
      if (onComplete) onComplete();
    }
  };

  return (
    <>
      <div className="psx-dialogue-wrapper" onClick={handleClick}>
        {speaker && <div className="psx-speaker-name">{speaker}</div>}
        
        <div className="psx-text-content">
          {displayedText}
          {!isTyping && !currentScreen.buttons && (
             <span className="psx-blinking-cursor"> ▼</span>
          )}
        </div>

        {!isTyping && currentScreen.buttons && (
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            {currentScreen.buttons.map((btn, idx) => (
              <button 
                key={idx} 
                className="psx-attachment-btn" 
                onClick={(e) => {
                  e.stopPropagation(); 
                  playClickSound(); // 🔊 Play sound when clicking action buttons

                  if (btn.action === "VIEW_ATTACHMENT") {
                    setViewingImage(true);
                  } else if (btn.onClick) {
                    btn.onClick(e);
                  }
                }}
                style={{ marginTop: 0 }} 
              >
                [ {btn.label} ]
              </button>
            ))}
          </div>
        )}
      </div>

      {viewingImage && currentScreen.attachmentUrl && (
        <div className="psx-image-overlay" onClick={() => {
          playClickSound(); // 🔊 Play sound when closing the image overlay
          setViewingImage(false);
        }}>
          <div className="psx-stage">
            <div className="psx-box slice-1" style={{ backgroundImage: `url(${currentScreen.attachmentUrl})` }}></div>
            <div className="psx-box slice-2" style={{ backgroundImage: `url(${currentScreen.attachmentUrl})` }}></div>
            <div className="psx-box slice-3" style={{ backgroundImage: `url(${currentScreen.attachmentUrl})` }}></div>
            <div className="psx-box slice-4" style={{ backgroundImage: `url(${currentScreen.attachmentUrl})` }}></div>
          </div>
          <div className="psx-overlay-text">Click anywhere to close</div>
        </div>
      )}
    </>
  );
}