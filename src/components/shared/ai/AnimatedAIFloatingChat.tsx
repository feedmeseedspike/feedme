"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Camera, Send, Bot, User, ShoppingCart, MessageCircle, X, Minimize2, Sparkles, Zap, RotateCcw, Plus, Minus, Trash2, Heart, Star, AlertCircle, Clock } from "lucide-react";
import Image from "next/image";
import { formatNaira, cn } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";
import { useUser } from "src/hooks/useUser";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";

// Product Card Component matching ProductDetailsCard style
interface ProductCardProps {
  suggestion: ProductSuggestion;
  index: number;
  selectedOptions: Record<number, any>;
  onOptionSelect: (index: number, option: any) => void;
  onAddToCart: (suggestion: ProductSuggestion, index: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  suggestion, 
  index, 
  selectedOptions, 
  onOptionSelect, 
  onAddToCart 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showQuantityControls, setShowQuantityControls] = useState(false);
  const { showToast } = useToast();

  const selectedOption = selectedOptions[index];
  const hasOptions = suggestion.product?.options && suggestion.product.options.length > 0;
  
  // Sort options by price like in ProductDetailsCard
  const sortedOptions = useMemo(() => {
    if (!hasOptions) return [];
    return [...suggestion.product!.options].sort((a, b) => (a.price || 0) - (b.price || 0));
  }, [suggestion.product?.options, hasOptions]);

