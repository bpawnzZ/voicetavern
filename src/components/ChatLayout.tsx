import { useRef, useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { WorldbookEngine } from '../utils/worldbook_engine';
import { QwenRealtimeClient } from '../api/qwen_realtime';
import { Mic, MicOff, Menu, X } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import LibrarySidebar from './LibrarySidebar';
import { assemblePrompt } from '../utils/preset_engine';

export default function ChatLayout() {
  const { apiKey, activeCharacter, activeWorldbook, messages, addMessage, isConnected, setIsConnected } = useAppStore();
  const [client, setClient] = useState<QwenRealtimeClient | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleConnection = async () => {
    if (isConnected && client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
    } else {
      if (!apiKey) return alert("请先在设置中填写 API Key");
      
      let wbEngine: WorldbookEngine | undefined = undefined;
      let constantLore: string[] = [];
      if (activeWorldbook) {
        wbEngine = new WorldbookEngine(activeWorldbook.book);
        constantLore = wbEngine.getConstantEntries();
      }

      let charData = undefined;
      if (activeCharacter) {
        const cardRoot = activeCharacter.card as any;
        const data = cardRoot.data || cardRoot || {};
        
        let embeddedLore = '';
        if (data.character_book?.entries && Array.isArray(data.character_book.entries)) {
          const constantEntries = data.character_book.entries
            .filter((e: any) => e.constant && e.enabled !== false)
            .sort((a: any, b: any) => (a.insertion_order || 0) - (b.insertion_order || 0))
            .map((e: any) => e.content)
            .join('\n\n');
          if (constantEntries) embeddedLore = constantEntries;
        }
        
        charData = {
          name: data.name || cardRoot.name || 'Unknown',
          description: data.description || cardRoot.description || '',
          personality: data.personality || cardRoot.personality || '',
          scenario: data.scenario || cardRoot.scenario || '',
          system_prompt: (data.system_prompt || cardRoot.system_prompt || data.extensions?.chub?.system_prompt || data.extensions?.depth_prompt?.prompt || '') + (embeddedLore ? '\n\n' + embeddedLore : ''),
          mesExamples: data.mes_example || cardRoot.mes_example || ''
        };
      }

      // 组装最终的 System Prompt
      const systemPrompt = assemblePrompt(null, charData, constantLore, useAppStore.getState().useVoicePrompt, useAppStore.getState().userName);
      
      console.log('--- Final System Prompt ---\n', systemPrompt);

      const newClient = new QwenRealtimeClient(
        apiKey,
        systemPrompt,
        wbEngine,
        (role, text, isDelta, id) => {
          if (isDelta && id) {
            useAppStore.getState().appendMessageDelta(id, role, text);
          } else {
            addMessage({ role, text, id });
          }
        },
        (err) => {
          console.error('API Error:', err);
          alert(`连接错误: ${err}`);
          setIsConnected(false);
        }
      );

      try {
        await newClient.connect();
        setClient(newClient);
        setIsConnected(true);
      } catch (e) {
        console.error(e);
        alert('连接失败');
      }
    }
  };

  return (
    <div className="flex h-full w-full relative bg-white">
      
      {/* 移动端 菜单按钮 */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2.5 rounded-xl bg-white border border-gray-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 移动端 Sidebar (Drawer) */}
      <div className={`
        fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 md:hidden
        ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        <div className={`
          absolute top-0 left-0 w-[85%] max-w-sm h-full shadow-2xl overflow-hidden transform transition-transform duration-300
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors z-50"
          >
            <X size={24} />
          </button>
          <LibrarySidebar isCollapsed={false} onToggleCollapse={() => {}} />
        </div>
      </div>

      {/* 桌面端 Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <LibrarySidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col relative bg-white min-w-0 transition-all duration-300">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth z-0 pt-4 md:pt-8 bg-white">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
              <p className="text-lg tracking-wide font-medium text-slate-400">点击底部按钮，开始沉浸式语音对话</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
              {m.role !== 'user' && activeCharacter?.avatarUrl && (
                <img src={activeCharacter.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover mr-3 mt-1 shadow-sm border border-gray-200" />
              )}
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm border ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-teal-400 to-emerald-400 text-teal-950 border-transparent shadow-teal-400/20 rounded-br-sm' 
                  : 'bg-slate-50 border-gray-200 text-slate-800 rounded-bl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* 底部悬浮语音控制栏 */}
        <div className="h-36 bg-white border-t border-gray-200 flex flex-col items-center justify-center px-4 relative pb-4 z-10 rounded-t-3xl md:rounded-none">
          <div className="absolute top-0 left-0 right-0 transform -translate-y-1/2 flex justify-center">
            <div className="relative group">
              {isConnected && (
                <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping"></div>
              )}
              <button 
                onClick={toggleConnection}
                className={`relative p-5 rounded-full shadow-lg transition-all duration-300 transform active:scale-90 ${
                  isConnected 
                    ? 'bg-gradient-to-tr from-rose-400 to-orange-400 hover:shadow-rose-400/30 hover:scale-105 border-4 border-white text-white' 
                    : 'bg-gradient-to-tr from-teal-200 to-emerald-300 hover:shadow-teal-300/30 hover:scale-105 border-4 border-white text-teal-900'
                }`}
              >
                {isConnected ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
            </div>
          </div>
          
          <div className="w-full max-w-md mt-8">
            <AudioVisualizer isActive={isConnected} />
          </div>
          <p className={`text-xs mt-3 font-semibold tracking-wider uppercase transition-colors duration-300 ${
            isConnected ? 'premium-text-gradient animate-pulse' : 'text-slate-400'
          }`}>
            {isConnected ? '正在倾听与思考中...' : '已断开连接'}
          </p>
        </div>
      </div>

    </div>
  );
}
