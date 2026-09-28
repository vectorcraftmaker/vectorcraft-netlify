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

export function autoDetectPresetFromImageData(imageData) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const colorMap = new Set();
  
  const step = Math.max(1, Math.floor(totalPixels / 10000));
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 3},${g >> 3},${b >> 3}`;
    colorMap.add(key);
  }

  const numColors = colorMap.size;

  if (numColors <= 4) {
    return {
      preset: 'monochrome',
      reason: '✨ Terdeteksi: Gambar Monokrom / Hitam-Putih (Setting Hitam-Putih diterapkan)'
    };
  } else if (numColors <= 32) {
    return {
      preset: 'logo',
      reason: '✨ Terdeteksi: Logo / Teks / Graphic Icon (Setting Tajam Logo diterapkan)'
    };
  } else if (numColors <= 128) {
    return {
      preset: 'illustration',
      reason: '✨ Terdeteksi: Vektor Grafis / Ilustrasi (Setting Layer Warna diterapkan)'
    };
  } else {
    return {
      preset: 'photo',
      reason: '✨ Terdeteksi: Foto Realistis / Gradasi Halus (Setting Foto Detail diterapkan)'
    };
  }
}

export async function convertFileToVector(file, presetKey = 'auto', customParams = {}) {
  // Dynamically import WASM module client-side
  const { convertPixels } = await import('@visioncortex/vtracer');

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        URL.revokeObjectURL(url);

        let finalPresetKey = presetKey;
        let detectedReason = '';

        if (presetKey === 'auto' || !PRESETS[presetKey]) {
          const autoRes = autoDetectPresetFromImageData(imageData);
          finalPresetKey = autoRes.preset;
          detectedReason = autoRes.reason;
        }

        const baseParams = PRESETS[finalPresetKey] ? PRESETS[finalPresetKey].params : PRESETS.logo.params;
        const finalParams = { ...baseParams, ...customParams };

        // Execute WASM vectorization
        const svgContent = convertPixels(imageData.data, imageData.width, imageData.height, finalParams);

        // Analyze SVG statistics
        const pathMatches = svgContent.match(/<path[^>]*>/gi) || [];
        const commandMatches = svgContent.match(/[MmLlHhVvCcSsQqTtAaZz]/g) || [];
        const sizeBytes = new Blob([svgContent]).size;
        const sizeFormatted = sizeBytes < 1024 
          ? `${sizeBytes} B` 
          : sizeBytes < 1024 * 1024 
            ? `${(sizeBytes / 1024).toFixed(1)} KB` 
            : `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;

        resolve({
          svg: svgContent,
          stats: {
            pathCount: pathMatches.length,
            nodeCommands: commandMatches.length,
            fileSizeBytes: sizeBytes,
            fileSizeFormatted: sizeFormatted,
            detectedPreset: finalPresetKey,
            detectedReason: detectedReason
          }
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca berkas gambar.'));
    };

    img.src = url;
  });
}
