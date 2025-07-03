'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@components/ui/dialog';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vendor';
  timestamp: Date;
}

interface ChatModalProps {
  vendorId: string;
  vendorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatModal({ vendorId, vendorName, isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const mockMessages: Message[] = [
        {
          id: '1',
          text: `Hello! Thanks for reaching out to ${vendorName}. How can we help you today?`,
          sender: 'vendor',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          text: 'Do you have this product in stock?',
          sender: 'user',
          timestamp: new Date(Date.now() - 1800000),
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      toast.error('Failed to load chat history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [fetchChatHistory, isOpen, vendorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    // Optimistically update UI
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    try {
      setTimeout(() => {
        const vendorReply: Message = {
          id: (Date.now() + 1).toString(),
          text: `Thanks for your message! ${vendorName} will respond shortly.`,
          sender: 'vendor',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, vendorReply]);
      }, 1000 + Math.random() * 2000);
    } catch (error) {
      toast.error('Failed to send message');
      // Rollback optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {vendorName}</DialogTitle>
          <DialogDescription>
            Messages are private between you and the vendor
          </DialogDescription>
        </DialogHeader>
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 border rounded-lg mb-4 bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender === 'user' 
                      ? 'bg-green-600 text-white rounded-tr-none' 
                      : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-green-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}