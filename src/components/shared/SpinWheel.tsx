"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, AnimatePresence, useMotionValue } from "framer-motion";
import { spinTheWheel } from "src/lib/actions/spin.actions";
import { cn } from "src/lib/utils";
import { Leaf, Star, Volume2, VolumeX, X, Trophy } from "lucide-react";
import { SPIN_PRIZES_CONFIG } from "src/lib/deals"; 
import confetti from "canvas-confetti";

// --- Configuration ---
const PRIZES = SPIN_PRIZES_CONFIG;

const PRIZE_IMAGES: Record<string, string> = {
  "wallet_500": "/spin/wallet.png",
  "wallet_1000": "/spin/wallet.png",
  "voucher_5": "/spin/voucher.png",
  "dates_pack": "/spin/dates.png",
  "try_again_1": "/spin/try_again.png", 
  "try_again_2": "/spin/try_again.png",
};

const PRIZE_MAP: Record<string, number[]> = {};
PRIZES.forEach((p, index) => {
    if (!PRIZE_MAP[p.id]) PRIZE_MAP[p.id] = [];
    PRIZE_MAP[p.id].push(index);
});

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
const WheelVisualRender = ({ isFullscreen, activeLight, controls, rotation }: any) => (
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
                    {PRIZES.map((prize, i) => {
                        const imgSrc = PRIZE_IMAGES[prize.id];
                        const idx = i + 1;
                        const colors = ['#1B6013', '#FFFFFF', '#F97316', '#FFFFFF'];
                        const bgColor = colors[i % colors.length];
                        const isWhite = bgColor === '#FFFFFF';
                        const textColor = isWhite ? '#1B6013' : '#FFFFFF';

                        return (
                            <li 
                                key={i}
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-start pl-[50px]"
                                style={{
                                    transform: `rotate(calc(360deg / ${PRIZES.length} * (${idx} - 1)))`,
                                    transformOrigin: "center right", 
                                    width: "50%",
                                    height: `calc((2 * 3.14159 * 50%) / ${PRIZES.length})`, 
                                    background: bgColor,
                                    clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
                                    top: "50%",
                                    marginTop: `calc(-1 * (2 * 3.14159 * 50%) / ${PRIZES.length} / 2)`,
                                }}
                            >
                                <div className="flex items-center gap-3 transform rotate-90 md:rotate-0 origin-center">
                                    {imgSrc && (
                                        <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0">
                                            <img src={imgSrc} alt="" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <span 
                                        className="font-bold text-xs md:text-xl uppercase tracking-tight font-['Quicksand']"
                                        style={{ color: textColor }}
                                    >
                                        {prize.label}
                                    </span>
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

export default function SpinWheel() {
  const [viewMode, setViewMode] = useState<'inline' | 'fullscreen'>('inline');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ message: string; prize?: any } | null>(null);
  const controls = useAnimation();
  const rotation = useMotionValue(0); 
  const [currentRotation, setCurrentRotation] = useState(0);
  const { initAudio, playTick, playWin, muted, setMuted } = useSound();
  const lastTickRef = useRef(0);
  const [activeLight, setActiveLight] = useState(0);

  // Chasing Lights Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLight((prev) => (prev + 1) % 12);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Lock Scroll in Fullscreen
  // Lock Scroll in Fullscreen
  useEffect(() => {
      if (viewMode === 'fullscreen') {
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden'; // Lock html tag too
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
         const segmentAngle = 360 / PRIZES.length;
         const normalizedRotation = latest % 360;
         const currentSegment = Math.floor(normalizedRotation / segmentAngle);
         if (currentSegment !== lastTickRef.current) {
             playTick();
             lastTickRef.current = currentSegment;
         }
     });
     return () => unsubscribe();
  }, [rotation, playTick]);

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
    
    // Switch to Cinema Mode & Start Immediate Spin
    setViewMode('fullscreen');
    setSpinning(true);
    setResult(null);

    // 1. Immediate Feedback: Start generic fast spin
    // Rotate significantly ahead to ensure movement while waiting
    controls.start({ 
        rotate: currentRotation + 360 * 30, 
        transition: { duration: 20, ease: "linear" } 
    });

    // 2. Network Request
    try {
        const response = await spinTheWheel();
        
        if (!response || !response.success || !response.prize) {
            controls.stop();
            setResult({ message: response?.error || "Error spinning." });
            setSpinning(false);
            return; 
        }

        // 3. Logic: Calculate smooth landing
        let possibleIndices = PRIZE_MAP[response.prize.id];
        if (!possibleIndices || possibleIndices.length === 0) possibleIndices = [1]; 
        let targetIndex = possibleIndices[Math.floor(Math.random() * possibleIndices.length)];
        
        // Get current rotation state to ensure smooth transition
        const currentReal = rotation.get();
        const segmentAngle = 360 / PRIZES.length;
        const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.4); 
        
        // Target alignment (270 is top)
        const baseTarget = 270 - (targetIndex * segmentAngle) + randomOffset;
        
        // Ensure we spin at least 2 more full turns for deceleration effect
        const minDecelerationSpins = 3;
        const minTarget = currentReal + (360 * minDecelerationSpins);
        
        // Calculate final absolute rotation
        const spinsNeeded = Math.ceil((minTarget - baseTarget) / 360);
        const finalRotation = baseTarget + (spinsNeeded * 360);

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

  return (
    <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;600;700&family=Source+Sans+Pro:wght@400;700&display=swap');
          .font-quicksand { fontFamily: 'Quicksand', sans-serif; }
          .font-source { fontFamily: 'Source Sans Pro', sans-serif; }
        `}</style>

        {/* State 1: Inline Display */}
        {viewMode === 'inline' && (
            <div className="flex flex-col items-center justify-center w-full relative">
                <WheelVisualRender isFullscreen={false} activeLight={activeLight} controls={controls} rotation={rotation} />
                
                {/* Spin Button Inline - styled to match reference 'Glassy Teal with Orange Border' */}
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

        {/* State 2: Cinematic Fullscreen Mode */}
        <AnimatePresence>
            {viewMode === 'fullscreen' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden font-sans">
                    
                    {/* 1. Deep Blue Background (Reference Color #14248a) */}
                    <motion.div 
                        layoutId="fullscreen-bg"
                        className="absolute inset-0 z-0 bg-[#14248a]" 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                         {/* Radial Glow */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-[#4338ca]/30 to-transparent blur-3xl"></div>
                    </motion.div>

                    {/* 2. Decorative Bottom Corners */}
                    <motion.div 
                        className="absolute bottom-0 left-0 w-48 h-48 z-10 text-white/10 pointer-events-none"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                         <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                             <path d="M0 100 V 50 Q 25 25 50 50 T 100 50 V 100 Z" />
                         </svg>
                    </motion.div>
                    <motion.div 
                        className="absolute bottom-0 right-0 w-48 h-48 z-10 text-white/10 pointer-events-none transform scale-x-[-1]"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                         <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                             <path d="M0 100 V 50 Q 25 25 50 50 T 100 50 V 100 Z" />
                         </svg>
                    </motion.div>

                    {/* 3. Main Stage */}
                    <div className="relative z-20 flex flex-col items-center justify-center w-full h-full pointer-events-none">
                         
                         {/* Close Button */}
                         <button 
                            onClick={closeFullscreen}
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto z-50 backdrop-blur-md"
                        >
                             <X className="w-6 h-6" />
                        </button>

                         {/* Mute Toggle */}
                         <button 
                            onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                            className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors pointer-events-auto z-50 backdrop-blur-md"
                        >
                             {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>

                         {/* The Wheel */}
                         <div className="pointer-events-auto relative">
                             <WheelVisualRender isFullscreen={true} activeLight={activeLight} controls={controls} rotation={rotation} />
                         </div>
                        
                        {/* Result Display */}
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
                                            {result.prize?.type === 'none' ? <span className="text-4xl">😢</span> : <Trophy className="w-10 h-10 text-[#f7a838]" />}
                                        </div>
                                        
                                        <h2 
                                            className="text-4xl font-black text-slate-800 mt-8 mb-2 uppercase tracking-tight"
                                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                                        >
                                            {result.prize?.type === 'none' ? 'Oh No!' : 'You Won!'}
                                        </h2>
                                        <p 
                                            className="text-slate-600 mb-8 text-lg leading-tight"
                                            style={{ fontFamily: "'Source Sans Pro', sans-serif" }}
                                        >
                                            {result.message}
                                        </p>
                                        
                                        <button 
                                            onClick={closeFullscreen}
                                            className="w-full text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                                            style={{ 
                                                background: "linear-gradient(to right, #f7a838, #ea580c)",
                                                fontFamily: "'Quicksand', sans-serif"
                                            }}
                                        >
                                            {result.prize?.type === 'none' ? 'Try Again' : 'Collect Reward'}
                                        </button>
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
