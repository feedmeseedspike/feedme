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
      <DialogContent className="max-w-sm rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-600 hover:bg-white hover:text-gray-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 text-center">
          <h2 className="text-xl font-bold mb-3 text-gray-800">
            Welcome to FeedMe! 
          </h2>
          
          <p className="text-gray-600 text-sm mb-6">
            Get 5% off your first order
          </p>

          <Button
            onClick={handleSignUp}
            className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90 text-white rounded-xl py-3 font-semibold"
          >
            Sign Up Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NewVisitorModal;