  const handleAddToCartClick = () => {
    if (suggestion.product?.inSeason === false) {
      showToast("This product is currently out of season and cannot be added to cart", "error");
      return;
    }
    
    // Auto-select first option if none selected but options exist
    if (hasOptions && !selectedOption && sortedOptions.length > 0) {
      onOptionSelect(index, sortedOptions[0]);
    }

    setShowQuantityControls(true);
    onAddToCart(suggestion, index);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      setShowQuantityControls(false);
      setQuantity(1);
      return;
    }
    setQuantity(newQuantity);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
      whileHover={{ y: -2 }}
    >
      {/* Product Image */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {suggestion.product?.image && typeof suggestion.product.image === 'string' && suggestion.product.image.trim() !== '' ? (
          <Image
            src={suggestion.product.image}
            alt={suggestion.productName}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              console.error('Image failed to load:', suggestion.product?.image);
              e.currentTarget.src = "/placeholder-product.png";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
            <ShoppingCart size={24} className="mb-2" />
            <span className="text-xs text-center px-2">No image available</span>
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-[10px] text-gray-300 mt-1 px-1">
                Debug: {suggestion.product?.image || 'null'}
              </span>
            )}
          </div>
        )}

        {/* Recommended Badge */}
        {suggestion.isRecommended && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-md z-10 flex items-center gap-1">
            <Star className="h-3 w-3 fill-current" />
            AI Pick
          </div>
        )}

        {/* Season Badge */}
        {suggestion.product?.inSeason === true && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-md">
            In Season
          </div>
        )}
        {suggestion.product?.inSeason === false && (
          <div className="absolute top-2 right-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Out of Season
          </div>
        )}

        {/* Add to Cart Button */}
        <div className="absolute bottom-2 right-2 z-10">
          <AnimatePresence mode="wait">
            {showQuantityControls ? (
              <motion.div
                key="quantity-controls"
                initial={{ width: 40, opacity: 0, scale: 0.8 }}
                animate={{ width: "auto", opacity: 1, scale: 1 }}
                exit={{ width: 40, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-center gap-1 bg-white rounded-full shadow-md p-1 border border-gray-100"
              >
                <motion.button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors text-[#1B6013]"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {quantity === 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
                </motion.button>
                
                <span className="text-xs font-medium w-4 text-center">{quantity}</span>
                
                <motion.button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={suggestion.product?.inSeason === false}
                  className={cn(
                    "p-1 rounded-full transition-colors",
                    suggestion.product?.inSeason === false
                      ? "bg-gray-300 cursor-not-allowed opacity-50"
                      : "bg-[#1B6013]/70 hover:bg-[#1B6013]/90"
                  )}
                  whileHover={{ scale: suggestion.product?.inSeason !== false ? 1.1 : 1 }}
                  whileTap={{ scale: suggestion.product?.inSeason !== false ? 0.9 : 1 }}
                >
                  <Plus className="w-3 h-3 text-white" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="add-to-cart"
                onClick={handleAddToCartClick}
                disabled={suggestion.product?.inSeason === false}
                className={cn(
                  "p-2 rounded-full shadow-md transition-all duration-300 relative overflow-hidden",
                  suggestion.product?.inSeason === false
                    ? "bg-gray-300 cursor-not-allowed opacity-50"
                    : "bg-[#1B6013]/90 hover:bg-[#1B6013] hover:shadow-lg"
                )}
                whileHover={{ 
                  scale: suggestion.product?.inSeason !== false ? 1.1 : 1,
                  boxShadow: suggestion.product?.inSeason !== false ? "0 8px 25px rgba(27, 96, 19, 0.3)" : undefined
                }}
                whileTap={{ scale: suggestion.product?.inSeason !== false ? 0.95 : 1 }}
              >
                <Plus className="w-4 h-4 text-white relative z-10" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h5 
              className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight"
              title={suggestion.productName}
            >
              {suggestion.productName}
            </h5>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{suggestion.reason}</p>
          </div>
        </div>


        {/* Price */}
        {suggestion.product && (
          <div className="flex items-center justify-between">
            <div className="font-bold text-sm">
              {selectedOption && selectedOption.price 
                ? formatNaira(selectedOption.price)
                : suggestion.product.price 
                  ? formatNaira(suggestion.product.price)
                  : "Price N/A"
              }
            </div>
            <div className="text-xs text-green-600 font-medium">
              Qty: {suggestion.quantity || "1"}
            </div>
          </div>
        )}

        {/* Options Dropdown */}
        {hasOptions && (
          <div className="w-full">
            <Select
              value={selectedOption ? (selectedOption.name || selectedOption) : (sortedOptions[0]?.name || sortedOptions[0] || "")}
              onValueChange={(value) => {
                const option = sortedOptions.find((opt: any) => (opt.name || opt) === value);
                onOptionSelect(index, option);
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs border-gray-300 bg-white">
                <SelectValue placeholder="Choose option..." />
              </SelectTrigger>
              <SelectContent className="w-full max-h-48 overflow-y-auto">
                {sortedOptions.map((option: any, optIndex: number) => (
                  <SelectItem
                    key={optIndex}
                    value={option.name || option}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {option.image && (
                        <Image
                          src={option.image}
                          alt={option.name || option}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {option.name || option}
                            {optIndex === 0 && " ⭐ AI Pick"}
                          </span>
                          {option.price && option.price > 0 && (
                            <span className="text-xs text-gray-500 ml-2">
                              {formatNaira(option.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Out of season warning */}
        {suggestion.product?.inSeason === false && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>This product is currently out of season. Check back later or explore similar alternatives.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface Question {
  id: string;
  question: string;
  type: 'select' | 'input' | 'multiselect';
  options?: string[];
}

interface ProductSuggestion {
  productId?: string;
  productName: string;
  reason: string;
  quantity: string;
  product?: {
    id: string;
    name: string;
    price: number;
    options: any[];
    inSeason: boolean;
    image?: string | null;
  };
  available?: boolean;
  isRecommended?: boolean;
}

interface AIResponse {
  message: string;
  questions: Question[];
  productSuggestions: ProductSuggestion[];
  needsMoreInfo: boolean;
  conversationId: string;
}

const chatVariants = {
  closed: {
    scale: 0,
    opacity: 0,
    y: 100,
    rotate: -180,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25
    }
  },
  open: {
    scale: 1,
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 25,
      staggerChildren: 0.1
    }
  },
  minimized: {
    scale: 1,
    y: 0,
    height: "80px",
    transition: {
      type: "spring" as const,
      stiffness: 300
    }
  }
} as const;

const messageVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.3
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 900,
      damping: 40
    }
  }
} as const;

const buttonVariants = {
  idle: { scale: 1 },
  hover: { 
    scale: 1.1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  },
  tap: { scale: 0.95 }
};

const floatingButtonVariants = {
  idle: { 
    scale: 1,
    rotate: 0,
  },
  hover: { 
    scale: 1.1,
    rotate: 10,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 10
    }
  },
  tap: { scale: 0.9 }
};

const sparkleVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 180, 360],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

export default function AnimatedAIFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<ProductSuggestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any>>({});
  const [quotaStatus, setQuotaStatus] = useState<{ remaining: number; total: number; exceeded: boolean } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const user = useUser();
  const controls = useAnimation();

  // Get storage key based on user
  const getStorageKey = () => {
    return user?.user?.user_id ? `ai_conversation_${user.user.user_id}` : 'ai_conversation_anonymous';
  };

  // Save conversation to localStorage
  const saveConversation = () => {
    if (typeof window === 'undefined') return;
    
    const conversationData = {
      messages,
      conversationHistory,
      selectedAnswers,
      currentQuestions,
      currentSuggestions,
      timestamp: new Date().toISOString(),
      userId: user?.user?.user_id || 'anonymous'
    };
    
    localStorage.setItem(getStorageKey(), JSON.stringify(conversationData));
  };

  // Load conversation from localStorage
  const loadConversation = () => {
    if (typeof window === 'undefined') return;
    
    const savedData = localStorage.getItem(getStorageKey());
    
    if (savedData) {
      try {
        const conversationData = JSON.parse(savedData);
        
        // Check if conversation is less than 7 days old
        const saveTime = new Date(conversationData.timestamp).getTime();
        const now = new Date().getTime();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (now - saveTime < sevenDays && conversationData.messages?.length > 0) {
          setMessages(conversationData.messages);
          setConversationHistory(conversationData.conversationHistory || []);
          setSelectedAnswers(conversationData.selectedAnswers || {});
          setCurrentQuestions(conversationData.currentQuestions || []);
          setCurrentSuggestions(conversationData.currentSuggestions || []);
          setConversationLoaded(true);
          console.log('Loaded conversation from localStorage:', conversationData.messages.length, 'messages');
          return;
        }
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
    }
    
    // Start fresh conversation
    startFreshConversation();
  };

  // Start a fresh conversation
  const startFreshConversation = () => {
    const initialMessage = {
      id: Date.now().toString(),
      type: 'ai' as const,
      content: "Hi! I'm your AI meal planning assistant. Tell me what you'd like to cook or upload a photo of a dish you want to make, and I'll help you find the right ingredients! 🍳",
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    setConversationHistory([]);
    setSelectedAnswers({});
    setCurrentQuestions([]);
    setCurrentSuggestions([]);
    setConversationLoaded(true);
  };

  // Clear conversation
  const clearConversation = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(getStorageKey());
    startFreshConversation();
    setUploadedImage(null);
    showToast("Conversation cleared", "info");
  };

  // Check quota status
  const checkQuota = async () => {
    try {
      const { aiUsageTracker } = await import("src/lib/ai-usage-tracking");
      const status = await aiUsageTracker.checkDailyQuota();
      setQuotaStatus(status);
    } catch (error) {
      console.error('Failed to check quota:', error);
    }
  };

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
    checkQuota();
  }, [user?.user?.user_id]); // Reload when user changes (login/logout)

  // Save conversation whenever it changes
  useEffect(() => {
    if (conversationLoaded && messages.length > 0) {
      saveConversation();
    }
  }, [messages, conversationHistory, selectedAnswers, currentQuestions, currentSuggestions, conversationLoaded]);

  useEffect(() => {
    if (isOpen) {
      controls.start("open");
    } else {
      controls.start("closed");
    }
  }, [isOpen, controls]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image must be less than 5MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: "I want to make this dish",
          timestamp: new Date(),
          imageUrl: result
        };
        setMessages(prev => [...prev, newMessage]);
        handleSendMessage("I want to make this dish", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (message?: string, imageBase64?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend && !imageBase64) return;

    if (message !== "I want to make this dish") {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: messageToSend,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    }

    setInputMessage("");
    setIsLoading(true);
    setTypingIndicator(true);

    try {
      const response = await fetch('/api/ai/meal-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.user?.user_id && { 'user-id': user.user.user_id }),
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory,
          imageBase64: imageBase64?.split(',')[1],
          userPreferences: selectedAnswers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();

      // Simulate typing delay for better UX
      setTimeout(() => {
        const aiMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: aiResponse.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        setTypingIndicator(false);

        setConversationHistory(prev => [
          ...prev,
          { role: 'user', content: messageToSend },
          { role: 'assistant', content: aiResponse.message }
        ]);

        setCurrentQuestions(aiResponse.questions || []);
        setCurrentSuggestions(aiResponse.productSuggestions || []);
        setUploadedImage(null);
        
        // Update quota status after successful request
        checkQuota();
      }, 1000);

    } catch (error) {
      console.error('Error:', error);
      
      // Check error type
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isQuotaExceeded = errorMessage.includes('quota') || 
                             errorMessage.includes('429') ||
                             errorMessage.includes('exceeded your current quota');
      const isOverloadError = errorMessage.includes('overloaded') || 
                             errorMessage.includes('503') || 
                             errorMessage.includes('Service Unavailable');
      
      if (isQuotaExceeded) {
        showToast("AI daily quota reached. Service will reset tomorrow.", "error");
        
        // Add a helpful AI message about quota
        const quotaAiMessage = {
          id: Date.now().toString(),
          type: 'ai' as const,
          content: "I've reached my daily usage limit! 😅 The AI service will be available again tomorrow. In the meantime, you can browse our products directly or contact support for assistance. Thanks for your understanding! 🙏",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, quotaAiMessage]);
      } else if (isOverloadError) {
        showToast("AI service is temporarily busy. Please wait a moment and try again.", "error");
        
        // Add a helpful AI message
        const errorAiMessage = {
          id: Date.now().toString(),
          type: 'ai' as const,
          content: "I'm experiencing high traffic right now. Please wait a moment and try asking again. The service should be available shortly! 🤖",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorAiMessage]);
      } else {
        showToast("Failed to get AI response. Please try again.", "error");
      }
      
      setTypingIndicator(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    const question = currentQuestions.find(q => q.id === questionId);
    if (question) {
      // Create a more natural answer message that continues the conversation
      const answerMessage = `${answer}. Please suggest specific products for this.`;
      handleSendMessage(answerMessage);
      
      // Clear questions after answering to avoid confusion
      setCurrentQuestions([]);
    }
  };

  const handleAddToCart = async (suggestion: ProductSuggestion, index: number) => {
    if (suggestion.product) {
      try {
        const { addToCart } = await import("src/lib/actions/cart.actions");
        
        // Get selected option for this product, or auto-select first option if none selected
        let selectedOption = selectedOptions[index];
        if (!selectedOption && suggestion.product.options && suggestion.product.options.length > 0) {
          selectedOption = suggestion.product.options[0];
          // Update the selected options state
          setSelectedOptions(prev => ({
            ...prev,
            [index]: selectedOption
          }));
        }
        
        // Add to cart with selected option or null if no options
        await addToCart(
          suggestion.product.id, 
          1, 
          selectedOption && selectedOption.price !== undefined ? selectedOption : null
        );
        
        const optionText = selectedOption ? ` (${selectedOption.name || selectedOption})` : '';
        showToast(`Added ${suggestion.product.name}${optionText} to cart!`, "success");
      } catch (error) {
        console.error("Failed to add to cart:", error);
        showToast("Failed to add to cart", "error");
      }
    } else {
      showToast("This product is not available in our store", "error");
    }
  };

  const handleOptionSelect = (suggestionIndex: number, option: any) => {
    setSelectedOptions(prev => ({
      ...prev,
      [suggestionIndex]: option
    }));
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <motion.div 
        className="fixed bottom-[140px] md:bottom-[80px] right-4 z-50"
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        variants={floatingButtonVariants}
      >
        <motion.button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-full shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 overflow-hidden"
          aria-label="Open AI Chat"
        >
          <motion.div
            variants={sparkleVariants}
            animate="animate"
            className="absolute top-1 right-1"
          >
            <Sparkles size={12} className="text-yellow-300" />
          </motion.div>
          
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Bot size={24} />
          </motion.div>
          
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ borderRadius: "50%" }}
          />
        </motion.button>
      </motion.div>
    );
  }

  // Full chat interface when open
  return (
    <motion.div 
      className="fixed bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto z-50 w-auto sm:w-full max-w-2xl h-[90vh] sm:h-[85vh] min-h-[400px]"
      variants={chatVariants}
      initial="closed"
      animate={isMinimized ? "minimized" : "open"}
      exit="closed"
    >
      <motion.div
        layout
        className="h-full shadow-2xl border-0 bg-white overflow-hidden rounded-2xl flex flex-col"
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div 
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2 text-white"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Bot size={20} />
              </motion.div>
              <span className="font-semibold">AI Meal Planner</span>
              {quotaStatus && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full",
                  quotaStatus.remaining <= 5 
                    ? "bg-red-500/20 text-red-100" 
                    : quotaStatus.remaining <= 15 
                    ? "bg-yellow-500/20 text-yellow-100"
                    : "bg-green-500/20 text-green-100"
                )}>
                  {quotaStatus.remaining}/{quotaStatus.total}
                </span>
              )}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Zap size={16} className="text-yellow-300" />
              </motion.div>
            </motion.div>
            <div className="flex gap-2">
              <motion.button
                onClick={clearConversation}
                className="text-white hover:bg-white/20 p-1 rounded"
                whileHover={{ scale: 1.1, rotate: -90 }}
                whileTap={{ scale: 0.9 }}
                title="Clear conversation"
              >
                <RotateCcw size={16} />
              </motion.button>
              <motion.button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-1 rounded"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Minimize"
              >
                <Minimize2 size={16} />
              </motion.button>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded"
                whileHover={{ scale: 1.1, rotate: 90 }}
                title="Close"
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {!isMinimized && (
            <motion.div 
              className="flex flex-col flex-1 min-h-0"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex gap-2 max-w-[85%] ${
                          message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <motion.div
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === 'user'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                          whileHover={{ scale: 1.2 }}
                        >
                          {message.type === 'user' ? (
                            <User size={12} className="text-white" />
                          ) : (
                            <Bot size={12} className="text-white" />
                          )}
                        </motion.div>
                        <motion.div
                          className={`rounded-xl p-3 shadow-sm ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          layout
                        >
                          {message.imageUrl && (
                            <motion.div 
                              className="mb-2"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Image
                                src={message.imageUrl}
                                alt="Uploaded food"
                                width={120}
                                height={90}
                                className="rounded-lg object-cover"
                              />
                            </motion.div>
                          )}
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Questions */}
                <AnimatePresence>
                  {currentQuestions.length > 0 && (
                    <motion.div 
                      className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                        💡 Help me understand:
                      </h4>
                      {currentQuestions.map((question, index) => (
                        <motion.div 
                          key={question.id} 
                          className="space-y-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <p className="text-sm text-blue-700 font-medium">{question.question}</p>
                          {question.type === 'select' && question.options && (
                            <div className="flex flex-wrap gap-1">
                              {question.options.map((option, optIndex) => (
                                <motion.div
                                  key={option}
                                  variants={buttonVariants}
                                  initial="idle"
                                  whileHover="hover"
                                  whileTap="tap"
                                  transition={{ delay: optIndex * 0.05 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuestionAnswer(question.id, option)}
                                    className="text-xs px-3 py-1.5 h-auto border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                  >
                                    {option}
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Product Suggestions */}
                <AnimatePresence>
                  {currentSuggestions.length > 0 && (
                    <motion.div 
                      className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <h4 className="font-semibold text-green-800 text-sm flex items-center gap-2">
                        🛒 Recommended Products:
                      </h4>
                      {(() => {
                        const availableProducts = currentSuggestions.filter(s => s.product && s.available !== false);
                        const unavailableProducts = currentSuggestions.filter(s => !s.product || s.available === false);
                        
                        return (
                          <div className="space-y-3">
                            {availableProducts.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {availableProducts.map((suggestion, index) => (
                                  <ProductCard 
                                    key={index}
                                    suggestion={suggestion}
                                    index={index}
                                    selectedOptions={selectedOptions}
                                    onOptionSelect={handleOptionSelect}
                                    onAddToCart={handleAddToCart}
                                  />
                                ))}
                              </div>
                            )}
                            
                            {unavailableProducts.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                              >
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-amber-800">
                                    <p className="font-medium mb-1">Some items aren&apos;t available in our store:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                      {unavailableProducts.map((suggestion, index) => (
                                        <li key={index} className="text-amber-700">
                                          {suggestion.productName} - <span className="italic">Not available</span>
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-2 text-xs text-amber-700">
                                      💡 Try asking for alternatives or check back later!
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                            
                            {availableProducts.length === 0 && unavailableProducts.length === 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 text-center bg-white border-2 border-dashed border-gray-300 rounded-lg"
                              >
                                <ShoppingCart className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 font-medium">No products found</p>
                                <p className="text-xs text-gray-500 mt-1">Try describing what you need differently</p>
                              </motion.div>
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                  {typingIndicator && (
                    <motion.div 
                      className="flex justify-start"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                        <Bot size={12} className="text-green-500" />
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-1 h-1 bg-gray-400 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              <Separator />

              {/* Input Area */}
              <motion.div 
                className="p-3 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="What would you like to cook?"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isLoading) {
                          handleSendMessage();
                        }
                      }}
                      disabled={isLoading}
                      className="text-sm"
                    />
                  </div>
                  <motion.div
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputMessage.trim()}
                      size="sm"
                      className="px-3"
                    >
                      <Send size={12} />
                    </Button>
                  </motion.div>
                  <motion.div
                    variants={buttonVariants}
                    initial="idle"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="px-3"
                    >
                      <Camera size={12} />
                    </Button>
                  </motion.div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <motion.p 
                  className="text-xs text-gray-500 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  💡 Ask me about recipes or upload food photos
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}