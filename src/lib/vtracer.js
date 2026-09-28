export const PRESETS = {
  logo: {
    name: '🎯 Logo & Typography',
    description: 'Dioptimalkan untuk logo, teks, ikon, dan line art dengan sudut tajam.',
    params: {
      colorMode: 'color',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 4,
      colorPrecision: 7,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 3.0,
      maxIterations: 10,
      spliceThreshold: 45,
      pathPrecision: 8,
    }
  },
  illustration: {
    name: '🎨 Grafis & Ilustrasi',
    description: 'Sangat cocok untuk gambar bergaya kartun, seni vektor, dan grafis berwarna.',
    params: {
      colorMode: 'color',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 6,
      colorPrecision: 6,
      layerDifference: 20,
      cornerThreshold: 45,
      lengthThreshold: 4.0,
      maxIterations: 10,
      spliceThreshold: 45,
      pathPrecision: 6,
    }
  },
  photo: {
    name: '📸 Foto Detail',
    description: 'Menangkap detail halus dan gradasi warna alami dari foto realistis.',
    params: {
      colorMode: 'color',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 2,
      colorPrecision: 8,
      layerDifference: 10,
      cornerThreshold: 30,
      lengthThreshold: 2.0,
      maxIterations: 15,
      spliceThreshold: 30,
      pathPrecision: 8,
    }
  },
  monochrome: {
    name: '⬛ Monokrom / Siluet',
    description: 'Tracing hitam-putih untuk stempel, cap, dan siluet.',
    params: {
      colorMode: 'binary',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 4,
      colorPrecision: 8,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 3.0,
      maxIterations: 10,
      spliceThreshold: 45,
      pathPrecision: 8,
    }
  }
};

let tracerInstance = null;

async function getTracer() {
  if (typeof window === 'undefined') return null;
  if (!tracerInstance) {
    const { createVTracer } = await import('vtracer-browser');
    tracerInstance = createVTracer();
  }
  return tracerInstance;
}

export async function convertFileToVector(file, presetKey = 'auto', customParams = {}) {
  const tracer = await getTracer();
  if (!tracer) {
    throw new Error('VTracer browser engine only runs on client side.');
  }

  let finalPresetKey = presetKey;
  let detectedReason = '';

  if (presetKey === 'auto' || !PRESETS[presetKey]) {
    const autoRes = await autoDetectFromFile(file);
    finalPresetKey = autoRes.preset;
    detectedReason = autoRes.reason;
  }

  const baseParams = PRESETS[finalPresetKey] ? PRESETS[finalPresetKey].params : PRESETS.logo.params;
  const finalParams = { ...baseParams, ...customParams };

  // Run vectorization using Web Worker
  const svgContent = await tracer.convert(file, finalParams);

  // Analyze SVG statistics
  const pathMatches = svgContent.match(/<path[^>]*>/gi) || [];
  const commandMatches = svgContent.match(/[MmLlHhVvCcSsQqTtAaZz]/g) || [];
  const sizeBytes = new Blob([svgContent]).size;
  const sizeFormatted = sizeBytes < 1024 
    ? `${sizeBytes} B` 
    : sizeBytes < 1024 * 1024 
      ? `${(sizeBytes / 1024).toFixed(1)} KB` 
      : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

  return {
    svg: svgContent,
    stats: {
      pathCount: pathMatches.length,
      nodeCommands: commandMatches.length,
      fileSizeBytes: sizeBytes,
      fileSizeFormatted: sizeFormatted,
      detectedPreset: finalPresetKey,
      detectedReason: detectedReason
    }
  };
}

async function autoDetectFromFile(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 150);
        canvas.height = Math.min(img.height, 150);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const colorMap = new Set();
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          colorMap.add(`${r >> 3},${g >> 3},${b >> 3}`);
        }

        const numColors = colorMap.size;
        if (numColors <= 4) {
          resolve({ preset: 'monochrome', reason: '✨ Terdeteksi: Gambar Monokrom / Hitam-Putih (Setting Hitam-Putih diterapkan)' });
        } else if (numColors <= 32) {
          resolve({ preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks / Graphic Icon (Setting Tajam Logo diterapkan)' });
        } else if (numColors <= 128) {
          resolve({ preset: 'illustration', reason: '✨ Terdeteksi: Vektor Grafis / Ilustrasi (Setting Layer Warna diterapkan)' });
        } else {
          resolve({ preset: 'photo', reason: '✨ Terdeteksi: Foto Realistis / Gradasi Halus (Setting Foto Detail diterapkan)' });
        }
      } catch (err) {
        URL.revokeObjectURL(url);
        resolve({ preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks (Setting Default diterapkan)' });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks (Setting Default diterapkan)' });
    };
    img.src = url;
  });
}
