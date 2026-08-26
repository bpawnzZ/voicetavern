import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import ChatLayout from './components/ChatLayout';
import { Settings, X, ShieldAlert, MessageSquare } from 'lucide-react';
import { 
  PROVIDERS, 
  QWEN_VOICES, 
  XAI_VOICES, 
  OPENAI_VOICES, 
  GEMINI_VOICES, 
  VOLCENGINE_VOICES, 
  GLM_VOICES 
} from './api/types';
import type { VoiceProvider, ProviderConfig } from './api/types';
import { downloadBackupFile, importFullBackup } from './utils/backup';

export default function App() {
  const { 
    voiceProvider, setVoiceProvider,
    providerConfigs, updateProviderConfig,
    useVoicePrompt, setUseVoicePrompt, 
    userName, setUserName 
  } = useAppStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<VoiceProvider>(voiceProvider);
  const [tempConfigs, setTempConfigs] = useState<Record<VoiceProvider, ProviderConfig>>({ ...providerConfigs });
  const [tempVoicePrompt, setTempVoicePrompt] = useState(useVoicePrompt);
  const [tempUserName, setTempUserName] = useState(userName);

  const activeProviderConfig = tempConfigs[selectedProvider] || { apiKey: '', voice: '' };

  useEffect(() => {
    useAppStore.getState().loadLibrary();
    const hasAnyKey = Object.values(providerConfigs).some(c => c.apiKey?.trim().length > 0);
    if (!hasAnyKey) {
      setIsSettingsOpen(true);
    }
  }, [providerConfigs]);

  const handleConfigChange = (field: keyof ProviderConfig, value: string) => {
    setTempConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        [field]: value
      }
    }));
  };

  const getVoiceOptions = (p: VoiceProvider) => {
    switch (p) {
      case 'qwen': return QWEN_VOICES;
      case 'xai': return XAI_VOICES;
      case 'openai': return OPENAI_VOICES;
      case 'gemini': return GEMINI_VOICES;
      case 'volcengine': return VOLCENGINE_VOICES;
      case 'glm': return GLM_VOICES;
    }
  };

  const saveSettings = () => {
    setVoiceProvider(selectedProvider);
    Object.keys(tempConfigs).forEach((p) => {
      updateProviderConfig(p as VoiceProvider, tempConfigs[p as VoiceProvider]);
    });
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
            onClick={() => {
              setTempConfigs({ ...useAppStore.getState().providerConfigs });
              setSelectedProvider(useAppStore.getState().voiceProvider);
              setIsSettingsOpen(true);
            }}
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
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">系统设置</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-100">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 6 大提供商选择网格 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  实时语音服务提供商 (6 大提供商)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {PROVIDERS.map((p) => {
                    const isSelected = selectedProvider === p.id;
                    const hasKey = tempConfigs[p.id]?.apiKey?.trim().length > 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProvider(p.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center text-center transition-all relative ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm ring-2 ring-teal-400/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate w-full font-bold">{p.name}</span>
                        <span className="text-[10px] font-normal text-slate-400 truncate w-full mt-0.5">{p.subName}</span>
                        {hasKey && (
                          <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 动态展示选中提供商的 API Key */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>{PROVIDERS.find(p => p.id === selectedProvider)?.name} 配置</span>
                  <span className="text-xs font-normal text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    {PROVIDERS.find(p => p.id === selectedProvider)?.subName}
                  </span>
                </h3>

                {PROVIDERS.find(p => p.id === selectedProvider)?.hasAppId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      App ID (应用 ID)
                    </label>
                    <input 
                      type="text"
                      value={activeProviderConfig.appId || ''}
                      onChange={(e) => handleConfigChange('appId', e.target.value)}
                      placeholder="火山引擎 App ID..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    API Key (密钥)
                  </label>
                  <input 
                    type="password"
                    value={activeProviderConfig.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    placeholder={`${selectedProvider} API Key...`}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    默认音色 (Voice)
                  </label>
                  <select
                    value={activeProviderConfig.voice || getVoiceOptions(selectedProvider)[0]?.id}
                    onChange={(e) => handleConfigChange('voice', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  >
                    {getVoiceOptions(selectedProvider).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
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

              {/* 数据备份与跨端迁移 */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  数据备份与跨端迁移
                </label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadBackupFile();
                      } catch (e: any) {
                        alert('导出失败: ' + e.message);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    📦 导出全量备份 (.vtbackup)
                  </button>
                  <label className="flex-1 py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors">
                    📥 恢复备份文件
                    <input
                      type="file"
                      accept=".vtbackup,.json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          await importFullBackup(text);
                          alert('备份恢复成功！');
                          setIsSettingsOpen(false);
                        } catch (err: any) {
                          alert(err.message);
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  一键将所有角色卡、世界书、聊天记录与密钥配置打包，方便在 PC、安卓与 iOS 设备间无缝同步。
                </p>
              </div>

              <div>
                <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start space-x-3">
                  <ShieldAlert size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800/80 leading-relaxed">
                    隐私安全承诺：您的 API Key 将仅保存在本地设备中，绝不会上传至第三方服务器。
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={!activeProviderConfig.apiKey?.trim()}
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
