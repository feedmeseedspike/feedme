"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, useAnimation, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { spinTheWheel } from "src/lib/actions/spin.actions";
import { cn } from "src/lib/utils";
import { Star, Volume2, VolumeX, X, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SPIN_PRIZES_CONFIG } from "src/lib/deals"; 
import NextImage from "next/image";
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
const WheelVisualRender = ({ isFullscreen, activeLight, controls, rotation, prizes, pointerControls }: any) => (
    <motion.div 
        className={cn(
             "relative flex items-center justify-center font-['Quicksand']",
             "w-[min(90vw,75vh,600px)] h-[min(90vw,75vh,600px)] pointer-events-auto"
        )}
        onClick={(e) => e.stopPropagation()}
    >
        {/* The Disc Container (Reference Golden Rim #f7a838) */}
        <motion.div 
            className="w-full h-full rounded-full overflow-visible shadow-2xl bg-white relative"
            style={{ 
                border: "10px solid #f7a838", 
                boxShadow: "0 0 0 2px #f7a838 inset, 0 10px 20px rgba(0,0,0,0.3)"
            }}
        >
             {/* Pointer anchored to the rim of the disc */}
             <motion.div 
                className="absolute top-[-48px] left-1/2 -translate-x-1/2 z-40 w-10 h-14 drop-shadow-xl filter -ml-5" 
                style={{ transformOrigin: "bottom center" }}
                animate={{ rotate: pointerControls?.rotate || 0 }}
                transition={{ type: 'spring', stiffness: 1000, damping: 20 }}
             >
                <svg viewBox="0 0 100 120" className="w-full h-full fill-[#f7a838] stroke-[#1B6013] stroke-[4px]">
                     <path d="M50 120 C50 120 100 80 100 50 C100 20 80 0 50 0 C20 0 0 20 0 50 C0 80 50 120 50 120 Z" />
                     <circle cx="50" cy="50" r="15" className="fill-white" />
                </svg>
             </motion.div>

             {/* Distinct Flashing Circular Lights - Centered on the 10px rim */}
             <div className="absolute -inset-[5px] z-30 pointer-events-none rounded-full">
                {Array.from({ length: 16 }).map((_, i) => {
                     const isActive = i === activeLight;
                     
                     return (
                         <div 
                            key={i}
                            className="absolute top-0 left-0 w-full h-full"
                            style={{ transform: `rotate(${i * 22.5}deg)` }}
                         >
                             <div 
                                className={cn(
                                    "w-3 h-3 rounded-full absolute top-0 left-1/2 -translate-x-1/2 transition-all duration-200",
                                    isActive 
                                        ? "bg-white shadow-[0_0_15px_#fff,0_0_8px_#fde047] scale-125 z-20" 
                                        : "bg-white/30"
                                )} 
                             />
                         </div>
                     );
                })}
            </div>

            <div className="w-full h-full rounded-full overflow-hidden relative z-10">
                <motion.ul 
                    className="w-full h-full relative"
                    style={{ rotate: rotation }}
                >
                    {prizes.map((prize: any, i: number) => {
                        const imgSrc = prize.image;
                        const idx = i + 1;
                        const colors = ['#1B6013', '#FFFFFF', '#F97316', '#FFFFFF'];
                        const bgColor = colors[i % colors.length];
                        const isWhite = bgColor === '#FFFFFF' || bgColor?.toLowerCase() === '#ffffff';
                        const textColor = isWhite ? '#1B6013' : '#FFFFFF';

                        // Stabilized font sizes
                        const fontSize = prizes.length > 8 ? '0.65rem' : '0.85rem';

                        return (
                            <li 
                                key={i}
                                className="absolute top-0 left-0 w-full h-full flex items-center justify-start pl-[15px] md:pl-[20px]"
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
                                <div className="flex items-center gap-2 max-w-[85%] pr-4">
                                    {imgSrc && (
                                        <div className="w-7 h-7 md:w-10 md:h-10 flex-shrink-0 bg-white rounded-full p-1 shadow-sm relative overflow-hidden">
                                            <NextImage src={imgSrc} alt="" fill className="object-contain" />
                                        </div>
                                    )}
                                    <div className="flex flex-col leading-none text-left drop-shadow-sm">
                                        <span 
                                            className="font-bold uppercase tracking-tight font-['Quicksand'] line-clamp-2"
                                            style={{ 
                                                color: textColor, 
                                                fontSize,
                                                textShadow: isWhite ? 'none' : '0 1px 2px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            {prize.label}
                                        </span>
                                        {prize.sub && (
                                            <span 
                                                className="text-[0.45rem] md:text-xs opacity-70 font-bold uppercase"
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

                {/* Center Hub (Sun/Star) - Properly Centered */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-16 h-16 md:w-24 md:h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-[6px] border-[#f7a838]">
                        <Star className="w-10 h-10 md:w-14 md:h-14 text-[#f7a838] fill-[#f7a838]" />
                </div>
            </div>
        </motion.div>
    </motion.div>
);

export default function SpinWheel({ prizes = SPIN_PRIZES_CONFIG }: { prizes?: any[] }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ message: string; prize?: any } | null>(null);
  const controls = useAnimation();
  const rotation = useMotionValue(0); 
  const { initAudio, playTick, playWin, muted, setMuted } = useSound();
  const lastTickRef = useRef(0);
  const [activeLight, setActiveLight] = useState(0);
  const pointerRotation = useMotionValue(0);
  const [celebratingPrize, setCelebratingPrize] = useState<any>(null);

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
    let interval: NodeJS.Timeout;
    const updateLights = () => {
      setActiveLight((prev) => (prev + 1) % 16);
      let delay = spinning ? 60 : 150;
      interval = setTimeout(updateLights, delay);
    };
    updateLights();
    return () => clearTimeout(interval);
  }, [spinning]);

  // Sound and Pointer Flick Tracking
  useEffect(() => {
     const segmentAngle = 360 / prizes.length;
     const unsubscribe = rotation.on("change", (latest) => {
         const normalizedRotation = latest % 360;
         const currentSegment = Math.floor(normalizedRotation / segmentAngle);
         
         if (currentSegment !== lastTickRef.current) {
             playTick();
             lastTickRef.current = currentSegment;
             
             // Directly animate pointer without triggering React re-render
             animate(pointerRotation, -15, { duration: 0.05 }).then(() => {
                animate(pointerRotation, 0, { duration: 0.05 });
             });
         }
     });
     return () => unsubscribe();
  }, [rotation, playTick, prizes.length, pointerRotation]);

  const fireConfetti = () => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
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
    
    setSpinning(true);
    setResult(null);
    setCelebratingPrize(null);

    // 1. Initial Acceleration to fast cruise
    const cruise = animate(rotation, rotation.get() + 8000, {
        duration: 20, // 400 deg/sec (~1.1 revs/sec)
        ease: "linear",
        repeat: Infinity
    });

    try {
        console.log("Requesting spin result from server...");
        const response = await spinTheWheel();
        console.log("Server response:", response);

        if (!response || !response.success || !response.prize) {
            console.error("Spin failed:", response?.error || "Unknown error");
            cruise.stop();
            const message = response?.error || "We couldn't process your spin. Please try again or contact support.";
            setResult({ message });
            setSpinning(false);
            return;
        }

        // Stop cruise and prepare for final stop
        cruise.stop();

        // Calculate Precise Landing
        const prizeId = response.prize.id;
        const targetIndex = prizes.findIndex(p => p.id === prizeId);
        
        if (targetIndex === -1) {
            console.error("Critical Error: Won prize not found in UI list.", prizeId);
            setResult({ message: "System error: Prize mismatch. Contact admin." });
            setSpinning(false);
            return;
        }

        const segmentAngle = 360 / prizes.length;
        const baseTarget = 90 - (Math.max(0, targetIndex) * segmentAngle);
        
        const currentPos = rotation.get();
        const currentNormalized = ((currentPos % 360) + 360) % 360;
        
        let extraRotation = baseTarget - currentNormalized;
        if (extraRotation <= 0) extraRotation += 360;
        
        // Add 4 full rotations for a smooth decelerating effect
        const finalTarget = currentPos + extraRotation + (360 * 4); 

        // 2. The Grand Slow Down - Starts at cruise speed, ends at zero
        await animate(rotation, finalTarget, {
            duration: 5, 
            ease: [0.15, 0.5, 0, 1] // Custom curve to match initial cruise velocity
        });

        console.log("Wheel stopped. Showing results modal...");

        // 3. Finalize and Show Result
        if (response.prize.type !== 'none') {
            console.log("Celebrating prize:", response.prize.label || "No Label");
            playWin();
            fireConfetti(); 
            const foundPrize = prizes.find(p => p.id === response.prize.id);
            setCelebratingPrize({ ...foundPrize, ...response.prize });
        } else {
            console.log("Landing on 'none' result.");
            setResult({ message: (response as any).message || "No message.", prize: response.prize });
        }
        
    } catch (e) {
        console.error("Execution error in handleSpin:", e);
        setResult({ message: "Network error." });
    } finally {
        setSpinning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;600;700&family=Source+Sans+Pro:wght@400;700&display=swap');
          .font-quicksand { font-family: 'Quicksand', sans-serif; }
          .font-source { font-family: 'Source Sans Pro', sans-serif; }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
        `}</style>
        
        <div className="flex flex-col items-center justify-center w-full relative min-h-[600px]">
            <WheelVisualRender 
                isFullscreen={false} 
                activeLight={activeLight} 
                controls={controls} 
                rotation={rotation} 
                prizes={prizes} 
                pointerControls={{ rotate: pointerRotation }} 
            />
            
            <motion.div 
                className="mt-8 z-20"
                whileHover={{ scale: spinning ? 1 : 1.05 }}
                whileTap={{ scale: spinning ? 1 : 0.95 }}
            >
                    <button 
                        type="button"
                        onClick={handleSpin} 
                        disabled={spinning}
                        className={cn(
                            "group relative px-8 py-4 text-white text-xl font-black uppercase tracking-[0.1em] rounded-2xl transition-all active:scale-95 overflow-hidden",
                            spinning ? "opacity-50 grayscale cursor-not-allowed" : ""
                        )}
                        style={{
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            border: '3px solid #fde047',
                            boxShadow: '0 4px 0 #166534, 0 10px 30px rgba(22, 163, 74, 0.2)'
                        }}
                    >
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
                         <span className="relative z-10 flex items-center gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                            </motion.div>
                             {spinning ? "SPINNING..." : "Spin & Win"}
                            <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                            </motion.div>
                         </span>
                    </button>
            </motion.div>

        </div>

        {/* Results & Celebration Overlays - MOVED OUTSIDE TRANSFORMED CONTAINER */}
        <AnimatePresence>
            {celebratingPrize && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    onClick={(e) => { e.stopPropagation(); setCelebratingPrize(null); }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-8 pt-16 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full relative mx-4 flex flex-col items-center"
                        style={{ border: "6px solid #f7a838" }}
                    >
                        {/* Confetti Canvas for extra effect if needed, though global confetti is already fired */}
                        
                        {/* Centered Top Icon/Image */}
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[6px] border-[#f7a838] overflow-hidden p-4 z-20">
                             {celebratingPrize.image ? (
                                <NextImage
                                    src={celebratingPrize.image}
                                    alt={celebratingPrize.label}
                                    width={100}
                                    height={100}
                                    className="object-contain w-full h-full drop-shadow-lg"
                                />
                             ) : (
                                <span className="text-6xl filter drop-shadow-md">🏆</span>
                             )}
                        </div>


                        <div className="mt-2 w-full">
                             <motion.h2 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring" }}
                                className="text-4xl font-black text-[#1B6013] mb-3 uppercase tracking-tight font-quicksand drop-shadow-sm"
                             >
                                You Won!
                            </motion.h2>
                            
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-slate-600 mb-8 text-base leading-relaxed font-medium font-source px-2"
                            >
                                Congratulations! You&apos;ve unlocked <strong className="text-slate-900 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">{celebratingPrize.label} {celebratingPrize.sub || ''}</strong>. 
                                <br />Check rewards to claim.
                            </motion.p>
                            
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col gap-3 w-full"
                            >
                                <Link
                                    href={
                                        celebratingPrize.type === 'item' ? '/checkout' :
                                        celebratingPrize.type === 'wallet_cash' ? '/account/wallet' :
                                        celebratingPrize.type === 'loyalty_points' ? '/account/rewards' :
                                        '/'
                                    }
                                    onClick={() => {
                                        setCelebratingPrize(null);
                                        if ((window as any).__closeSpinWheel) {
                                            (window as any).__closeSpinWheel();
                                        }
                                    }}
                                    className="w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(27,96,19,0.2)] hover:shadow-[0_15px_25px_rgba(27,96,19,0.3)] transition-all active:scale-95 bg-gradient-to-r from-[#1B6013] to-[#15803d] border-b-4 border-[#0f440b] flex items-center justify-center gap-2 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                                    <span>View Rewards</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                
                                <button
                                    onClick={() => setCelebratingPrize(null)}
                                    className="w-full py-3 rounded-xl text-slate-400 font-bold text-xs uppercase hover:bg-slate-50 hover:text-slate-600 transition-colors tracking-widest"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {result && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[201] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setResult(null); }}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-8 rounded-[2rem] shadow-2xl text-center max-w-sm relative mx-4"
                        style={{ border: "6px solid #f7a838" }}
                    >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md border-[6px] border-[#f7a838]">
                            <span className="text-4xl">😢</span>
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 mt-8 mb-2 uppercase tracking-tight font-quicksand">
                            Oh No!
                        </h2>
                        <p className="text-slate-600 mb-6 text-base leading-tight font-medium font-source">
                            {result.message}
                        </p>
                        
                        <button 
                            onClick={() => setResult(null)}
                            className="w-full text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 bg-gradient-to-r from-[#f7a838] to-[#ea580c] border-b-4 border-[#9a3412]"
                        >
                            Try Again
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </>
  );
}
