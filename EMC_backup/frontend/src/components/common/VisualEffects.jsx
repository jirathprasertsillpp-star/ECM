import React, { useEffect } from 'react';

export default function VisualEffects() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      document.body.style.setProperty('--cursor-x', `${x}px`);
      document.body.style.setProperty('--cursor-y', `${y}px`);

      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardX = x - rect.left;
        const cardY = y - rect.top;
        card.style.setProperty('--mouse-x', `${cardX}px`);
        card.style.setProperty('--mouse-y', `${cardY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="visual-elements-container pointer-events-none fixed inset-0 z-0">
      <div className="live-bg opacity-50" />
      <div className="noise-overlay opacity-[0.03]" />
      
      {/* Dynamic Cursor Light (Ivory Edition) */}
      <div 
        className="fixed w-[600px] h-[600px] bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-[120px] pointer-events-none translate-x-[-50%] translate-y-[-50%] transition-all duration-300 ease-out z-[-1]"
        style={{ left: 'var(--cursor-x)', top: 'var(--cursor-y)' }}
      />
      
      {/* Glass Grid Layer */}
      <div className="absolute inset-0 opacity-[0.02]" 
           style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}
