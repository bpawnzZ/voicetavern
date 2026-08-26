import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import ChatLayout from './components/ChatLayout';
import { Settings, X, ShieldAlert, MessageSquare } from 'lucide-react';
import { QWEN_VOICES, XAI_VOICES } from './api/types';
import type { VoiceProvider } from './api/types';

function App() {
  const { 
    apiKey, setApiKey, 
    xaiApiKey, setXaiApiKey,
    voiceProvider, setVoiceProvider,
    qwenVoice, setQwenVoice,
    xaiVoice, setXaiVoice,
    useVoicePrompt, setUseVoicePrompt, 
    userName, setUserName 
  } = useAppStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempXaiKey, setTempXaiKey] = useState(xaiApiKey);
  const [tempProvider, setTempProvider] = useState<VoiceProvider>(voiceProvider);
  const [tempQwenVoice, setTempQwenVoice] = useState(qwenVoice);
  const [tempXaiVoice, setTempXaiVoice] = useState(xaiVoice);
  const [tempVoicePrompt, setTempVoicePrompt] = useState(useVoicePrompt);
  const [tempUserName, setTempUserName] = useState(userName);

  useEffect(() => {
    useAppStore.getState().loadLibrary();
    if (!apiKey && !xaiApiKey) {
      setIsSettingsOpen(true);
    }
  }, [apiKey, xaiApiKey]);

  const saveSettings = () => {
    setApiKey(tempKey);
    setXaiApiKey(tempXaiKey);
    setVoiceProvider(tempProvider);
    setQwenVoice(tempQwenVoice);
    setXaiVoice(tempXaiVoice);
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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">系统设置</h2>
              {(apiKey || xaiApiKey) && (
                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                  <X size={24} />
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* 语音提供商选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  实时语音服务提供商
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTempProvider('qwen')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center transition-all ${
                      tempProvider === 'qwen'
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>阿里云通义千问</span>
                    <span className="text-[11px] font-normal text-slate-400 mt-0.5">Qwen Realtime</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempProvider('xai')}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold flex flex-col items-center transition-all ${
                      tempProvider === 'xai'
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>xAI Grok Voice</span>
                    <span className="text-[11px] font-normal text-slate-400 mt-0.5">Speech-to-Speech</span>
                  </button>
                </div>
              </div>

              {/* API Keys */}
              {tempProvider === 'qwen' ? (
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>Dashscope API 密钥</span>
                    <a href="https://platform.qianwenai.com/home/api-keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 hover:underline flex items-center text-xs">
                      <span>获取 DashScope Key</span>
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
              ) : (
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                    <span>xAI API 密钥</span>
                    <a href="https://console.x.ai/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 hover:underline flex items-center text-xs">
                      <span>获取 xAI API Key</span>
                    </a>
                  </label>
                  <input 
                    type="password"
                    value={tempXaiKey}
                    onChange={(e) => setTempXaiKey(e.target.value)}
                    placeholder="xai-..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all placeholder:text-slate-400"
                  />
                </div>
              )}

              {/* 音色选择 */}
              {tempProvider === 'qwen' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Qwen 默认音色
                  </label>
                  <select
                    value={tempQwenVoice}
                    onChange={(e) => setTempQwenVoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all"
                  >
                    {QWEN_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    xAI Grok Voice 默认音色
                  </label>
                  <select
                    value={tempXaiVoice}
                    onChange={(e) => setTempXaiVoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all"
                  >
                    {XAI_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    隐私安全承诺：您的 API Key 将仅保存在本地浏览器的 localStorage 中，绝不会上传至第三方服务器。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={tempProvider === 'qwen' ? !tempKey : !tempXaiKey}
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
