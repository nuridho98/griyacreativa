import React from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  Terminal, 
  Settings, 
  CheckCircle2, 
  ShieldAlert, 
  FileCode2, 
  Smartphone,
  FolderGit2
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-300">
      {/* Overview Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>Panduan Teknis & Arsitektur WebView WhatsApp Web (Android 6 / API 23)</span>
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Membangun WebView wrapper khusus WhatsApp Web membutuhkan beberapa trik teknis karena WhatsApp menerapkan proteksi User-Agent peramban dan membutuhkan fitur web modern (WebRTC, IndexedDB, Cookies, File Upload).
        </p>
      </div>

      {/* Grid Rincian Teknis Kunci */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Kenapa User-Agent Chrome Desktop Wajib? */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>1. Mengapa Wajib User-Agent Chrome Desktop?</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Jika WebView mengirim User-Agent mobile Android biasa ke <code className="text-emerald-400">https://web.whatsapp.com/</code>, server WhatsApp secara otomatis mengalihkan (redirect) ke <code className="text-emerald-400">whatsapp.com</code> atau menampilkan pesan <em>"WhatsApp Web only works on computers"</em>.
          </p>
          <div className="mt-2.5 bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-emerald-300 border border-slate-800">
            Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Dengan User-Agent di atas, WhatsApp Web menganggap browser sebagai Chrome desktop sehingga <strong>QR Code scanner</strong> langsung muncul.
          </p>
        </div>

        {/* 2. Runtime Permissions di Android 6 (API 23) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs mb-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>2. Runtime Permission Android 6.0 (Marshmallow)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Android 6.0 (API 23) adalah versi Android pertama yang mewajibkan <em>Runtime Permissions</em>:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
            <li><code className="text-cyan-300">CAMERA</code>: Untuk memindai dan mengambil foto kamera.</li>
            <li><code className="text-cyan-300">RECORD_AUDIO</code>: Untuk voice note & panggilan.</li>
            <li><code className="text-cyan-300">WRITE_EXTERNAL_STORAGE</code>: Menyimpan unduhan gambar/dokumen.</li>
          </ul>
          <p className="text-[11px] text-slate-400 mt-2">
            Ditambah override <code className="text-emerald-300">WebChromeClient.onPermissionRequest</code> agar audio/video WebRTC diizinkan di dalam browser WebView.
          </p>
        </div>

        {/* 3. Penanganan onShowFileChooser & FileProvider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs mb-2">
            <FileCode2 className="w-4 h-4 flex-shrink-0" />
            <span>3. onShowFileChooser & FileProvider</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            WhatsApp Web menggunakan elemen <code className="text-purple-300">&lt;input type="file"&gt;</code> saat tombol lampiran (attachment) diklik.
          </p>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Kami mengimplementasikan <code className="text-emerald-400">WebChromeClient.onShowFileChooser()</code> yang menggabungkan:
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-300 list-disc list-inside">
            <li><strong>Kamera Intent:</strong> <code className="text-purple-300">MediaStore.ACTION_IMAGE_CAPTURE</code> dengan URI aman dari <strong>FileProvider</strong> (mencegah crash <code className="text-rose-400">FileUriExposedException</code>).</li>
            <li><strong>Galeri Intent:</strong> <code className="text-purple-300">Intent.ACTION_GET_CONTENT</code> untuk memilih foto atau berkas dari memori internal.</li>
          </ul>
        </div>

        {/* 4. Persistent Cookies & Anti-Logout */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>4. Persistent Cookies (Anti-Logout)</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Secara default, cookie WebView disimpan di memori RAM dan dapat terhapus jika aplikasi ditutup paksa oleh sistem Android.
          </p>
          <div className="mt-2 bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-emerald-300 border border-slate-800">
            CookieManager.getInstance().setAcceptCookie(true);<br />
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);<br />
            CookieManager.getInstance().flush(); // Simpan ke disk
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Dipanggil juga pada event <code className="text-cyan-300">onPageFinished()</code> dan <code className="text-cyan-300">onPause()</code> sehingga sesi login QR code tetap awet.
          </p>
        </div>
      </div>

      {/* Langkah Build APK di Android Studio */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Langkah Kompilasi & Build APK di Android Studio</span>
        </h4>

        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              1
            </span>
            <div>
              <div className="font-semibold text-slate-200">Unduh & Ekstrak Proyek ZIP</div>
              <div className="text-slate-400 mt-0.5">
                Klik tombol <strong>"Unduh Proyek (.ZIP)"</strong> di atas, lalu ekstrak ke direktori kerja Anda (contoh: <code className="text-emerald-300">~/AndroidProjects/WAWebWrapper</code>).
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              2
            </span>
            <div>
              <div className="font-semibold text-slate-200">Buka di Android Studio & Sinkronisasi Gradle</div>
              <div className="text-slate-400 mt-0.5">
                Buka Android Studio, pilih <strong>File &gt; Open</strong> dan pilih folder hasil ekstrak. Gradle akan mengunduh dependensi AndroidX secara otomatis.
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
              3
            </span>
            <div>
              <div className="font-semibold text-slate-200">Build APK Debug / Release</div>
              <div className="text-slate-400 mt-0.5">
                Di menu Android Studio, pilih <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> atau jalankan di terminal:
                <pre className="mt-1.5 p-2 bg-slate-900 rounded font-mono text-[11px] text-emerald-300">
                  ./gradlew assembleDebug
                </pre>
                Berkas APK akan berada di <code className="text-emerald-300">app/build/outputs/apk/debug/app-debug.apk</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
