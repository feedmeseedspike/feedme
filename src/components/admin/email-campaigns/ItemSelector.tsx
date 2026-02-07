"use client";

import { useState, useEffect } from "react";
import { Check, Search, Plus, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";

interface ItemSelectorProps {
  type: 'product' | 'bundle';
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  title: string;
}

export function ItemSelector({ type, selectedIds, onChange, title }: ItemSelectorProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<"connecting" | "ready" | "error" | "timeout">("connecting");
  const supabase = createClient();
  const { showToast } = useToast();

  // Initial connection check
  useEffect(() => {
    console.log("[ItemSelector] Initializing...", { 
      type, 
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing'
    });
    
    const checkConnection = async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
        const query = supabase.from('products').select('id').limit(1);
        await Promise.race([query, timeout]);
        setDbStatus("ready");
      } catch (err) {
        console.error("DB Connection failed:", err);
        setDbStatus(err instanceof Error && err.message === "Timeout" ? "timeout" : "error");
      }
    };
    checkConnection();
  }, []);

  // Keep selectedItems names in sync with selectedIds
  useEffect(() => {
    const fetchNames = async () => {
      const missingIds = selectedIds.filter(id => !selectedItems.find(item => item.id === id));
      if (missingIds.length === 0) return;

      const table = type === 'product' ? 'products' : 'bundles';
      const { data, error } = await supabase
        .from(table)
        .select('id, name')
        .in('id', missingIds);
      
      if (!error && data) {
        setSelectedItems(prev => {
          const existing = prev.filter(p => selectedIds.includes(p.id));
          const combined = [...existing, ...data];
          return combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i && selectedIds.includes(v.id));
        });
      }
    };

    fetchNames();
    
    if (selectedItems.length > selectedIds.length) {
      setSelectedItems(prev => prev.filter(item => selectedIds.includes(item.id)));
    }
  }, [selectedIds, type]);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.trim().length === 0) {
      setItems([]);
      return;
    }

    setLoading(true);
    const table = type === 'product' ? 'products' : 'bundles';

    try {
      // Use a timeout for the search request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase
        .from(table)
        .select('id, name')
        .ilike('name', `%${val.trim()}%`)
        .limit(10);
      
      clearTimeout(timeoutId);
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error(`[ItemSelector] Search error:`, err);
      if (err.name === 'AbortError') {
        showToast("Search timed out. Please check your connection.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: any) => {
    if (!item.id) return;
    const exists = selectedIds.includes(item.id);
    let newIds: string[];

    if (exists) {
      newIds = selectedIds.filter(id => id !== item.id);
    } else {
      newIds = [...selectedIds, item.id];
      if (!selectedItems.find(i => i.id === item.id)) {
        setSelectedItems(prev => [...prev, { id: item.id, name: item.name }]);
      }
    }

    onChange(newIds);
  };

  return (
    <div className="space-y-3 relative">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {title}
          {loading && <Loader2 className="h-3 w-3 animate-spin text-green-600" />}
          {dbStatus === "timeout" && <span className="text-[10px] text-orange-500 font-normal mt-0.5">(Slow connection)</span>}
          {dbStatus === "error" && <span className="text-[10px] text-red-500 font-normal mt-0.5">(Connection error)</span>}
        </label>
        <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {selectedIds.length} Selected
        </span>
      </div>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
        <Input
          placeholder={`Search ${type}s...`}
          className="pl-10 h-10 border-gray-200 focus-visible:ring-green-500 rounded-lg"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          disabled={dbStatus === "error"}
        />
      </div>

      {dbStatus === "timeout" && items.length === 0 && search.length > 0 && (
         <p className="text-[10px] text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
           The server is taking a long time to respond. This might be due to low system resources.
         </p>
      )}

      {search.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-green-100 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!loading && items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 italic">
              {dbStatus === "ready" ? `No results for "${search}"` : "Waiting for connection..."}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {items.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between px-4 py-3 hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => toggleItem(item)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{item.name || 'Unnamed Item'}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-tighter">ID: {item.id.slice(0, 8)}...</span>
                  </div>
                  {selectedIds.includes(item.id) ? (
                    <div className="bg-green-500 rounded-full p-1 shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-full p-1 text-gray-400">
                      <Plus className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 px-4 py-2 border-t flex justify-between items-center">
            <span className="text-[10px] text-gray-400">Press Esc to close</span>
            <button 
              onClick={() => { setSearch(""); setItems([]); }}
              className="text-[10px] text-green-600 font-bold hover:underline"
            >
              Clear Results
            </button>
          </div>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedItems.filter(item => selectedIds.includes(item.id)).map(item => (
            <Badge 
              key={item.id} 
              variant="secondary" 
              className="pl-2.5 pr-1.5 py-1.5 flex items-center gap-2 bg-white hover:bg-red-50 text-gray-700 border-gray-200 hover:border-red-200 hover:text-red-700 transition-all cursor-default group"
            >
              <span className="text-xs font-medium">{item.name}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item);
                }}
                className="opacity-40 group-hover:opacity-100 hover:bg-red-100 rounded-full p-0.5 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
