import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { sendChatMessage } from '../api/chat';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Halo! Ada yang bisa saya bantu?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendChatMessage(userMsg);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Maaf, terjadi kesalahan.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open ? (
        <div className="w-80 h-96 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold">AI Assistant</span>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white ml-auto'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="text-sm px-3 py-2 rounded-lg bg-slate-100 text-slate-400 w-fit">
                Mengetik...
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tanya sesuatu..."
              className="flex-1 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={handleSend}
              className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
