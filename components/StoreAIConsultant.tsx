import React from 'react';
import { Sparkles, Send, X, Bot, Loader2, Utensils, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PhysicalStore } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface StoreAIConsultantProps {
  store: PhysicalStore;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const StoreAIConsultant: React.FC<StoreAIConsultantProps> = ({ store }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      if (messages.length === 0) {
        setMessages([{
          role: 'model',
          text: `Xin chào! Tôi là trợ lý AI của ${store.name}. Tôi có thể giúp bạn tìm món ăn phù hợp với sở thích, chế độ ăn kiêng hoặc tư vấn về các dịch vụ tại đây. Bạn muốn hỏi gì không?`
        }]);
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `Bạn là một trợ lý ảo thông minh cho cửa hàng/chi nhánh tên là "${store.name}".

Dưới đây là thông tin về cửa hàng:
- Loại hình: ${store.category}
- Địa chỉ: ${store.address}
- Mô tả: ${store.description}
- Thực đơn sản phẩm: ${JSON.stringify(store.menu.map(i => ({ name: i.name, category: i.category, price: i.price, description: i.description })))}

Nhiệm vụ của bạn:
1. Trả lời các câu hỏi của khách hàng về món ăn, giá cả, và các tiện ích.
2. Nếu khách hỏi về món ăn phù hợp với chế độ ăn (ví dụ: ăn kiêng, ăn chay, ít đường), hãy phân tích thực đơn và đưa ra gợi ý phù hợp nhất.
3. Luôn giữ thái độ lịch sự, chuyên nghiệp và hiếu khách.
4. Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.
5. Nếu không tìm thấy thông tin cụ thể trong menu, hãy trả lời khéo léo và gợi ý khách liên hệ hotline của chúng tôi.

Lịch sử trò chuyện:
${messages.map(m => `${m.role}: ${m.text}`).join('\n')}

Câu hỏi mới: ${userMessage}` }]
          }
        ]
      });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error('AI Consultant Error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, tôi gặp một chút trục trặc kỹ thuật. Bạn có thể thử lại sau giây lát được không?' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[400] bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-200 flex items-center gap-2 border-2 border-white"
      >
        <Sparkles size={24} />
        <span className="font-black text-sm pr-2 hidden md:block">Tư vấn AI</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[400] w-[350px] md:w-[400px] h-[550px] bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">AI Consultant</h3>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest opacity-80">Trợ lý ảo thông minh</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                      : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 italic text-gray-400 text-xs flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Đang tìm món phù hợp...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-2 bg-gray-50/50 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                 { label: 'Ăn kiêng', icon: <Utensils size={12}/> },
                 { label: 'Địa chỉ', icon: <Info size={12}/> },
                 { label: 'Món bán chạy', icon: <Sparkles size={12}/> }
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(`Món nào ở đây phù hợp cho người ${q.label.toLowerCase()}?`)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center gap-1 shadow-sm"
                >
                  {q.icon} {q.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi AI về menu hoặc dịch vụ..."
                  className="w-full pl-4 pr-12 py-4 bg-gray-50 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[9px] text-center text-gray-400 mt-3 font-bold uppercase tracking-widest opacity-60">
                Cung cấp bởi AI Lượng tử AmazeBid
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StoreAIConsultant;
