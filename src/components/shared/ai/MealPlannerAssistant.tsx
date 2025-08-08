"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Camera, Send, Bot, User, ShoppingCart, Upload } from "lucide-react";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";

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
  };
  available?: boolean;
}

interface AIResponse {
  message: string;
  questions: Question[];
  productSuggestions: ProductSuggestion[];
  needsMoreInfo: boolean;
  conversationId: string;
}

interface MealPlannerAssistantProps {
  onAddToCart?: (product: any, quantity: number) => void;
  className?: string;
}

export default function MealPlannerAssistant({ 
  onAddToCart, 
  className 
}: MealPlannerAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI meal planning assistant. Tell me what you'd like to cook or upload a photo of a dish you want to make, and I'll help you find the right ingredients! 🍳",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<ProductSuggestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
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
        setUploadedImage(result);
        
        // Add user message with image
        const newMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: "I want to make this dish",
          timestamp: new Date(),
          imageUrl: result
        };
        setMessages(prev => [...prev, newMessage]);
        
        // Send to AI
        handleSendMessage("I want to make this dish", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (message?: string, imageBase64?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend && !imageBase64) return;

    // Add user message if not already added
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

    try {
      const response = await fetch('/api/ai/meal-planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory,
          imageBase64: imageBase64?.split(',')[1], // Remove data:image/jpeg;base64, prefix
          userPreferences: selectedAnswers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const aiResponse: AIResponse = await response.json();

      // Add AI response message
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: messageToSend },
        { role: 'assistant', content: aiResponse.message }
      ]);

      // Set questions and suggestions
      setCurrentQuestions(aiResponse.questions || []);
      setCurrentSuggestions(aiResponse.productSuggestions || []);

      setUploadedImage(null);
    } catch (error) {
      console.error('Error:', error);
      showToast("Failed to get AI response. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Send the answer as a message
    const question = currentQuestions.find(q => q.id === questionId);
    if (question) {
      const answerMessage = `${question.question} ${answer}`;
      handleSendMessage(answerMessage);
    }
  };

  const handleAddToCart = (suggestion: ProductSuggestion) => {
    if (suggestion.product && onAddToCart) {
      onAddToCart(suggestion.product, 1);
      showToast(`Added ${suggestion.product.name} to cart!`, "success");
    } else {
      showToast("This product is not available in our store", "error");
    }
  };

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
        <CardTitle className="flex items-center gap-2">
          <Bot className="text-green-600" size={24} />
          AI Meal Planner
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Messages Container */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex gap-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                  }`}
                >
                  {message.type === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.imageUrl && (
                    <div className="mb-2">
                      <Image
                        src={message.imageUrl}
                        alt="Uploaded food"
                        width={200}
                        height={150}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Questions */}
          {currentQuestions.length > 0 && (
            <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800">Please help me understand better:</h4>
              {currentQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <p className="text-sm text-yellow-700">{question.question}</p>
                  {question.type === 'select' && question.options && (
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <Button
                          key={option}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuestionAnswer(question.id, option)}
                          className="text-xs"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  )}
                  {question.type === 'input' && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your answer..."
                        className="text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleQuestionAnswer(question.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Product Suggestions */}
          {currentSuggestions.length > 0 && (
            <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800">Recommended Products:</h4>
              {currentSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{suggestion.productName}</h5>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.reason}</p>
                      <p className="text-xs text-blue-600 mt-1">Quantity: {suggestion.quantity}</p>
                      {suggestion.product && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatNaira(suggestion.product.price)}
                          </Badge>
                          {suggestion.product.inSeason && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                              In Season
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {suggestion.available !== false && suggestion.product ? (
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(suggestion)}
                          className="text-xs"
                        >
                          <ShoppingCart size={12} className="mr-1" />
                          Add to Cart
                        </Button>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Not Available
                        </Badge>
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
                <Bot size={16} className="text-green-500" />
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <Separator />

        {/* Input Area */}
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tell me what you'd like to cook..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              size="sm"
            >
              <Send size={16} />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Camera size={16} />
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
            💡 Try: &quot;I want to make pasta for 4 people&quot; or upload a photo of a dish
          </p>
        </div>
      </CardContent>
    </Card>
  );
}