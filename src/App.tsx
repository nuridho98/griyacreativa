import React, { useState } from 'react';
import { 
  Smartphone, 
  Code2, 
  BookOpen, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { AndroidSimulator } from './components/AndroidSimulator';
import { CodeInspector } from './components/CodeInspector';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { generateAndroidProjectZip, triggerBlobDownload } from './androidProject/zipExporter';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'guide'>('simulator');
  const [userAgentMode, setUserAgentMode] = useState<'desktop' | 'mobile'>('desktop');
  const [targetSdk, setTargetSdk] = useState<number>(28);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const zipBlob = await generateAndroidProjectZip(targetSdk, userAgentMode);
      triggerBlobDownload(zipBlob, `WAWebWrapper-Android6-API23.zip`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor berkas ZIP proyek.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1015] text-slate-100 flex flex-col font-sans">
      {/* Header Utama */}
      <header className="border-b border-slate-800 bg-[#0e161e]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#075E54] flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold text-lg">
              💬
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  WhatsApp Web Wrapper (Java)
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Android 6.0 (API 23)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                minSdk 23 • targetSdk {targetSdk} • Fullscreen WebView • Runtime Permissions • FileChooser • Cookies
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Membuat ZIP...' : 'Unduh Proyek (.ZIP)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header (Tabs) */}
      <div className="border-b border-slate-800/80 bg-[#0d141b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 sm:space-x-3 py-2">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'simulator'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulator & Uji Interaktif</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Source Code (Java & XML)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'guide'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panduan & Arsitektur</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'simulator' && (
          <AndroidSimulator
            userAgentMode={userAgentMode}
            setUserAgentMode={setUserAgentMode}
            targetSdk={targetSdk}
            setTargetSdk={setTargetSdk}
          />
        )}

        {activeTab === 'code' && (
          <CodeInspector
            targetSdk={targetSdk}
            userAgentMode={userAgentMode}
          />
        )}

        {activeTab === 'guide' && (
          <ArchitectureGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-[#090e13] text-center text-xs text-slate-500">
        <p>WhatsApp Web Android WebView Wrapper • Kompatibel Android 6.0 Marshmallow (API 23+) • Siap Di-build di Android Studio</p>
      </footer>
    </div>
  );
}
