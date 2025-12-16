import Container from "@components/shared/Container";
import SpinWheel from "@components/shared/SpinWheel";
import { Metadata } from "next";
import { Sparkles, ShoppingBag, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FeedMe Rewards - Daily Spin",
  description: "Spin daily for a chance to win exclusive ingredient packs, vouchers, and wallet credits.",
};

export default function SpinToWinPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900 overflow-x-hidden">
      <Container className="pt-8 pb-20 md:py-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-[600px]">
              
              {/* LEFT COLUMN: Copy & Value Prop */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1 animate-in slide-in-from-left-8 fade-in duration-700">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-orange-100">
                      <Sparkles className="w-3 h-3" />
                      Daily Rewards
                  </div>

                  <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                      Win Free <br className="hidden md:block" />
                      <span className="text-[#1B6013]">Fresh Ingredients.</span>
                  </h1>

                  <p className="text-lg text-slate-500 mb-8 max-w-md font-medium leading-relaxed">
                      Make your grocery shopping more rewarding. Spin the wheel every 24 hours to unlock exclusive discounts, cash toppings, and free delivery vouchers.
                  </p>

                  {/* Trust Badges */}
                  <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-400">
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Guaranteed Prizes
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Instant Crediting
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Free to Play
                      </div>
                  </div>
                  
                  {/* CTA Note */}
                  <div className="mt-12 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 w-full max-w-md">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
                          <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">Pro Tip</p>
                          <p className="text-sm text-slate-600 font-medium">Rewards are applied automatically at checkout.</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </div>
              </div>

              {/* RIGHT COLUMN: The Wheel Stage */}
              <div className="flex items-center justify-center relative order-1 lg:order-2">
                  {/* Background Aura */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full scale-125 bg-gradient-to-tr from-green-50 via-orange-50/50 to-transparent rounded-full blur-3xl -z-10 opacity-60"></div>
                  
                  <SpinWheel />
              </div>

          </div>

      </Container>
    </div>
  );
}
