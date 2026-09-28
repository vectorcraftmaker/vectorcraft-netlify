'use client';

import { useState, useRef } from 'react';
import { convertFileToVector, PRESETS } from '../lib/vtracer';
import JSZip from 'jszip';
import { 
  Sparkles, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Layers, 
  FileArchive, 
  Image as ImageIcon,
  Zap,
  Globe
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('single');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [svgResult, setSvgResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [presetKey, setPresetKey] = useState('auto');
  const [bgStyle, setBgStyle] = useState('checkerboard');
  const [copied, setCopied] = useState(false);

  // Batch states
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [zipBlob, setZipBlob] = useState(null);

  // Single file change
  const handleSingleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    runVectorization(file, presetKey);
  };

  const runVectorization = async (file, currentPreset) => {
    setIsProcessing(true);
    try {
      const res = await convertFileToVector(file, currentPreset);
      setSvgResult(res.svg);
      setStats(res.stats);
    } catch (err) {
      alert('Gagal mengonversi gambar: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetChange = (newPreset) => {
    setPresetKey(newPreset);
    if (selectedFile) {
      runVectorization(selectedFile, newPreset);
    }
  };

  const handleCopyCode = () => {
    if (!svgResult) return;
    navigator.clipboard.writeText(svgResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    if (!svgResult || !selectedFile) return;
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Batch conversion
  const handleBatchFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setBatchFiles(files);
    setZipBlob(null);
  };

  const runBatchVectorization = async () => {
    if (batchFiles.length === 0) return;

    setIsBatchProcessing(true);
    setBatchProgress(0);
    const zip = new JSZip();

    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      try {
        const res = await convertFileToVector(file, 'auto');
        const filename = `${file.name.replace(/\.[^/.]+$/, '')}_vector.svg`;
        zip.file(filename, res.svg);
      } catch (err) {
        console.error(`Gagal mengonversi ${file.name}:`, err);
      }
      setBatchProgress(Math.round(((i + 1) / batchFiles.length) * 100));
    }

    const content = await zip.generateAsync({ type: 'blob' });
    setZipBlob(content);
    setIsBatchProcessing(false);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-3">
          <Globe className="w-4 h-4" /> 100% WebAssembly Client-Side & Netlify Ready
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          ✨ VectorCraft Netlify
        </h1>
        <p className="mt-2 text-slate-400 text-lg">
          Ubah gambar raster (PNG/JPG/WEBP) jadi <strong className="text-slate-200">Vektor SVG Asli</strong> langsung di browser tanpa server!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'single'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" /> ⚡ Single Auto-Magic
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'batch'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileArchive className="w-4 h-4" /> 📦 Batch Multi-File (ZIP)
          </button>
        </div>
      </div>

      {/* TAB 1: SINGLE FILE */}
      {activeTab === 'single' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-purple-400" /> Mode Preset:
              </span>
              <select
                value={presetKey}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="auto">✨ Auto Detect (Rekomendasi)</option>
                <option value="logo">🎯 Logo & Typography</option>
                <option value="illustration">🎨 Grafis & Ilustrasi</option>
                <option value="photo">📸 Foto Detail</option>
                <option value="monochrome">⬛ Monokrom / Siluet</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-300">Inspector Canvas:</span>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 text-xs">
                <button
                  onClick={() => setBgStyle('checkerboard')}
                  className={`px-3 py-1 rounded ${bgStyle === 'checkerboard' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Checkerboard
                </button>
                <button
                  onClick={() => setBgStyle('white')}
                  className={`px-3 py-1 rounded ${bgStyle === 'white' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Putih
                </button>
                <button
                  onClick={() => setBgStyle('dark')}
                  className={`px-3 py-1 rounded ${bgStyle === 'dark' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile && (
            <label className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 transition-all rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-800/20 hover:bg-slate-800/40">
              <Upload className="w-12 h-12 text-purple-400 mb-3 animate-bounce" />
              <p className="text-lg font-bold text-slate-200">Tarik & Lepas Gambar Di Sini</p>
              <p className="text-sm text-slate-400 mt-1">Mendukung format PNG, JPG, WEBP, BMP</p>
              <input type="file" accept="image/*" onChange={handleSingleFileChange} className="hidden" />
            </label>
          )}

          {/* Processing Spinner & Results */}
          {selectedFile && (
            <div className="space-y-6">
              {stats?.detectedReason && (
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-300 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" /> {stats.detectedReason}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-purple-400" /> Gambar Asli (Raster)
                    </h3>
                    <label className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded-md cursor-pointer transition">
                      Ganti Gambar
                      <input type="file" accept="image/*" onChange={handleSingleFileChange} className="hidden" />
                    </label>
                  </div>
                  <div className="flex-1 bg-slate-950 rounded-xl p-3 flex items-center justify-center min-h-[350px]">
                    <img src={previewUrl} alt="Original" className="max-h-[350px] object-contain rounded-lg" />
                  </div>
                </div>

                {/* SVG Result */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" /> Hasil Vektor (SVG)
                    </h3>
                    {svgResult && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopyCode}
                          className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-md transition"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Tersalin!' : 'Copy Code'}
                        </button>
                        <button
                          onClick={handleDownloadSingle}
                          className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-md transition shadow-md shadow-purple-500/20"
                        >
                          <Download className="w-3.5 h-3.5" /> Download SVG
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`flex-1 rounded-xl p-3 flex items-center justify-center min-h-[350px] ${
                    bgStyle === 'checkerboard' ? 'bg-checkerboard' : bgStyle === 'white' ? 'bg-white' : 'bg-slate-950'
                  }`}>
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-300">Mengonversi via WASM...</p>
                      </div>
                    ) : svgResult ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: svgResult }}
                        className="max-h-[350px] w-full h-full flex items-center justify-center"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium">🗺️ Path Vektor</p>
                    <p className="text-xl font-bold text-purple-300 mt-1">{stats.pathCount.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium">📍 Curve Nodes</p>
                    <p className="text-xl font-bold text-cyan-300 mt-1">{stats.nodeCommands.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium">💾 Ukuran File SVG</p>
                    <p className="text-xl font-bold text-teal-300 mt-1">{stats.fileSizeFormatted}</p>
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl">
                    <p className="text-xs text-slate-400 font-medium">✨ Output Format</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">Native SVG</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BATCH CONVERTER */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-slate-200 mb-2">📦 Konversi Banyak Gambar Sekaligus (Batch Process)</h3>
            <p className="text-slate-400 text-sm mb-6">
              Upload belasan atau puluhan gambar sekaligus. Semua file akan dikonversi di browser menggunakan WebAssembly dan dapat didownload dalam 1 file <strong>.ZIP</strong>.
            </p>

            <label className="border-2 border-dashed border-slate-700 hover:border-purple-500/60 transition-all rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 mb-6">
              <Upload className="w-10 h-10 text-purple-400 mb-2" />
              <p className="text-base font-semibold text-slate-200">Pilih / Drag Multi-File Gambar</p>
              <input type="file" accept="image/*" multiple onChange={handleBatchFileChange} className="hidden" />
            </label>

            {batchFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-sm font-medium text-slate-300">📂 Total File Terpilih: <strong>{batchFiles.length} gambar</strong></span>
                  <button
                    onClick={runBatchVectorization}
                    disabled={isBatchProcessing}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-semibold text-sm transition shadow-lg shadow-purple-500/25 disabled:opacity-50"
                  >
                    {isBatchProcessing ? `Mengonversi (${batchProgress}%)...` : '🚀 Konversi Semua ke SVG'}
                  </button>
                </div>

                {isBatchProcessing && (
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300" style={{ width: `${batchProgress}%` }}></div>
                  </div>
                )}

                {zipBlob && (
                  <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-teal-300">✨ Konversi Batch Selesai!</p>
                      <p className="text-xs text-teal-400/80">Semua {batchFiles.length} file SVG telah dikemas dalam file ZIP.</p>
                    </div>
                    <a
                      href={URL.createObjectURL(zipBlob)}
                      download="VectorCraft_Converted_SVG.zip"
                      className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download ZIP (.zip)
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
