import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import logoImg from '../../assets/logo.png';

// Live Background Component
function DataFlowBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;

        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        window.addEventListener('resize', setSize);

        const particles = Array.from({ length: 40 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 80 + 20,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.1
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw subtle glowing grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            for (let x = 0; x < canvas.width; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }

            // Draw data streams
            particles.forEach(p => {
                p.y -= p.speed;
                if (p.y + p.length < 0) {
                    p.y = canvas.height + p.length;
                    p.x = Math.random() * canvas.width;
                }
                
                const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
                gradient.addColorStop(0, `rgba(59, 130, 246, 0)`);
                gradient.addColorStop(0.5, `rgba(59, 130, 246, ${p.opacity})`);
                gradient.addColorStop(1, `rgba(59, 130, 246, 0)`);
                
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.length);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', setSize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

export default function SplashScreen({ onFinish }) {
    const [progress, setProgress] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [loadingText, setLoadingText] = useState("INITIALIZING SECURE TUNNEL");

    useEffect(() => {
        const texts = [
            "INITIALIZING SECURE TUNNEL",
            "SYNCING WORKSPACE MODULES",
            "VERIFYING CREDENTIALS",
            "OPTIMIZING INTELLIGENCE CORE",
            "READY"
        ];
        
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += Math.random() * 3 + 1;
            
            if (currentProgress < 25) setLoadingText(texts[0]);
            else if (currentProgress < 50) setLoadingText(texts[1]);
            else if (currentProgress < 75) setLoadingText(texts[2]);
            else if (currentProgress < 99) setLoadingText(texts[3]);
            else setLoadingText(texts[4]);

            if (currentProgress >= 100) {
                currentProgress = 100;
                clearInterval(interval);
                setTimeout(() => setIsLoaded(true), 400);
            }
            setProgress(currentProgress);
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const handleStartClick = () => {
        setIsExiting(true);
        setTimeout(() => {
            onFinish();
        }, 800);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100vw', height: '100vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#070b14', // Very dark blue/black
            backgroundImage: 'radial-gradient(circle at 50% 30%, #112240 0%, #070b14 70%)',
            zIndex: 99999,
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? 'scale(1.05)' : 'scale(1)',
            filter: isExiting ? 'blur(10px)' : 'blur(0px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden'
        }}>
            {/* Background Animations */}
            <DataFlowBackground />
            
            {/* Glowing Orbs */}
            <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '40vmax', height: '40vmax', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vmax', height: '50vmax', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Central Content */}
            <div style={{ 
                position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                width: '100%', maxWidth: '500px', padding: '0 24px'
            }}>
                
                {/* Logo Section */}
                <div style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '50px',
                    animation: 'fadeDown 1.2s cubic-bezier(0.16, 1, 0.3, 1)' 
                }}>
                    <div style={{ position: 'relative', marginBottom: '32px' }}>
                        {/* Glow Behind Logo */}
                        <div style={{ 
                            position: 'absolute', inset: '-10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', 
                            borderRadius: '35%', filter: 'blur(25px)', opacity: 0.4, animation: 'pulseGlow 3s infinite alternate' 
                        }} />
                        
                        {/* Physical Logo Card */}
                        <div style={{ 
                            position: 'relative', width: '130px', height: '130px', 
                            background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                            overflow: 'hidden'
                        }}>
                            <img src={logoImg} alt="ECMS Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 2, transform: 'scale(1.15)' }} />
                            {/* Glass shine */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)', zIndex: 3 }} />
                        </div>
                    </div>

                    <h1 style={{ 
                        margin: '0 0 12px 0', fontSize: '3.5rem', fontWeight: 900, color: '#ffffff',
                        letterSpacing: '-2px', textShadow: '0 10px 30px rgba(59,130,246,0.5)', lineHeight: 1
                    }}>
                        ECMS
                    </h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, transparent, #3b82f6)' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                            Workspace Intelligence
                        </span>
                        <div style={{ height: '1px', width: '40px', background: 'linear-gradient(270deg, transparent, #3b82f6)' }} />
                    </div>
                </div>

                {/* Bottom Interaction Area */}
                <div style={{ 
                    height: '140px', width: '100%', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center' 
                }}>
                    {!isLoaded ? (
                        /* Progress UI */
                        <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.5s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Activity size={12} color="#3b82f6" style={{ animation: 'spinPulse 2s linear infinite' }} />
                                    {loadingText}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
                                    {Math.floor(progress)}%
                                </span>
                            </div>
                            
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                                <div style={{ 
                                    height: '100%', width: `${progress}%`, borderRadius: '10px',
                                    background: 'linear-gradient(90deg, #2563eb, #6366f1, #8b5cf6)',
                                    boxShadow: '0 0 15px rgba(59,130,246,0.6)',
                                    transition: 'width 0.1s ease-out',
                                    position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'progressShine 1s infinite linear' }} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Enter Button UI */
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'slideUpFade 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                            <button 
                                onClick={handleStartClick}
                                style={{
                                    position: 'relative', overflow: 'hidden', cursor: 'pointer', outline: 'none', border: 'none',
                                    width: '100%', maxWidth: '320px', padding: '18px 0', borderRadius: '16px',
                                    background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)',
                                    color: 'white', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    boxShadow: '0 20px 40px -10px rgba(29, 78, 216, 0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 25px 45px -10px rgba(29, 78, 216, 0.8), inset 0 1px 1px rgba(255,255,255,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(29, 78, 216, 0.6), inset 0 1px 1px rgba(255,255,255,0.2)';
                                }}
                            >
                                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    START WORKSPACE
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </span>
                                {/* Animated Button Shine */}
                                <div style={{
                                    position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)',
                                    transform: 'skewX(-20deg)', animation: 'buttonShine 3s infinite ease-in-out', zIndex: 1
                                }} />
                            </button>
                            
                            <p style={{ 
                                marginTop: '24px', fontSize: '0.65rem', color: '#64748b', fontWeight: 600, 
                                letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' 
                            }}>
                                <ShieldCheck size={14} color="#10b981" />
                                Secure Connection Established
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulseGlow {
                    from { opacity: 0.3; transform: scale(0.95); }
                    to { opacity: 0.6; transform: scale(1.05); }
                }
                @keyframes progressShine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes buttonShine {
                    0% { left: -100%; }
                    20% { left: 200%; }
                    100% { left: 200%; }
                }
                @keyframes spinPulse {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.2); }
                    100% { transform: rotate(360deg) scale(1); }
                }
            `}</style>
        </div>
    );
}
