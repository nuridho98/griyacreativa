import React, { useState } from 'react';
import { ANDROID_FILES, AndroidFile } from '../androidProject/projectData';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  FolderTree, 
  Code2, 
  Terminal,
  Cpu,
  Layers
} from 'lucide-react';
import { generateAndroidProjectZip, triggerBlobDownload } from '../androidProject/zipExporter';

interface CodeInspectorProps {
  targetSdk: number;
  userAgentMode: 'desktop' | 'mobile';
}

export const CodeInspector: React.FC<CodeInspectorProps> = ({ targetSdk, userAgentMode }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(ANDROID_FILES[0].path);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const selectedFile = ANDROID_FILES.find(f => f.path === selectedFilePath) || ANDROID_FILES[0];

  const categories = [
    { id: 'all', label: 'Semua Berkas' },
    { id: 'java', label: 'Java Sources' },
    { id: 'manifest', label: 'Manifest' },
    { id: 'gradle', label: 'Gradle Build' },
    { id: 'layout', label: 'XML Layouts' },
    { id: 'xml', label: 'Drawables & Providers' },
    { id: 'doc', label: 'Dokumentasi' },
  ];

  const filteredFiles = selectedCategory === 'all' 
    ? ANDROID_FILES 
    : ANDROID_FILES.filter(f => f.category === selectedCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const zipBlob = await generateAndroidProjectZip(targetSdk, userAgentMode);
      triggerBlobDownload(zipBlob, `WAWebWrapper-Android6-API23.zip`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor berkas ZIP proyek.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Action Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-slate-100">
            Source Code Android Studio (Java & XML)
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {ANDROID_FILES.length} Files
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
          </button>
          
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Membuat ZIP...' : 'Unduh Proyek (.ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-xs rounded-md transition ${
              selectedCategory === cat.id
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Code Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        {/* File Navigator Sidebar */}
        <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/40 p-2 overflow-y-auto max-h-[550px] space-y-1">
          {filteredFiles.map(file => {
            const isSelected = file.path === selectedFilePath;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFilePath(file.path)}
                className={`w-full text-left p-2.5 rounded-xl transition flex flex-col space-y-1 border ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/70 shadow-sm'
                    : 'border-transparent hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCode className={`w-4 h-4 flex-shrink-0 ${
                    file.category === 'java' ? 'text-amber-400' :
                    file.category === 'manifest' ? 'text-cyan-400' :
                    file.category === 'gradle' ? 'text-emerald-400' :
                    file.category === 'layout' ? 'text-purple-400' : 'text-slate-400'
                  }`} />
                  <span className={`text-xs font-mono font-medium truncate ${
                    isSelected ? 'text-white font-bold' : 'text-slate-300'
                  }`}>
                    {file.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate pl-6">
                  {file.path}
                </span>
              </button>
            );
          })}
        </div>

        {/* Code Content Panel */}
        <div className="md:col-span-8 flex flex-col bg-[#0d1117] overflow-hidden">
          {/* File Header Details */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <div className="font-mono text-emerald-400 font-semibold flex items-center space-x-2">
                <span>{selectedFile.path}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedFile.description}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {selectedFile.content.split('\n').length} baris
            </span>
          </div>

          {/* Syntax Code Display */}
          <div className="flex-1 p-4 overflow-auto max-h-[480px] font-mono text-xs text-slate-200 leading-relaxed select-text">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
