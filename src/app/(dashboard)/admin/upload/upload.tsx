import { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, RefreshCw, Plus, ArrowRight, UserPlus, HelpCircle } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";

interface AnalysisResult {
  csvItem: string;
  status: "exact_match" | "potential_rename" | "new";
  matchId?: string;
  matchName?: string;
  similarity?: number;
  oldPrice?: number;
  newPrice?: number;
  newPriceMax?: number;
  suggestion?: {
    id: string;
    name: string;
    similarity: number;
    oldPrice?: number;
  };
}

interface Props {
  onSuccess?: (total: number) => void;
}

export default function UploadExcel({ onSuccess }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult[] | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmations, setConfirmations] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const performAnalysis = async (file: File) => {
    setIsUploading(true);
    setMessage(null);
    setAnalysis(null);
    setConfirmations({});

    const formData = new FormData();
    formData.append("file", file);
    formData.append("dryRun", "true");

    try {
      const res = await fetch("/api/update-prices", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAnalysis(data.analysis);
      setCurrentFile(file);
      
      const initialConfs: Record<string, any> = {};
      setConfirmations(initialConfs);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!currentFile) return;
    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("confirmations", JSON.stringify(confirmations));
    formData.append("dryRun", "false");

    try {
      const res = await fetch("/api/update-prices", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const outOfStockMsg = data.markedOutOfStock > 0 
        ? ` ${data.markedOutOfStock} marked out of stock.`
        : '';

      setMessage({
        type: "success",
        text: `Success! ${data.totalUpdated} updated, ${data.totalInserted} created.${outOfStockMsg}`,
      });
      setAnalysis(null);
      setCurrentFile(null);
      onSuccess?.(data.totalUpdated + data.totalInserted);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".csv")) {
        setMessage({ type: "error", text: "Only .xlsx or .csv files are accepted" });
        return;
      }
      performAnalysis(file);
    }
  };

  const toggleRename = (csvItem: string, targetId: string, targetName: string) => {
    setConfirmations(prev => {
      const next = { ...prev };
      if (next[csvItem]?.action === 'rename' && next[csvItem]?.targetId === targetId) {
        delete next[csvItem];
      } else {
        next[csvItem] = { action: 'rename', targetId, targetName };
      }
      return next;
    });
  };

  const toggleIgnore = (csvItem: string) => {
    setConfirmations(prev => {
      const next = { ...prev };
      if (next[csvItem]?.action === 'ignore') {
        delete next[csvItem];
      } else {
        next[csvItem] = { action: 'ignore' };
      }
      return next;
    });
  };

  if (analysis) {
    const renames = analysis.filter(a => a.status === 'potential_rename');
    const news = analysis.filter(a => a.status === 'new');
    const exacts = analysis.filter(a => a.status === 'exact_match');

    return (
      <div className="max-w-4xl mx-auto space-y-6 text-[#1A1C21]">
        <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-gray-200/50 border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <RefreshCw className="w-6 h-6 text-green-600" />
              </div>
              Import Analysis
            </h2>
            <div className="text-sm font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              {currentFile?.name}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
              <span className="text-3xl font-black text-[#10B981]">{exacts.length}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Exact Matches</span>
            </div>
            <div className="bg-[#FFFBEB] p-4 rounded-2xl border border-amber-100 flex flex-col items-center">
              <span className="text-3xl font-black text-[#F59E0B]">{renames.length}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Similar Items</span>
            </div>
            <div className="bg-[#EFF6FF] p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
              <span className="text-3xl font-black text-[#3B82F6]">{news.length}</span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">New Products</span>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-8 pr-4 custom-scrollbar">
            {exacts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-black text-[#10B981] uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Price Updates (Exact Matches)
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-green-100 to-transparent"></div>
                </div>
                <div className="space-y-3">
                  {exacts.map(item => (
                    <div key={item.csvItem} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 group">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 uppercase">{item.csvItem}</span>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex flex-col">
                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Current Price</span>
                             <span className="text-xs font-bold text-gray-500">{formatNaira(item.oldPrice || 0)}</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <div className="flex flex-col">
                             <span className="text-[9px] text-[#10B981] font-bold uppercase tracking-tighter">New Price</span>
                             <span className={cn(
                               "text-xs font-black",
                               (item.newPrice || 0) < (item.oldPrice || 0) ? "text-green-600" : (item.newPrice || 0) > (item.oldPrice || 0) ? "text-red-500" : "text-gray-900"
                             )}>
                               {formatNaira(item.newPrice || 0)}
                               {item.newPriceMax && item.newPriceMax > item.newPrice! && ` - ${formatNaira(item.newPriceMax)}`}
                               {(item.newPrice || 0) < (item.oldPrice || 0) && <span className="ml-1 text-[10px] bg-green-100 px-1 rounded">DROP</span>}
                               {(item.newPrice || 0) > (item.oldPrice || 0) && <span className="ml-1 text-[10px] bg-red-100 px-1 rounded">HIKE</span>}
                             </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">MATCHED ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renames.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Potential Product Renames
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-100 to-transparent"></div>
                </div>
                <div className="space-y-3">
                  {renames.map(item => (
                    <div key={item.csvItem} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">CSV Product Name</span>
                          <span className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors uppercase">{item.csvItem}</span>
                          {item.newPrice && (
                            <span className="text-xs font-black text-green-600">CSV: {formatNaira(item.newPrice)}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-center px-4">
                           <ArrowRight className="w-4 h-4 text-amber-400" />
                           <span className="text-[9px] font-black text-amber-500">{Math.round((item.similarity || 0) * 100)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">Existing DB Product</span>
                          <span className="font-bold text-gray-700 uppercase">{item.matchName}</span>
                          {item.oldPrice !== undefined && (
                            <span className="text-xs font-bold text-gray-400">DB: {formatNaira(item.oldPrice)}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleRename(item.csvItem, item.matchId!, item.matchName!)}
                          className={cn(
                            "px-5 py-2.5 rounded-xl text-xs font-black transition-all transform active:scale-95",
                            confirmations[item.csvItem]?.action === 'rename' 
                              ? "bg-[#10B981] text-white shadow-xl shadow-green-100" 
                              : "bg-white text-gray-600 border border-gray-200 hover:border-amber-400 hover:bg-amber-50"
                          )}
                        >
                          {confirmations[item.csvItem]?.action === 'rename' ? 'LINKED ✓' : 'LINK AS SAME?'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {news.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Arrivals to create
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-100 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {news.map(item => (
                    <div key={item.csvItem} className={cn(
                      "flex flex-col p-5 rounded-2xl border transition-all",
                      confirmations[item.csvItem]?.action === 'ignore' ? "bg-red-50/30 border-red-100" : "bg-white border-gray-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-lg uppercase leading-none">{item.csvItem}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-600 font-bold uppercase tracking-tight">Status: New Creation</span>
                            {item.newPrice && (
                               <span className="text-xs font-black text-green-600 bg-green-50 px-2 rounded">Price: {formatNaira(item.newPrice)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3">
                           <button 
                             onClick={() => toggleIgnore(item.csvItem)}
                             className={cn(
                               "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                               confirmations[item.csvItem]?.action === 'ignore'
                                ? "bg-red-600 text-white border-red-200 shadow-lg shadow-red-100"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                             )}
                           >
                             {confirmations[item.csvItem]?.action === 'ignore' ? 'SKIPPED' : 'SKIP'}
                           </button>
                        </div>
                      </div>

                      {item.suggestion && confirmations[item.csvItem]?.action !== 'ignore' && (
                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="w-4 h-4 text-gray-400" />
                            <p className="text-xs font-medium text-gray-500 italic">
                              Found similar existing item: <span className="font-bold text-gray-700 not-italic uppercase">{item.suggestion.name}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => toggleRename(item.csvItem, item.suggestion!.id, item.suggestion!.name)}
                            className={cn(
                              "text-[10px] font-black underline decoration-dotted underline-offset-4 hover:text-amber-600 transition-colors uppercase",
                              confirmations[item.csvItem]?.action === 'rename' ? "text-green-600 no-underline" : "text-amber-500"
                            )}
                          >
                            {confirmations[item.csvItem]?.action === 'rename' ? '✓ Linked' : 'Wait, link to this instead?'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className="mt-8 flex gap-3">
            <button
              disabled={isUploading}
              onClick={() => { setAnalysis(null); setConfirmations({}); }}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={isUploading}
              onClick={handleConfirm}
              className="flex-[2] px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading ? <RefreshCw className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              {isUploading ? 'Applying Changes...' : 'Confirm and Update All'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={cn(
          "border-4 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all",
          isUploading ? "border-green-300 bg-green-50 scale-[0.98]" : "border-green-400 hover:border-green-500 hover:shadow-2xl hover:shadow-green-100",
          message?.type === 'error' && "border-red-400 bg-red-50 hover:border-red-500"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) performAnalysis(f); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-8 border-green-500 border-t-transparent opacity-20"></div>
              <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="text-xl font-bold text-green-700 animate-pulse">Analyzing Price List...</p>
          </div>
        ) : (
          <div className="group">
            <div className="mb-6 relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-green-100 rounded-full scale-0 group-hover:scale-110 transition-transform duration-300"></div>
              <Upload className="relative w-24 h-24 mx-auto text-green-600 transition-transform group-hover:-translate-y-2 duration-300" />
            </div>
            <p className="text-3xl font-black text-green-800 mb-2">
              Update Price List
            </p>
            <p className="text-gray-500 font-medium">
              Drag & drop your <span className="text-green-600 font-bold">.xlsx or .csv</span> file here to begin analysis
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
              <HelpCircle className="w-4 h-4" />
              <span>We&apos;ll check for renames and duplicates before updating</span>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={cn(
          "mt-6 p-4 rounded-2xl border text-center animate-in fade-in slide-in-from-top-4 duration-500",
          message.type === "success" ? "bg-green-100 border-green-300 text-green-800" : "bg-red-100 border-red-300 text-red-800"
        )}>
          <p className="font-bold flex items-center justify-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}

