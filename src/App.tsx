import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import ChatLayout from './components/ChatLayout';
import { Settings, X, ShieldAlert, MessageSquare, Sun, Moon } from 'lucide-react';
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
import PromptManager from './components/PromptManager';

export default function App() {
  const { 
    voiceProvider, setVoiceProvider,
    providerConfigs, updateProviderConfig,
    useVoicePrompt, setUseVoicePrompt, 
    userName, setUserName,
    darkMode, setDarkMode
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

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
      case 'custom': return [];
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
    <div className="h-full w-full flex flex-col font-sans bg-white dark:bg-slate-900">
      {/* Top navigation bar */}
      <header className="h-16 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-slate-900 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-400/20">
            <span className="font-bold text-teal-950 dark:text-teal-100 text-lg leading-none">V</span>
          </div>
          <h1 className="text-xl font-bold premium-text-gradient tracking-wide">
            VoiceTavern
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => useAppStore.getState().createNewSession()}
            className="px-4 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-300 rounded-full text-sm font-bold flex items-center transition-colors shadow-sm"
          >
            <MessageSquare size={16} className="mr-1.5" />
            New Chat
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full group transition-colors"
          >
            {darkMode
              ? <Sun size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors" />
              : <Moon size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 transition-colors" />}
          </button>
          <button 
            onClick={() => {
              setTempConfigs({ ...useAppStore.getState().providerConfigs });
              setSelectedProvider(useAppStore.getState().voiceProvider);
              setIsSettingsOpen(true);
            }}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full group transition-colors"
          >
            <Settings size={20} className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 group-hover:rotate-45 transition-all duration-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative bg-white dark:bg-slate-900">
        <ChatLayout />
      </main>

      {/* Settings panel (modal) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Provider selection grid (6 providers) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Realtime voice providers ({PROVIDERS.length})
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
                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-sm ring-2 ring-teal-400/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
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

              {/* API key for the selected provider */}
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center justify-between">
                  <span>{PROVIDERS.find(p => p.id === selectedProvider)?.name} configuration</span>
                  <span className="text-xs font-normal text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-900">
                    {PROVIDERS.find(p => p.id === selectedProvider)?.subName}
                  </span>
                </h3>

                {PROVIDERS.find(p => p.id === selectedProvider)?.hasAppId && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      App ID
                    </label>
                    <input 
                      type="text"
                      value={activeProviderConfig.appId || ''}
                      onChange={(e) => handleConfigChange('appId', e.target.value)}
                      placeholder="Volcengine App ID..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    API Key
                  </label>
                  <input 
                    type="password"
                    value={activeProviderConfig.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    placeholder={`${selectedProvider} API Key...`}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  />
                </div>

                {selectedProvider === 'custom' && (
                  <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Any OpenAI-compatible HTTP API. Chat, transcription and speech are separate
                      requests, so the voice loop runs on this device — no vendor protocol needed.
                    </p>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">LLM base URL</label>
                      <input
                        type="text"
                        value={activeProviderConfig.baseUrl || ''}
                        onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Chat model</label>
                      <input
                        type="text"
                        value={activeProviderConfig.model || ''}
                        onChange={(e) => handleConfigChange('model', e.target.value)}
                        placeholder="gpt-4o-mini"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">STT model (same host)</label>
                      <input
                        type="text"
                        value={activeProviderConfig.sttModel || ''}
                        onChange={(e) => handleConfigChange('sttModel', e.target.value)}
                        placeholder="whisper-1"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Optional separate TTS endpoint. Leave blank to use the LLM host.
                      </p>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">TTS base URL</label>
                      <input
                        type="text"
                        value={activeProviderConfig.ttsBaseUrl || ''}
                        onChange={(e) => handleConfigChange('ttsBaseUrl', e.target.value)}
                        placeholder="http://localhost:8880/v1"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">TTS API key</label>
                      <input
                        type="password"
                        value={activeProviderConfig.ttsApiKey || ''}
                        onChange={(e) => handleConfigChange('ttsApiKey', e.target.value)}
                        placeholder="same as above"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">TTS model</label>
                      <input
                        type="text"
                        value={activeProviderConfig.ttsModel || ''}
                        onChange={(e) => handleConfigChange('ttsModel', e.target.value)}
                        placeholder="tts-1"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">TTS voice</label>
                      <input
                        type="text"
                        value={activeProviderConfig.voice || ''}
                        onChange={(e) => handleConfigChange('voice', e.target.value)}
                        placeholder="alloy"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                      />
                    </div>
                  </div>
                  </div>
                )}

                {selectedProvider !== 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Default voice
                    </label>
                    <select
                      value={activeProviderConfig.voice || getVoiceOptions(selectedProvider)[0]?.id}
                      onChange={(e) => handleConfigChange('voice', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                    >
                      {getVoiceOptions(selectedProvider).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <PromptManager />

              <div>
                <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  <span>Your name</span>
                </label>
                <input 
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="e.g. Master, Alex"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50 transition-all placeholder:text-slate-400"
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
                    <div className={`absolute left-1 top-1 bg-white dark:bg-slate-900 w-4 h-4 rounded-full transition-transform ${tempVoicePrompt ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable VoiceTavern voice optimization prompt</span>
                    <span className="text-xs text-slate-400">Forces shorter replies with verbal tics to sound like a real phone call.</span>
                  </div>
                </label>
              </div>

              {/* Backup and cross-device migration */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Backup & cross-device migration
                </label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadBackupFile();
                      } catch (e: any) {
                        alert('Export failed: ' + e.message);
                      }
                    }}
                    className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300/80 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    📦 Export full backup (.vtbackup)
                  </button>
                  <label className="flex-1 py-2 px-3 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 rounded-xl text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors">
                    📥 Restore backup file
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
                          alert('Backup restored.');
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
                  Packs all character cards, world books, chat history and API keys into one file for seamless sync across PC, Android and iOS.
                </p>
              </div>

              <div>
                <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-start space-x-3">
                  <ShieldAlert size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                    Privacy: your API keys stay on this device and are never uploaded to a third-party server.
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
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
