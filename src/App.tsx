import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import ChatLayout from './components/ChatLayout';
import { Settings, X, ShieldAlert, MessageSquare } from 'lucide-react';

function App() {
  const { apiKey, setApiKey, useVoicePrompt, setUseVoicePrompt, userName, setUserName } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempVoicePrompt, setTempVoicePrompt] = useState(useVoicePrompt);
  const [tempUserName, setTempUserName] = useState(userName);

  useEffect(() => {
    useAppStore.getState().loadLibrary();
    if (!apiKey) {
      setIsSettingsOpen(true);
    }
  }, [apiKey]);

  const saveSettings = () => {
    setApiKey(tempKey);
    setUseVoicePrompt(tempVoicePrompt);
    setUserName(tempUserName);
    setIsSettingsOpen(false);
  };

  return (
    <div className="h-full w-full flex flex-col font-sans bg-white">
      {/* 顶部导航栏 */}
      <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 bg-white z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-400/20">
            <span className="font-bold text-teal-950 text-lg leading-none">V</span>
          </div>
          <h1 className="text-xl font-bold premium-text-gradient tracking-wide">
            VoiceTavern
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => useAppStore.getState().createNewSession()}
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 rounded-full text-sm font-bold flex items-center transition-colors shadow-sm"
          >
            <MessageSquare size={16} className="mr-1.5" />
            新建聊天
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full group transition-colors"
          >
            <Settings size={20} className="text-slate-600 group-hover:text-slate-900 group-hover:rotate-45 transition-all duration-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-white">
        <ChatLayout />
      </main>

      {/* 设置面板 (模态框) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">系统设置</h2>
              {apiKey && (
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>Dashscope API 密钥</span>
                  <a href="https://platform.qianwenai.com/home/api-keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 hover:underline flex items-center text-xs">
                    <span>前往获取 API Key</span>
                  </a>
                </label>
                <input 
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>您的称呼 (User Name)</span>
                </label>
                <input 
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="例如：主人、老李"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={tempVoicePrompt}
                      onChange={(e) => setTempVoicePrompt(e.target.checked)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${tempVoicePrompt ? 'bg-teal-500' : 'bg-slate-300'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${tempVoicePrompt ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">启用 VoiceTavern 语音优化指令</span>
                    <span className="text-xs text-slate-400">开启后将强制 AI 缩短回复，并加入语气词以模拟真实通话。</span>
                  </div>
                </label>
              </div>

              <div>
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start space-x-3">
                  <ShieldAlert size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800/80 leading-relaxed">
                    隐私安全承诺：您的 API Key 将仅保存在本地浏览器的 localStorage 中，绝不会上传至除阿里云官方接口以外的任何第三方服务器。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={!tempKey}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
              >
                保存并应用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
