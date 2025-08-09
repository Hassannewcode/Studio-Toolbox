import React, { useState, useEffect, useRef } from 'react';
import { createChat, sendMessageStream } from '../services/geminiService';
import { type ChatMessage } from '../types';
import { type Chat } from "@google/genai";
import usePersistentState from '../hooks/usePersistentState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { MessageIcon } from '../components/icons/MessageIcon';
import { PageHeader } from '../components/PageHeader';

const ChatSandbox: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('chatSandbox_messages', []);
  const [userInput, setUserInput] = usePersistentState<string>('chatSandbox_userInput', '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChat(createChat());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chat) return;

    const newUserMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
        const stream = await sendMessageStream(chat, userInput);
        let modelResponse = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        for await (const chunk of stream) {
            modelResponse += chunk.text;
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                return newMessages;
            });
        }

    } catch (err) {
      setError('Failed to send message. Check console for details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
        <PageHeader
            icon={<MessageIcon className="w-6 h-6" />}
            title="Chat Sandbox"
            description="Have a streaming conversation with a Gemini model."
        />
        <Card className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    )}
                    <div className={`px-4 py-2 rounded-lg max-w-xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-background' : 'bg-surface text-on-surface'}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.text || <span className="animate-pulse">...</span>}</p>
                    </div>
                </div>
                ))}
                {isLoading && messages[messages.length-1]?.role !== 'model' && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex-shrink-0 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-surface">
                            <span className="animate-pulse text-sm">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-border-color bg-surface">
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <div className="flex gap-2">
                <Input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button onClick={handleSendMessage} isLoading={isLoading} disabled={!userInput.trim()}>
                    Send
                </Button>
                </div>
            </div>
        </Card>
    </div>
  );
};

export default ChatSandbox;
