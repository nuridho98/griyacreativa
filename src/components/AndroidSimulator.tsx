import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  RotateCcw, 
  Play, 
  Camera, 
  Mic, 
  FolderArchive, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  ChevronLeft, 
  ExternalLink,
  Info,
  Maximize2,
  RefreshCw,
  Cookie,
  UploadCloud,
  FileText
} from 'lucide-react';

interface AndroidSimulatorProps {
  userAgentMode: 'desktop' | 'mobile';
  setUserAgentMode: (mode: 'desktop' | 'mobile') => void;
  targetSdk: number;
  setTargetSdk: (sdk: number) => void;
}

export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({
  userAgentMode,
  setUserAgentMode,
  targetSdk,
  setTargetSdk,
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [historyStack, setHistoryStack] = useState<string[]>(['home']);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'chat' | 'settings'>('home');
  const [permissions, setPermissions] = useState<{
    camera: 'prompt' | 'granted' | 'denied';
    audio: 'prompt' | 'granted' | 'denied';
    storage: 'prompt' | 'granted' | 'denied';
  }>({
    camera: 'prompt',
    audio: 'prompt',
    storage: 'prompt'
  });
  const [activePermissionPrompt, setActivePermissionPrompt] = useState<'camera' | 'audio' | 'storage' | null>(null);
  const [showFileChooserModal, setShowFileChooserModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [cookieSaved, setCookieSaved] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'config'>('preview');
  const [logs, setLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' }>>([]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs(prev => [{ time, msg, type }, ...prev.slice(0, 30)]);
  };

  // Trigger splash auto-dismiss
  useEffect(() => {
    if (showSplash) {
      addLog('SplashActivity: Memulai splash screen (delay 1500ms)...', 'info');
      const timer = setTimeout(() => {
        setShowSplash(false);
        addLog('SplashActivity: Intent berpindah ke MainActivity (WebView Fullscreen).', 'success');
        addLog(`WebView: JS=true, DOMStorage=true, UA=${userAgentMode.toUpperCase()}`, 'info');
        addLog('CookieManager: Sesi cookie dimuat dan di-flush ke disk.', 'success');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const restartApp = () => {
    setShowSplash(true);
    setHistoryStack(['home']);
    setCurrentScreen('home');
    setShowFileChooserModal(false);
    setActivePermissionPrompt(null);
  };

  const handleNavigate = (screen: 'home' | 'chat' | 'settings') => {
    setHistoryStack(prev => [...prev, screen]);
    setCurrentScreen(screen);
    addLog(`WebView: Navigasi ke view '${screen}' (History stack: ${historyStack.length + 1})`, 'info');
  };

  const handleBack = () => {
    if (showFileChooserModal) {
      setShowFileChooserModal(false);
      addLog('WebChromeClient: onShowFileChooser dibatalkan oleh pengguna (null returned).', 'warn');
      return;
    }

    if (historyStack.length > 1) {
      const newStack = [...historyStack];
      newStack.pop();
      const prevScreen = newStack[newStack.length - 1] as 'home' | 'chat' | 'settings';
      setHistoryStack(newStack);
      setCurrentScreen(prevScreen);
      addLog(`onBackPressed: webView.canGoBack() == true -> webView.goBack() ke '${prevScreen}'`, 'success');
    } else {
      addLog('onBackPressed: webView.canGoBack() == false -> super.onBackPressed() (Aplikasi Ditutup)', 'warn');
      alert('Aplikasi WhatsApp Web ditutup (super.onBackPressed dijalankan karena riwayat WebView kosong).');
      restartApp();
    }
  };

  const requestPermission = (perm: 'camera' | 'audio' | 'storage') => {
    setActivePermissionPrompt(perm);
    addLog(`ActivityCompat.requestPermissions: Meminta izin Manifest.permission.${perm.toUpperCase()}`, 'warn');
  };

  const grantPermission = (perm: 'camera' | 'audio' | 'storage', granted: boolean) => {
    setPermissions(prev => ({ ...prev, [perm]: granted ? 'granted' : 'denied' }));
    setActivePermissionPrompt(null);
    if (granted) {
      addLog(`onRequestPermissionsResult: Izin ${perm.toUpperCase()} DITERIMA oleh pengguna.`, 'success');
      addLog(`WebChromeClient: onPermissionRequest() WebRTC resource diizinkan.`, 'success');
    } else {
      addLog(`onRequestPermissionsResult: Izin ${perm.toUpperCase()} DITOLAK oleh pengguna.`, 'warn');
    }
  };

  const triggerFileChooser = () => {
    setShowFileChooserModal(true);
    addLog('WebChromeClient: onShowFileChooser() dipanggil oleh WhatsApp Web (<input type="file">).', 'info');
  };

  const handleFileChosen = (type: 'camera' | 'gallery') => {
    const filename = type === 'camera' 
      ? `IMG_CAM_${Date.now().toString().slice(-4)}.jpg` 
      : `DOC_UPLOAD_${Date.now().toString().slice(-4)}.pdf`;
    
    setUploadedFiles(prev => [filename, ...prev]);
    setShowFileChooserModal(false);
    addLog(`onActivityResult: RESULT_OK dari ${type === 'camera' ? 'Kamera (FileProvider URI)' : 'Galeri/Penyimpanan'}. File: ${filename}`, 'success');
    addLog(`mFilePathCallback.onReceiveValue(new Uri[]{ uri }) dieksekusi.`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Simulator HP Android */}
      <div className="lg:col-span-6 flex flex-col items-center">
        {/* Frame Handphone Android 6.0 */}
        <div className="w-full max-w-[360px] bg-[#1a232a] p-3 rounded-[36px] shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 relative">
          {/* Kamera Depan & Speaker HP */}
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-500/60"></div>
            </div>
            <div className="w-14 h-1.5 rounded-full bg-slate-800"></div>
          </div>

          {/* Layar Smartphone (Ratio 16:9 Android Standar) */}
          <div className="w-full h-[580px] bg-[#111B21] rounded-[24px] overflow-hidden flex flex-col relative border border-slate-800">
            {/* Status Bar Android 6.0 Marshmallow */}
            <div className="h-6 bg-[#054D44] text-white/90 px-3 flex items-center justify-between text-[11px] font-sans select-none z-30">
              <span className="font-semibold">12:30</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-emerald-300">4G</span>
                <span>📶</span>
                <span>🔋 92%</span>
              </div>
            </div>

            {/* Konten Layar: Splash Screen ATAU WebView */}
            {showSplash ? (
              <div className="flex-1 bg-[#075E54] flex flex-col items-center justify-center text-white px-6 relative animate-fadeIn">
                <div className="w-20 h-20 rounded-full bg-white/10 p-3 flex items-center justify-center shadow-lg mb-4 ring-2 ring-emerald-400/30">
                  <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center text-white text-2xl font-bold">
                    💬
                  </div>
                </div>
                <h1 className="text-xl font-bold tracking-wide">WhatsApp Web</h1>
                <p className="text-xs text-emerald-200 mt-1">WebView Wrapper (API 23)</p>

                <div className="mt-8 flex flex-col items-center space-y-3">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-[#25D366] rounded-full animate-spin"></div>
                  <span className="text-[11px] text-emerald-100">Memuat sesi WhatsApp...</span>
                </div>

                <div className="absolute bottom-6 text-[10px] text-emerald-200/80">
                  Kompatibel Android 6.0 Marshmallow
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-[#111B21] text-slate-200 relative overflow-hidden">
                {/* Progress Bar Horizontal Hijau Khas WhatsApp */}
                <div className="h-1 w-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-[#25D366] w-full animate-pulse"></div>
                </div>

                {/* WebView Header Bar WhatsApp Web */}
                <div className="bg-[#202C33] px-3 py-2 border-b border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold">
                      WA
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100 flex items-center space-x-1">
                        <span>WhatsApp Web</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {userAgentMode === 'desktop' ? 'Desktop UA' : 'Mobile UA'}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400/90 truncate max-w-[170px]">
                        web.whatsapp.com
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => setCookieSaved(!cookieSaved)}
                      title="Status Persistent Cookies"
                      className={`p-1 rounded text-xs ${cookieSaved ? 'text-emerald-400' : 'text-amber-400'}`}
                    >
                      <Cookie className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={restartApp}
                      title="Muat Ulang Halaman"
                      className="p-1 rounded text-slate-400 hover:text-white"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body WebView */}
                <div className="flex-1 overflow-y-auto p-3.5 text-slate-300 flex flex-col justify-between">
                  {userAgentMode === 'mobile' ? (
                    /* Tampilan jika pakai Mobile UA: WhatsApp Web biasanya redirect */
                    <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 text-center my-auto">
                      <div className="text-amber-400 text-3xl mb-2">⚠️</div>
                      <h3 className="text-sm font-bold text-amber-200">Peringatan Mobile User-Agent</h3>
                      <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                        WhatsApp Web mendeteksi perangkat mobile dan meminta Anda membuka via komputer.
                      </p>
                      <button 
                        onClick={() => {
                          setUserAgentMode('desktop');
                          addLog('User-Agent diganti ke Chrome Desktop (Disarankan)', 'success');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Ganti ke Chrome Desktop UA
                      </button>
                    </div>
                  ) : (
                    /* Tampilan dengan Desktop UA: QR Code & Chat Screen */
                    <div className="flex-1 flex flex-col">
                      {currentScreen === 'home' && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                          <div className="bg-white p-3 rounded-xl shadow-lg mb-3">
                            {/* QR Code Mockup */}
                            <div className="w-36 h-36 bg-slate-900 rounded-lg flex flex-col items-center justify-center p-2 text-white">
                              <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white rounded">
                                <div className="bg-black col-span-2 row-span-2 rounded-sm"></div>
                                <div className="bg-black col-span-1"></div>
                                <div className="bg-black col-span-2 row-span-2 rounded-sm"></div>
                                <div className="bg-black col-span-1"></div>
                                <div className="bg-black col-span-3"></div>
                                <div className="bg-black col-span-2"></div>
                                <div className="bg-black col-span-1"></div>
                                <div className="bg-black col-span-2 row-span-2 rounded-sm"></div>
                                <div className="bg-black col-span-1"></div>
                                <div className="bg-black col-span-2"></div>
                              </div>
                            </div>
                          </div>

                          <h3 className="text-sm font-semibold text-slate-100">Pindai Kode QR</h3>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                            Buka WhatsApp di ponsel utama Anda &gt; Tautkan Perangkat.
                          </p>

                          <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cookies Tersimpan (Auto Re-login)</span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800 w-full flex justify-center space-x-2">
                            <button
                              onClick={() => handleNavigate('chat')}
                              className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold text-xs rounded-lg transition-all shadow"
                            >
                              Simulasi Terhubung (Masuk Chat)
                            </button>
                          </div>
                        </div>
                      )}

                      {currentScreen === 'chat' && (
                        <div className="flex-1 flex flex-col justify-between">
                          {/* Chat Header */}
                          <div className="bg-[#202C33] p-2 rounded-lg flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                                Budi
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-100">Budi Santoso</div>
                                <div className="text-[9px] text-emerald-400">online</div>
                              </div>
                            </div>
                            <div className="flex space-x-2 text-slate-400 text-xs">
                              <button 
                                onClick={() => requestPermission('audio')}
                                className="hover:text-emerald-400"
                                title="Uji WebRTC Call / Audio"
                              >
                                📞
                              </button>
                            </div>
                          </div>

                          {/* Chat Bubbles */}
                          <div className="space-y-2 flex-1 overflow-y-auto py-2">
                            <div className="bg-[#202C33] p-2 rounded-lg rounded-tl-none max-w-[80%] text-[11px] text-slate-200">
                              Halo! Apakah WhatsApp Web wrapper ini lancar di Android 6 (API 23)?
                              <div className="text-[8px] text-slate-400 text-right mt-0.5">12:31</div>
                            </div>
                            <div className="bg-[#005C4B] p-2 rounded-lg rounded-tr-none ml-auto max-w-[80%] text-[11px] text-slate-100">
                              Sangat lancar! JavaScript & DOM Storage aktif, runtime permissions siap, dan persistent cookies jalan.
                              <div className="text-[8px] text-emerald-200 text-right mt-0.5">12:32 ✓✓</div>
                            </div>

                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="bg-[#005C4B] p-2 rounded-lg rounded-tr-none ml-auto max-w-[80%] text-[11px] text-slate-100 flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                                <span className="truncate">{file}</span>
                              </div>
                            ))}
                          </div>

                          {/* Chat Input & Media Actions (Uji FileChooser) */}
                          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center space-x-1.5">
                            <button
                              onClick={triggerFileChooser}
                              title="Unggah Foto/Dokumen (Uji onShowFileChooser)"
                              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              📎
                            </button>
                            <button
                              onClick={() => requestPermission('camera')}
                              title="Uji Izin Kamera"
                              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requestPermission('audio')}
                              title="Uji Izin Mikrofon (Voice Note)"
                              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Mic className="w-3.5 h-3.5" />
                            </button>
                            <input 
                              type="text" 
                              placeholder="Ketik pesan..." 
                              className="flex-1 bg-[#2a3942] text-xs px-2.5 py-1.5 rounded-full text-slate-200 outline-none"
                              readOnly
                              value="Siap kirim media..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dialog Simulasi Runtime Permission Android 6 (API 23) */}
                {activePermissionPrompt && (
                  <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4">
                    <div className="bg-[#242b32] text-white p-4 rounded-xl shadow-2xl border border-slate-600 max-w-[270px] text-center animate-scaleUp">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                        {activePermissionPrompt === 'camera' && <Camera className="w-5 h-5" />}
                        {activePermissionPrompt === 'audio' && <Mic className="w-5 h-5" />}
                        {activePermissionPrompt === 'storage' && <FolderArchive className="w-5 h-5" />}
                      </div>
                      <h4 className="text-xs font-bold">
                        Izinkan WhatsApp Web Wrapper mengakses{' '}
                        {activePermissionPrompt === 'camera' ? 'Kamera' : activePermissionPrompt === 'audio' ? 'Mikrofon' : 'Penyimpanan'}?
                      </h4>
                      <p className="text-[10px] text-slate-300 mt-1">
                        Android 6.0 (API 23) Runtime Permission dialog
                      </p>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => grantPermission(activePermissionPrompt, false)}
                          className="flex-1 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => grantPermission(activePermissionPrompt, true)}
                          className="flex-1 py-1.5 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          Izinkan
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dialog Simulasi onShowFileChooser (Kamera vs Galeri) */}
                {showFileChooserModal && (
                  <div className="absolute inset-0 bg-black/75 z-40 flex flex-col justify-end p-3">
                    <div className="bg-[#202C33] rounded-t-2xl p-4 border border-slate-700 animate-slideUp">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-200">
                          WebChromeClient.onShowFileChooser
                        </span>
                        <button onClick={() => setShowFileChooserModal(false)} className="text-slate-400 text-xs">
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">
                        Pilih sumber berkas untuk diunggah ke WhatsApp Web:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleFileChosen('camera')}
                          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-200 text-xs font-medium space-y-1.5 border border-slate-700"
                        >
                          <Camera className="w-5 h-5 text-emerald-400" />
                          <span>Ambil Foto</span>
                          <span className="text-[9px] text-slate-400">(FileProvider URI)</span>
                        </button>
                        <button
                          onClick={() => handleFileChosen('gallery')}
                          className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-200 text-xs font-medium space-y-1.5 border border-slate-700"
                        >
                          <FolderArchive className="w-5 h-5 text-cyan-400" />
                          <span>Pilih Galeri</span>
                          <span className="text-[9px] text-slate-400">(ACTION_GET_CONTENT)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Bar Bawah Android (Back, Home, Recents) */}
            <div className="h-10 bg-black/90 text-white/70 px-6 flex items-center justify-around text-sm select-none border-t border-slate-900 z-30">
              <button 
                onClick={handleBack}
                title="Tombol Back Fisik (onBackPressed)"
                className="p-2 hover:text-white transition-colors active:scale-95"
              >
                ◀
              </button>
              <button 
                onClick={() => {
                  setCurrentScreen('home');
                  addLog('Home Button: Aplikasi kembali ke halaman awal WebView.', 'info');
                }}
                title="Tombol Home"
                className="p-2 hover:text-white transition-colors active:scale-95"
              >
                ●
              </button>
              <button 
                onClick={() => addLog('Recents Button: Aktivitas disimpan di background (Cookies flushed).', 'info')}
                title="Tombol Recent Apps"
                className="p-2 hover:text-white transition-colors active:scale-95"
              >
                ■
              </button>
            </div>
          </div>
        </div>

        {/* Quick Simulator Controls */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <button
            onClick={restartApp}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Uji Splash Screen</span>
          </button>
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Uji onBackPressed()</span>
          </button>
          <button
            onClick={triggerFileChooser}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
          >
            <UploadCloud className="w-3.5 h-3.5 text-purple-400" />
            <span>Uji FileChooser</span>
          </button>
        </div>
      </div>

      {/* Kolom Kontrol, Checklist Syarat & Live Log */}
      <div className="lg:col-span-6 space-y-4">
        {/* Status Checklist Pemenuhan Syarat */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi Syarat Spesifikasi Pengguna</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Semua Terpenuhi (100%)
            </span>
          </h3>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">minSdk 23 & targetSdk 28</div>
                <div className="text-[11px] text-slate-400">Kompatibel Android 6.0 tanpa restriksi Android baru.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">WebView Fullscreen + JS + DOM</div>
                <div className="text-[11px] text-slate-400">FLAG_FULLSCREEN, setJavaScriptEnabled(true).</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Custom User-Agent Chrome</div>
                <div className="text-[11px] text-slate-400">Wajib Desktop UA agar WA Web menampilkan QR code.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Runtime Permissions</div>
                <div className="text-[11px] text-slate-400">CAMERA, RECORD_AUDIO, WRITE_EXTERNAL_STORAGE.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">onShowFileChooser & FileProvider</div>
                <div className="text-[11px] text-slate-400">Ambil foto kamera & pilih dokumen/galeri.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">onBackPressed Navigation</div>
                <div className="text-[11px] text-slate-400">webView.canGoBack() & webView.goBack().</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Persistent Cookies</div>
                <div className="text-[11px] text-slate-400">CookieManager.flush() mencegah logout otomatis.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-200">Splash Screen Sederhana</div>
                <div className="text-[11px] text-slate-400">SplashActivity bertema WA hijau + Handler delay.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Log Eksekusi & Konfigurasi */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="flex border-b border-slate-800 px-3 pt-2 bg-slate-950/60">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'preview' 
                  ? 'border-emerald-400 text-emerald-300' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Status Izin & Cookies
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
                activeTab === 'logs' 
                  ? 'border-emerald-400 text-emerald-300' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Log Runtime WebView</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'config' 
                  ? 'border-emerald-400 text-emerald-300' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Konfigurasi Project
            </button>
          </div>

          <div className="p-4 text-xs">
            {activeTab === 'preview' && (
              <div className="space-y-3">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-200 font-semibold mb-2 flex items-center justify-between">
                    <span>Status Runtime Permissions (Android 6.0+)</span>
                    <span className="text-[10px] text-slate-400">checkSelfPermission()</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['camera', 'audio', 'storage'] as const).map(p => (
                      <div key={p} className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <div className="capitalize font-medium text-slate-300 mb-1">{p}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          permissions[p] === 'granted' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                            : permissions[p] === 'denied'
                            ? 'bg-rose-950 text-rose-400 border border-rose-700'
                            : 'bg-amber-950 text-amber-400 border border-amber-700'
                        }`}>
                          {permissions[p].toUpperCase()}
                        </span>
                        <button
                          onClick={() => requestPermission(p)}
                          className="mt-2 block w-full text-[9px] py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        >
                          Minta Izin
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cookie className="w-5 h-5 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-200">CookieManager Persistence</div>
                      <div className="text-[11px] text-slate-400">CookieManager.getInstance().flush() aktif</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                    SYNCED TO DISK
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="h-56 overflow-y-auto bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                {logs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-6">Belum ada log aktif</div>
                ) : (
                  logs.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-slate-500 select-none">[{item.time}]</span>
                      <span className={
                        item.type === 'success' ? 'text-emerald-400' :
                        item.type === 'warn' ? 'text-amber-400' : 'text-slate-300'
                      }>
                        {item.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    User-Agent WhatsApp Web:
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setUserAgentMode('desktop')}
                      className={`flex-1 p-2 rounded-lg border text-left text-xs ${
                        userAgentMode === 'desktop'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">Chrome Desktop (Wajib untuk WA Web)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Menampilkan QR Code tanpa redirect</div>
                    </button>
                    <button
                      onClick={() => setUserAgentMode('mobile')}
                      className={`flex-1 p-2 rounded-lg border text-left text-xs ${
                        userAgentMode === 'mobile'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">Chrome Mobile</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Sesuai teks prompt (akan minta desktop)</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target SDK Version:
                  </label>
                  <div className="flex space-x-2">
                    {[23, 28].map(sdk => (
                      <button
                        key={sdk}
                        onClick={() => setTargetSdk(sdk)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                          targetSdk === sdk
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        targetSdk {sdk} {sdk === 28 ? '(Direkomendasikan)' : '(Strict Marshmallow)'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
