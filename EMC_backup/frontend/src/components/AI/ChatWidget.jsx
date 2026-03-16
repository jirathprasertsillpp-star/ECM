import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';
import { useAI } from '../../hooks/useAI';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: 'สวัสดีครับ ผม ECMS AI Assistant มีอะไรให้ผมช่วยเหลือเกี่ยวกับการเบิกค่าใช้จ่ายไหมครับ?', sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const { isTyping, sendMessage } = useAI();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isTyping, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), text: userMsg, sender: 'user' }]);

        const aiResponse = await sendMessage(userMsg);
        setMessages(prev => [...prev, { id: Date.now() + 1, text: aiResponse, sender: 'ai' }]);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Widget Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 z-50 relative ${
                    isOpen ? 'bg-gray-900 text-white shadow-gray-900/20' : 'bg-primary-600 text-white shadow-primary-500/30'
                }`}
                aria-label="Toggle AI Chat"
            >
                {isOpen ? <X size={24} /> : <Bot size={28} className="animate-pulse-slow" />}
                {!isOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[calc(100vw-3rem)] sm:w-80 md:w-96 h-[500px] max-h-[calc(100vh-8rem)] bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
                    
                    {/* Header */}
                    <div className="bg-gray-900 p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">ECMS Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span>
                                    <p className="text-xs text-gray-300 font-medium tracking-wide">พร้อมให้ความช่วยเหลือ</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm
                                    ${msg.sender === 'user'
                                        ? 'bg-primary-600 text-white rounded-tr-sm'
                                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="พิมพ์ข้อความที่นี่..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-4 pr-12 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="absolute right-1 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors shadow-sm"
                            >
                                <Send size={14} className="ml-0.5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
