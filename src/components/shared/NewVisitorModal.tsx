"use client";

import {
  Dialog,
  DialogContent,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewVisitorModal({ isOpen, onClose }: NewVisitorModalProps) {
  const router = useRouter();

  const handleSignUp = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_welcome_shown', 'true');
    }
    onClose();
    router.push('/register');
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_welcome_dismissed', Date.now().toString());
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] md:w-full max-w-sm md:max-w-3xl p-0 overflow-hidden bg-[#F5F3EE] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-xl md:rounded-lg font-proxima [&>button]:hidden">
        <div className="grid md:grid-cols-2 flex-col md:min-h-[400px] relative">
          {/* Custom Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 md:right-4 md:top-4 z-30 p-2 rounded-full bg-black/10 md:bg-transparent text-white md:text-stone-400 hover:bg-black/20 md:hover:bg-transparent hover:text-white md:hover:text-[#1B6013] transition-all backdrop-blur-[2px] md:backdrop-blur-none"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image Section */}
          <div className="relative h-36 md:h-full w-full bg-stone-200 group order-first">
            {/* Background Luxury Image */}
            <img 
              src="/images/intro.jpeg" 
              alt="Fresh Local Groceries" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay Gradient for contrast */}
            <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
            
            {/* Brand Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-8 md:left-8 md:translate-x-0 md:translate-y-0 z-20 opacity-0 md:opacity-100 transition-opacity duration-700">
               <img 
                 src="/Footerlogo.png" 
                 alt="FeedMe Logo"
                 className="w-24 md:w-28"
               />
            </div>
          </div>

          {/* Content Section */}
          <div className="relative p-6 md:p-10 flex flex-col justify-center text-center md:text-left bg-[#F5F3EE]">
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#8C8C8C] uppercase font-proxima">
                  Welcome to FeedMe
                </p>
                <h2 className="text-2xl md:text-4xl font-bold text-[#1B6013] leading-tight font-proxima">
                  Freshness <br/>
                  <span className="font-light italic text-[#2A2A2A]">Redefined</span>
                </h2>
              </div>
              
              <div className="w-10 md:w-12 h-[2px] bg-[#1B6013]/20 mx-auto md:mx-0" />

              <p className="text-[#5A5A5A] text-xs md:text-base leading-relaxed font-proxima">
                Discover the finest 
                <span className="font-semibold text-[#1B6013]"> local groceries</span>, 
                from farm-fresh tomatoes to hand-picked artisanal goods.
              </p>
              
              <div className="bg-[#1B6013]/5 p-3 md:p-4 rounded-lg border border-[#1B6013]/10">
                 <p className="text-xs md:text-sm text-[#1B6013] font-medium">
                   <span className="block text-[10px] md:text-xs uppercase tracking-wider text-stone-500 mb-1">Exclusive Welcome Gift</span>
                   Get <span className="font-bold text-base md:text-lg">5% OFF</span> your first order
                 </p>
              </div>

              <div className="pt-2 flex flex-col items-center md:items-start space-y-3 md:space-y-4">
                <Button
                  onClick={handleSignUp}
                  className="w-full md:w-auto bg-[#1B6013] hover:bg-[#154a0f] text-white rounded-md md:rounded-none px-8 py-3 md:px-10 md:py-6 text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[#1B6013]/20 hover:shadow-[#1B6013]/40 shadow-lg font-proxima"
                >
                  Sign Up Now
                </Button>
                
                <div className="text-center md:text-left w-full">
                  <button 
                    onClick={() => { onClose(); router.push('/login'); }}
                    className="text-[10px] md:text-xs text-stone-500 hover:text-[#1B6013] underline underline-offset-4 transition-colors font-proxima"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewVisitorModal;