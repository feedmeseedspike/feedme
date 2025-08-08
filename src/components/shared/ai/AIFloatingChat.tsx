"use client";

import React, { useState, useRef, useEffect } from "react";
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
import {
  Camera,
  Send,
  Bot,
  User,
  ShoppingCart,
  MessageCircle,
  X,
  Minimize2,
  Sparkles,
  Star,
  AlertCircle,
  ArrowLeft,
  Clock,
  Users,
  Edit2,
  Check,
  XCircle,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { formatNaira, cn } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isEditing?: boolean;
}

interface Question {
  id: string;
  question: string;
  type: "select" | "input" | "multiselect";
  options?: string[];
}

interface DishSuggestion {
  id: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  cookingTime: string;
  servings: string;
  image?: string;
  isRecommended?: boolean;
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
  dishSuggestions?: DishSuggestion[];
  productSuggestions: ProductSuggestion[];
  needsMoreInfo: boolean;
  conversationId: string;
  showDishes?: boolean;
}

export default function AIFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hi! I'm your AI meal planning assistant. Tell me what you'd like to cook or upload a photo of a dish you want to make, and I'll help you find the right ingredients! 🍳",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentDishSuggestions, setCurrentDishSuggestions] = useState<
    DishSuggestion[]
  >([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<
    ProductSuggestion[]
  >([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, any>>(
    {}
  );
  const [showDishes, setShowDishes] = useState(false);
  const [lastSelectedDish, setLastSelectedDish] =
    useState<DishSuggestion | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

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
        setPendingImage(result);
        showToast("Image added! Type your message and send.", "info");
      };
      reader.readAsDataURL(file);
    }
    // Clear the input so the same file can be selected again
    event.target.value = "";
  };

  const handleSendMessage = async (message?: string, imageBase64?: string) => {
    const messageToSend = message || inputMessage.trim();
    const imageToSend = imageBase64 || pendingImage;

    if (!messageToSend && !imageToSend) return;

    // Preserve current input for potential restoration on failure
    const currentInput = inputMessage;
    const currentImage = pendingImage;

    // Add user message
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageToSend || "Let me show you this image",
      timestamp: new Date(),
      imageUrl: imageToSend || undefined,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Clear inputs immediately for better UX
    setInputMessage("");
    setPendingImage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/meal-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory,
          imageBase64: imageToSend?.split(",")[1],
          userPreferences: selectedAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiResponse: AIResponse = await response.json();

      // Add AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: aiResponse.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: messageToSend },
        { role: "assistant", content: aiResponse.message },
      ]);

      // Set questions and suggestions (sort to show recommended first)
      setCurrentQuestions(aiResponse.questions || []);

      // Handle dish suggestions
      if (aiResponse.dishSuggestions && aiResponse.dishSuggestions.length > 0) {
        const sortedDishes = (aiResponse.dishSuggestions || []).sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          return 0;
        });
        setCurrentDishSuggestions(sortedDishes);
        setShowDishes(true);
        setCurrentSuggestions([]); // Clear product suggestions when showing dishes
      } else {
        // Handle product suggestions
        const sortedSuggestions = (aiResponse.productSuggestions || []).sort(
          (a, b) => {
            // Show recommended products first
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            // Then show in-season products
            if (a.product?.inSeason && !b.product?.inSeason) return -1;
            if (!a.product?.inSeason && b.product?.inSeason) return 1;
            return 0;
          }
        );
        setCurrentSuggestions(sortedSuggestions);
        setShowDishes(false);
        setCurrentDishSuggestions([]); // Clear dish suggestions when showing products
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to get AI response. Please try again.", "error");

      // Restore user input on failure
      setInputMessage(currentInput);
      setPendingImage(currentImage);

      // Remove the failed message from display
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Send the answer as a message
    const question = currentQuestions.find((q) => q.id === questionId);
    if (question) {
      const answerMessage = `${question.question} ${answer}`;
      handleSendMessage(answerMessage);
    }
  };

  const handleAddToCart = async (
    suggestion: ProductSuggestion,
    index: number
  ) => {
    console.log("Add to cart clicked:", suggestion); // Debug log

    if (!suggestion.product) {
      // Try to find product by name if product object is missing
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(suggestion.productName)}&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            const foundProduct = data.products[0];
            suggestion.product = {
              id: foundProduct.id,
              name: foundProduct.name,
              price: foundProduct.price,
              options: foundProduct.options || [],
              inSeason: foundProduct.in_season !== false,
              image: foundProduct.images?.[0],
            };
          }
        }
      } catch (error) {
        console.error("Error finding product:", error);
      }
    }

    if (suggestion.product) {
      // Check if product is out of season
      if (suggestion.product.inSeason === false) {
        showToast(
          "This product is currently out of season and cannot be added to cart",
          "error"
        );
        return;
      }

      try {
        const { addToCart } = await import("src/lib/actions/cart.actions");

        // Get selected option for this product
        const selectedOption = selectedOptions[index];

        // Add to cart with selected option or default
        await addToCart(suggestion.product.id, 1, selectedOption);

        const optionText = selectedOption
          ? ` (${selectedOption.name || selectedOption})`
          : "";
        showToast(
          `Added ${suggestion.product.name}${optionText} to cart!`,
          "success"
        );
      } catch (error) {
        console.error("Failed to add to cart:", error);
        showToast(`Failed to add ${suggestion.productName} to cart`, "error");
      }
    } else {
      showToast(
        `${suggestion.productName} is not available in our store`,
        "error"
      );
    }
  };

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  const handleSaveEdit = (messageId: string) => {
    if (!editingContent.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: editingContent.trim() } : msg
      )
    );
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleOptionSelect = (suggestionIndex: number, option: any) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [suggestionIndex]: option,
    }));
  };

  const handleDishSelect = async (dish: DishSuggestion) => {
    // Add user message for dish selection
    const dishMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: `I want to make ${dish.name}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, dishMessage]);

    // Send message to get ingredients for this specific dish
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/meal-planner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `I want to make ${dish.name}. Please provide the ingredients I need to buy.`,
          conversationHistory,
          selectedDish: dish,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const aiResponse: AIResponse = await response.json();

      // Add AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: aiResponse.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: `I want to make ${dish.name}` },
        { role: "assistant", content: aiResponse.message },
      ]);

      // Show ingredients instead of dishes
      setCurrentDishSuggestions([]);
      setShowDishes(false);
      setLastSelectedDish(dish);

      const sortedSuggestions = (aiResponse.productSuggestions || []).sort(
        (a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          if (a.product?.inSeason && !b.product?.inSeason) return -1;
          if (!a.product?.inSeason && b.product?.inSeason) return 1;
          return 0;
        }
      );
      setCurrentSuggestions(sortedSuggestions);
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to get ingredients. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-[140px] md:bottom-[80px] right-4 z-50">
        <div className="relative">
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-75"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse opacity-50"></div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white p-4 rounded-full shadow-xl hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl group overflow-hidden"
            aria-label="Open AI Chat"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            {/* Sparkle decorations */}
            <Sparkles
              size={12}
              className="absolute top-1 right-1 text-yellow-300 animate-bounce delay-300"
            />
            <Star
              size={8}
              className="absolute bottom-1 left-1 text-yellow-200 animate-pulse delay-700"
            />

            <Bot size={24} className="relative z-10 animate-pulse" />
          </button>
        </div>
      </div>
    );
  }

  // Full chat interface when open
  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-lg min-h-[90%] sm:w-[500px]">
      <Card className="h-full shadow-2xl border-0 bg-white overflow-hidden rounded-2xl backdrop-blur-sm bg-white/95">
        <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white p-4 relative overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-10 -translate-y-10 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-8 translate-y-8 animate-pulse delay-1000"></div>

          <div className="relative flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="relative">
                <Bot size={22} className="animate-pulse" />
                <Sparkles
                  size={10}
                  className="absolute -top-1 -right-1 text-yellow-300 animate-bounce"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base">AI Meal Planner</span>
                <span className="text-xs text-green-100 font-normal">
                  Powered by AI
                </span>
              </div>
            </CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hover:scale-110 transform"
                title="Minimize"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors hover:scale-110 transform"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${
                      message.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user" ? "bg-blue-500" : "bg-green-500"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User size={12} className="text-white" />
                      ) : (
                        <Bot size={12} className="text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-xl p-3 shadow-sm relative group ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : "bg-white border border-gray-200 text-gray-800"
                      }`}
                    >
                      {/* Edit button for user messages */}
                      {message.type === "user" && !isLoading && (
                        <button
                          onClick={() =>
                            handleEditMessage(message.id, message.content)
                          }
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-white text-gray-600 hover:text-gray-800 p-1.5 rounded-full shadow-md transition-all duration-200 hover:scale-110"
                          title="Edit message"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}

                      {message.imageUrl && (
                        <div className="mb-2">
                          <Image
                            src={message.imageUrl}
                            alt="Uploaded food"
                            width={120}
                            height={90}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}

                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full text-sm p-2 border border-gray-300 rounded-md bg-white text-gray-800"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit(message.id);
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(message.id)}
                              className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700"
                            >
                              <Check size={10} />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center gap-1 text-xs bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600"
                            >
                              <XCircle size={10} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Questions */}
              {currentQuestions.length > 0 && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-800 text-sm">
                      Help me understand
                    </h4>
                  </div>
                  {currentQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="space-y-3 bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-blue-100"
                    >
                      <p className="text-sm text-blue-800 font-medium leading-relaxed">
                        {question.question}
                      </p>
                      {question.type === "select" && question.options && (
                        <div className="flex flex-wrap gap-2">
                          {question.options.map((option) => (
                            <Button
                              key={option}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleQuestionAnswer(question.id, option)
                              }
                              className="text-xs px-3 py-2 h-auto border-blue-300 hover:bg-blue-100 hover:border-blue-400 transition-colors"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dish Suggestions */}
              {currentDishSuggestions.length > 0 && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-xl border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold text-purple-800 text-sm">
                      🍽️ What would you like to cook?
                    </h4>
                  </div>
                  <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-200">
                    Select a dish below and I&apos;ll show you exactly what
                    ingredients to buy!
                  </p>

                  {currentDishSuggestions.map((dish, index) => (
                    <div
                      key={dish.id}
                      className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white cursor-pointer group"
                      onClick={() => handleDishSelect(dish)}
                    >
                      <div className="flex gap-3">
                        {/* Dish Image or Icon */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-red-100 flex-shrink-0 flex items-center justify-center">
                          {dish.image ? (
                            <Image
                              src={dish.image}
                              alt={dish.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-2xl">🍽️</div>
                          )}
                          {dish.isRecommended && (
                            <div className="absolute top-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-0.5 rounded-br-lg">
                              <Star className="h-2.5 w-2.5 fill-current" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-sm text-gray-900 group-hover:text-purple-700 transition-colors">
                                  {dish.name}
                                </h5>
                                {dish.isRecommended && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200"
                                  >
                                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                                    AI Pick
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mb-2">
                                {dish.description}
                              </p>

                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                  <span
                                    className={`font-medium ${
                                      dish.difficulty === "Easy"
                                        ? "text-green-600"
                                        : dish.difficulty === "Medium"
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                    }`}
                                  >
                                    {dish.difficulty}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{dish.cookingTime}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{dish.servings}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-200 group-hover:bg-purple-100 transition-colors">
                              👆 Click to get ingredients for this dish
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product Suggestions */}
              {currentSuggestions.length > 0 && (
                <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <h4 className="font-semibold text-green-800 text-sm">
                        {lastSelectedDish
                          ? `Ingredients for ${lastSelectedDish.name}`
                          : "AI Recommended Products"}
                      </h4>
                    </div>
                    {lastSelectedDish && (
                      <button
                        onClick={() => {
                          setShowDishes(true);
                          setCurrentSuggestions([]);
                          setLastSelectedDish(null);
                          // Re-show the dish suggestions by simulating the message
                          handleSendMessage("Show me more dish options");
                        }}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-md border border-purple-200 transition-colors"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        Back to dishes
                      </button>
                    )}
                  </div>

                  {currentSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-white"
                    >
                      <div className="flex gap-3">
                        {/* Product Image */}
                        {suggestion.product && (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={
                                suggestion.product.image ||
                                "/placeholder-food.jpg"
                              }
                              alt={suggestion.productName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                            {suggestion.isRecommended && (
                              <div className="absolute top-0 left-0 bg-gradient-to-r from-yellow-400 to-amber-500 text-white p-0.5 rounded-br-lg">
                                <Star className="h-2.5 w-2.5 fill-current" />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-sm text-gray-900 truncate">
                                  {suggestion.productName}
                                </h5>
                                {suggestion.isRecommended && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200"
                                  >
                                    <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                                    AI Pick
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                {suggestion.reason}
                              </p>
                              <p className="text-xs text-green-600 mt-1 font-medium">
                                Qty: {suggestion.quantity || "1"}
                              </p>
                            </div>
                          </div>

                          {suggestion.product && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 font-semibold"
                                >
                                  {formatNaira(suggestion.product.price)}
                                </Badge>
                                {suggestion.product.inSeason === true ? (
                                  <Badge
                                    variant="default"
                                    className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200"
                                  >
                                    In Season
                                  </Badge>
                                ) : suggestion.product.inSeason === false ? (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs px-2 py-0.5 bg-red-100 text-red-700 border-red-200"
                                  >
                                    <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                    Out of Season
                                  </Badge>
                                ) : null}
                              </div>

                              {/* Product Options */}
                              {suggestion.product?.options &&
                                suggestion.product.options.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-medium">
                                      Select option:
                                    </p>
                                    <Select
                                      value={
                                        selectedOptions[index]
                                          ? selectedOptions[index].name ||
                                            selectedOptions[index]
                                          : ""
                                      }
                                      onValueChange={(value) => {
                                        const selectedOption =
                                          suggestion.product?.options?.find(
                                            (opt: any) =>
                                              (opt.name || opt) === value
                                          );
                                        handleOptionSelect(
                                          index,
                                          selectedOption
                                        );
                                      }}
                                    >
                                      <SelectTrigger className="w-full h-7 text-xs border-gray-300 bg-white/80">
                                        <SelectValue placeholder="Choose option..." />
                                      </SelectTrigger>
                                      <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                                        {suggestion.product.options.map(
                                          (option: any, optIndex: number) => (
                                            <SelectItem
                                              key={optIndex}
                                              value={option.name || option}
                                              className="text-xs"
                                            >
                                              <div className="flex items-center gap-2">
                                                {option.image && (
                                                  <Image
                                                    src={option.image}
                                                    alt={option.name || option}
                                                    width={24}
                                                    height={24}
                                                    className="w-6 h-6 rounded object-cover"
                                                  />
                                                )}
                                                <div>
                                                  <p className="font-medium">
                                                    {option.name || option}
                                                  </p>
                                                  {option.price && (
                                                    <p className="text-xs text-gray-500">
                                                      +
                                                      {formatNaira(
                                                        option.price
                                                      )}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAddToCart(suggestion, index)
                                }
                                className="w-full text-xs h-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm"
                                disabled={
                                  suggestion.available === false ||
                                  suggestion.product?.inSeason === false ||
                                  (suggestion.product?.options &&
                                    suggestion.product.options.length > 0 &&
                                    !selectedOptions[index])
                                }
                              >
                                <ShoppingCart className="h-3 w-3 mr-1.5" />
                                {!suggestion.product
                                  ? "Find & Add"
                                  : suggestion.product?.inSeason === false
                                    ? "Out of Season"
                                    : suggestion.available === false
                                      ? "Unavailable"
                                      : "Add to Cart"}
                              </Button>

                              {suggestion.product?.inSeason === false && (
                                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                                  <AlertCircle className="h-3 w-3 inline mr-1" />
                                  This product is currently out of season. Check
                                  back later or explore similar alternatives.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                    <Bot size={12} className="text-green-500" />
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <Separator />

            {/* Input Area */}
            <div className="p-3 space-y-2">
              {/* Pending image preview */}
              {pendingImage && (
                <div className="relative inline-block">
                  <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={16} className="text-gray-600" />
                      <span className="text-xs text-gray-600">
                        Image ready to send
                      </span>
                      <button
                        onClick={() => setPendingImage(null)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove image"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <Image
                      src={pendingImage}
                      alt="Pending upload"
                      width={80}
                      height={60}
                      className="rounded object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      pendingImage
                        ? "Describe this image..."
                        : "What would you like to cook?"
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !isLoading) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={
                    isLoading || (!inputMessage.trim() && !pendingImage)
                  }
                  size="sm"
                  className="px-3"
                >
                  <Send size={12} />
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Camera size={12} />
                </Button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <p className="text-xs text-gray-500 text-center">
                💡 Ask me about recipes, upload food photos, or edit your
                messages
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
