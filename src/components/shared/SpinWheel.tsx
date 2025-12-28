"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, useAnimation, AnimatePresence, useMotionValue } from "framer-motion";
import { spinTheWheel } from "src/lib/actions/spin.actions";
import { cn } from "src/lib/utils";
import { Star, Volume2, VolumeX, X, Trophy } from "lucide-react";
import Link from "next/link";
import { SPIN_PRIZES_CONFIG } from "src/lib/deals"; 
import confetti from "canvas-confetti";

// --- Sound Synthesizer ---
const useSound = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const [muted, setMuted] = useState(false);

    const initAudio = () => {
        if (!audioCtxRef.current && typeof window !== 'undefined') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playTick = useCallback(() => {
        if (muted || !audioCtxRef.current) return;
        try {
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(600, audioCtxRef.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtxRef.current.currentTime + 0.03);
            gain.gain.setValueAtTime(0.5, audioCtxRef.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.03);
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.04);
        } catch (e) {}
    }, [muted]);

    const playWin = useCallback(() => {
        if (muted || !audioCtxRef.current) return;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
             const osc = audioCtxRef.current!.createOscillator();
             const gain = audioCtxRef.current!.createGain();
             osc.frequency.setValueAtTime(freq, audioCtxRef.current!.currentTime + i * 0.1);
             gain.gain.setValueAtTime(0.2, audioCtxRef.current!.currentTime + i * 0.1);
             gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current!.currentTime + i * 0.1 + 0.5);
             osc.connect(gain);
             gain.connect(audioCtxRef.current!.destination);
             osc.start(audioCtxRef.current!.currentTime + i * 0.1);
             osc.stop(audioCtxRef.current!.currentTime + i * 0.1 + 0.6);
        });
    }, [muted]);

    return { initAudio, playTick, playWin, muted, setMuted };
};

// --- Standalone Visual Component to prevent re-renders ---
const WheelVisualRender = ({ isFullscreen, activeLight, controls, rotation, prizes }: any) => (
    <motion.div 
        layoutId="wheel-visual-core"
        className={cn(
             "relative flex items-center justify-center font-['Quicksand']",
             isFullscreen ? "w-[85vmin] h-[85vmin] max-w-[600px] max-h-[600px]" : "w-[340px] h-[340px] md:w-[480px] md:h-[480px]"
        )}
    >
        {/* Pointer (Solid Orange Pin to match reference color #f7a838) */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 w-16 h-20 drop-shadow-xl filter" style={{ transformOrigin: "top center" }}>
            <svg viewBox="0 0 100 120" className="w-full h-full fill-[#f7a838] stroke-white stroke-[4px]">
                 <path d="M50 0 C20 0 0 20 0 50 C0 80 50 120 50 120 C50 120 100 80 100 50 C100 20 80 0 50 0 Z" />
                 <circle cx="50" cy="50" r="15" className="fill-white" />
            </svg>
        </div>

        {/* The Disc Container (Reference Golden Rim #f7a838) */}
        <motion.div 
            className="w-full h-full rounded-full overflow-visible shadow-2xl bg-white relative"
            style={{ 
                border: "10px solid #f7a838", 
                boxShadow: "0 0 0 2px #f7a838 inset, 0 10px 20px rgba(0,0,0,0.3)"
            }}
        >
             {/* Lights Wrapper */}
             <div className="absolute -inset-[5px] z-30 pointer-events-none rounded-full">
                {Array.from({ length: 12 }).map((_, i) => {
                     const isActive = i === activeLight || i === (activeLight + 6) % 12; 
                     return (
                         <div 
                            key={i}
                            className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-full"
                            style={{ transform: `rotate(${i * 30}deg)` }}
                         >
                             <div 
                                className={cn(
                                    "w-3 h-3 md:w-3.5 md:h-3.5 rounded-full shadow-sm absolute top-0 transition-all duration-300",
                                    isActive ? "bg-yellow-200 shadow-[0_0_10px_#fde047] scale-125" : "bg-white/50"
                                )} 
                             />
                         </div>
                     );
                })}
            </div>

            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                <motion.ul 
                    className="w-full h-full relative"
                    animate={controls}
                    style={{ rotate: rotation }}
                >
                    {prizes.map((prize: any, i: number) => {
                        const imgSrc = prize.image;
                        const idx = i + 1;
                        const colors = ['#1B6013', '#FFFFFF', '#F97316', '#FFFFFF'];
                        // Auto-color enforced: Ignore prize.color
                        const bgColor = colors[i % colors.length];
                        const isWhite = bgColor === '#FFFFFF' || bgColor?.toLowerCase() === '#ffffff';
                        const textColor = isWhite ? '#1B6013' : '#FFFFFF';

                        return (
                            <li 
                                key={i}
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-start pl-[50px]"
                                style={{
                                    transform: `rotate(calc(360deg / ${prizes.length} * (${idx} - 1)))`,
                                    transformOrigin: "center right", 
                                    width: "50%",
                                    height: `calc((2 * 3.14159 * 50%) / ${prizes.length})`, 
                                    background: bgColor,
                                    clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
                                    top: "50%",
                                    marginTop: `calc(-1 * (2 * 3.14159 * 50%) / ${prizes.length} / 2)`,
                                }}
                            >
                                <div className="flex items-center gap-1 md:gap-2 transform rotate-90 md:rotate-0 origin-center max-w-[80%]">
                                    {imgSrc && (
                                        <div className="w-6 h-6 md:w-10 md:h-10 flex-shrink-0 bg-white rounded-full p-0.5 shadow-sm">
                                            <img src={imgSrc} alt="" className="w-full h-full object-contain rounded-full" />
                                        </div>
                                    )}
                                    <div className="flex flex-col leading-none">
                                        <span 
                                            className="font-bold text-[0.55rem] md:text-sm uppercase tracking-tight font-['Quicksand'] break-words whitespace-normal text-left line-clamp-2"
                                            style={{ color: textColor }}
                                        >
                                            {prize.label}
                                        </span>
                                        {prize.sub && (
                                            <span 
                                                className="text-[0.45rem] md:text-xs opacity-80 font-['Source Sans Pro']"
                                                style={{ color: textColor }}
                                            >
                                                {prize.sub}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </motion.ul>

                {/* Center Hub (Sun/Star) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 md:w-24 md:h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-[4px] border-[#f7a838]">
                        <Star className="w-10 h-10 text-[#f7a838] fill-[#f7a838]" />
                </div>
            </div>
        </motion.div>
    </motion.div>
);

export default function SpinWheel({ prizes = SPIN_PRIZES_CONFIG }: { prizes?: any[] }) {
  const [viewMode, setViewMode] = useState<'inline' | 'fullscreen'>('inline');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ message: string; prize?: any } | null>(null);
  const controls = useAnimation();
  const rotation = useMotionValue(0); 
  const [currentRotation, setCurrentRotation] = useState(0);
  const { initAudio, playTick, playWin, muted, setMuted } = useSound();
  const lastTickRef = useRef(0);
  const [activeLight, setActiveLight] = useState(0);

  const prizeMap = useMemo(() => {
     const map: Record<string, number[]> = {};
     prizes.forEach((p, index) => {
        if (!map[p.id]) map[p.id] = [];
        map[p.id].push(index);
     });
     return map;
  }, [prizes]);

  // Chasing Lights Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLight((prev) => (prev + 1) % 12);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Lock Scroll in Fullscreen
  useEffect(() => {
      if (viewMode === 'fullscreen') {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden'; 
      } else {
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
      }
      return () => { 
          document.body.style.overflow = ''; 
          document.documentElement.style.overflow = '';
      };
  }, [viewMode]);

  // Sound Tracking
  useEffect(() => {
     const unsubscribe = rotation.on("change", (latest) => {
         const segmentAngle = 360 / prizes.length;
         const normalizedRotation = latest % 360;
         const currentSegment = Math.floor(normalizedRotation / segmentAngle);
         if (currentSegment !== lastTickRef.current) {
             playTick();
             lastTickRef.current = currentSegment;
         }
     });
     return () => unsubscribe();
  }, [rotation, playTick, prizes.length]);

  const fireConfetti = () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
  };

  const handleSpin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (spinning) return;
    initAudio(); 
    
    setViewMode('fullscreen');
    setSpinning(true);
    setResult(null);

    // 1. Immediate Feedback
    controls.start({ 
        rotate: currentRotation + 360 * 30, 
        transition: { duration: 20, ease: "linear" } 
    });

    try {
        const response = await spinTheWheel();
        
        if (!response || !response.success || !response.prize) {
            controls.stop();
            setResult({ message: response?.error || "Error spinning." });
            setSpinning(false);
            return; 
        }

        // 3. Logic: Calculate smooth landing
        const prizeId = response.prize.id;
        let possibleIndices: number[] = [];
        
        // Robust ID Matching
        prizes.forEach((p, idx) => {
            if (p.id === prizeId) possibleIndices.push(idx);
        });

        if (possibleIndices.length === 0) {
            console.warn("Prize ID not found in local map. Defaulting to 0.", prizeId, prizes);
            possibleIndices = [0]; 
        }

        const targetIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        const totalSegments = prizes.length;
        const segmentAngle = 360 / totalSegments;

        // Pointer is at TOP (12 o'clock).
        // Item 0 is positioned at 'left: 0', width: 50%, origin: 'center right'.
        // This means Item 0 starts at 9 o'clock (270 deg) relative to circle center? 
        // Or if standard CSS 0deg is 3 o'clock, then:
        // Div at left:0 is the left semi-circle.
        // It points Left.
        // To get from Left (9 o'clock) to Top (12 o'clock), we rotate +90 deg.
        // Current Logic: Rotation rotates the whole UL container.
        
        const baseTarget = 90 - (targetIndex * segmentAngle);

        // Add small random jitter within the segment (avoid edges)
        const safeZone = segmentAngle * 0.8; // 80% of segment width
        const randomOffset = (Math.random() - 0.5) * safeZone; 
        
        const currentReal = rotation.get();
        // Determine minimum number of extra spins
        const minDecelerationSpins = 5; 
        
        const targetPhase = baseTarget + randomOffset;
        const currentPhase = currentReal % 360;
        
        // Distance to cover to align phases forward
        let phaseDiff = targetPhase - currentPhase;
        if (phaseDiff < 0) phaseDiff += 360;
        
        // Total rotation
        const finalRotation = currentReal + phaseDiff + (minDecelerationSpins * 360);

        setCurrentRotation(finalRotation);

        // 4. Decelerate to target
        await controls.start({
            rotate: finalRotation,
            transition: { duration: 4, ease: "circOut" } 
        });

        if (response.prize.type !== 'none') {
            playWin();
            fireConfetti(); 
        } 

        setResult({ message: response.message, prize: response.prize });
        setSpinning(false);

    } catch (e) {
        controls.stop();
        setResult({ message: "Network error." });
        setSpinning(false);
    }
  };

  const closeFullscreen = () => {
      setResult(null);
      setViewMode('inline');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You might want to add a toast here, but simple alert or text change is fine for this context
  };

  return (
    <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;600;700&family=Source+Sans+Pro:wght@400;700&display=swap');
          .font-quicksand { fontFamily: 'Quicksand', sans-serif; }
          .font-source { fontFamily: 'Source Sans Pro', sans-serif; }
        `}</style>
        
        {viewMode === 'inline' && (
            <div className="flex flex-col items-center justify-center w-full relative">
                <WheelVisualRender isFullscreen={false} activeLight={activeLight} controls={controls} rotation={rotation} prizes={prizes} />
                
                <div className="mt-12 z-20">
                        <button 
                            onClick={handleSpin} 
                            className="group relative px-12 py-4 text-white text-xl font-bold uppercase tracking-widest rounded-[0.6em] transition-all hover:scale-105 active:scale-95"
                            style={{
                                backgroundColor: 'rgba(60, 109, 121, 0.12)',
                                border: '4px solid #f7a838',
                                fontFamily: "'Quicksand', sans-serif",
                                fontWeight: 700
                            }}
                        >
                            Spin the Wheel
                        </button>
                </div>
            </div>
        )}

        <AnimatePresence>
            {viewMode === 'fullscreen' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans">
                    
                    <motion.div 
                        layoutId="fullscreen-bg"
                        className="absolute inset-0 z-0 bg-[#14248a]" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-[#4338ca]/30 to-transparent blur-3xl"></div>
                    </motion.div>

                    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full pointer-events-none">
                         
                         <button 
                            onClick={closeFullscreen}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto z-50 backdrop-blur-md"
                        >
                             <X className="w-6 h-6" />
                        </button>

                         <button 
                            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                            className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto z-50 backdrop-blur-md"
                        >
                             {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>

                         <div className="pointer-events-auto relative">
                             <WheelVisualRender isFullscreen={true} activeLight={activeLight} controls={controls} rotation={rotation} prizes={prizes} />
                         </div>
                        
                        <AnimatePresence>
                            {result && (
                                <motion.div 
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50"
                                >
                                    <div 
                                        className="bg-white p-8 rounded-[2rem] shadow-2xl text-center max-w-sm relative mx-4"
                                        style={{ border: "6px solid #f7a838" }}
                                    >
                                        <div 
                                            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md"
                                            style={{ border: "6px solid #f7a838" }}
                                        >
                                            {(!result.prize || result.prize.type === 'none') ? <span className="text-4xl">😢</span> : <Trophy className="w-10 h-10 text-[#f7a838]" />}
                                        </div>
                                        
                                        <h2 
                                            className="text-3xl font-black text-slate-800 mt-8 mb-2 uppercase tracking-tight"
                                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                                        >
                                            {(!result.prize || result.prize.type === 'none') ? 'Oh No!' : 'You Won!'}
                                        </h2>
                                        <p 
                                            className="text-slate-600 mb-6 text-base leading-tight font-medium"
                                            style={{ fontFamily: "'Source Sans Pro', sans-serif" }}
                                        >
                                            {result.message}
                                        </p>

                                        {result.prize?.data?.code && (
                                            <div className="bg-slate-100 p-3 rounded-lg border border-dashed border-slate-300 mb-6 flex items-center justify-between">
                                                <code className="text-sm font-bold text-slate-700 tracking-wider">
                                                    {result.prize.data.code}
                                                </code>
                                                <button 
                                                    onClick={() => copyToClipboard(result.prize?.data?.code || '')}
                                                    className="text-xs bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 uppercase font-bold text-slate-500"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-col gap-3">
                                            {(!result.prize || result.prize.type === 'none') ? (
                                                <button 
                                                    onClick={closeFullscreen}
                                                    className="w-full text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg transition-all hover:bg-opacity-90"
                                                    style={{ 
                                                        background: "linear-gradient(to right, #94a3b8, #64748b)",
                                                        fontFamily: "'Quicksand', sans-serif"
                                                    }}
                                                >
                                                    Try Again
                                                </button>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={result.prize?.data?.code ? `/checkout?apply_voucher=${result.prize.data.code}` : '/account/wallet'}
                                                        className="w-full text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                                        style={{ 
                                                            background: "linear-gradient(to right, #f7a838, #ea580c)",
                                                            fontFamily: "'Quicksand', sans-serif"
                                                        }}
                                                    >
                                                        {result.prize?.type === 'wallet_cash' ? 'Check Wallet' : 'Checkout Now'}
                                                    </Link>
                                                     <Link
                                                        href="/account/rewards"
                                                        className="w-full text-slate-500 py-3 rounded-xl font-bold uppercase text-sm hover:bg-slate-50 transition-all block"
                                                    >
                                                        View My Rewards
                                                    </Link>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </AnimatePresence>
    </>
  );
}

