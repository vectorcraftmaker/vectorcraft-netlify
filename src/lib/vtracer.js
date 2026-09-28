import ImageTracer from 'imagetracerjs';

export const PRESETS = {
  logo: {
    name: '🎯 Logo & Typography',
    description: 'Dioptimalkan untuk logo, teks, ikon, dan line art dengan garis tajam & bersih.',
    options: {
      corsenabled: false,
      ltres: 0.5,
      qtres: 0.5,
      pathomit: 4,
      rightangleenhance: true,
      colorsampling: 2,
      numberofcolors: 16,
      mincolorratio: 0,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 0.5,
      linefilter: false,
      scale: 1,
      roundcoords: 2,
      viewbox: true,
    }
  },
  illustration: {
    name: '🎨 Grafis & Ilustrasi',
    description: 'Sangat cocok untuk gambar bergaya kartun, seni vektor, dan grafis berwarna.',
    options: {
      corsenabled: false,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 32,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 1,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
    }
  },
  photo: {
    name: '📸 Foto Detail',
    description: 'Menangkap detail halus dan gradasi warna alami dari foto realistis.',
    options: {
      corsenabled: false,
      ltres: 0.2,
      qtres: 0.2,
      pathomit: 0,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 64,
      colorquantcycles: 4,
      layering: 0,
      strokewidth: 0.5,
      linefilter: false,
      scale: 1,
      roundcoords: 2,
      viewbox: true,
    }
  },
  monochrome: {
    name: '⬛ Monokrom / Siluet',
    description: 'Tracing hitam-putih untuk stempel, cap, dan siluet.',
    options: {
      corsenabled: false,
      ltres: 0.1,
      qtres: 0.1,
      pathomit: 4,
      rightangleenhance: true,
      colorsampling: 0,
      numberofcolors: 2,
      colorquantcycles: 2,
      layering: 0,
      strokewidth: 0,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
    }
  }
};

export async function convertFileToVector(file, presetKey = 'auto', customParams = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Vectorization runs client-side only.'));
    }

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
          const autoRes = autoDetectFromImageData(imageData);
          finalPresetKey = autoRes.preset;
          detectedReason = autoRes.reason;
        }

        const baseOpts = PRESETS[finalPresetKey] ? PRESETS[finalPresetKey].options : PRESETS.logo.options;
        const finalOptions = { ...baseOpts, ...customParams };

        // Execute ImageTracerJS pure JS vectorization
        const svgContent = ImageTracer.imagedataToSVG(imageData, finalOptions);

        // Analyze SVG statistics
        const pathMatches = svgContent.match(/<path[^>]*>/gi) || [];
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
            nodeCommands: pathMatches.length * 4,
            fileSizeBytes: sizeBytes,
            fileSizeFormatted: sizeFormatted,
            detectedPreset: finalPresetKey,
            detectedReason: detectedReason
          }
        });
      } catch (err) {
        URL.revokeObjectURL(url);
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

function autoDetectFromImageData(imageData) {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const colorMap = new Set();
  
  const step = Math.max(1, Math.floor(totalPixels / 10000));
  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    colorMap.add(`${r >> 3},${g >> 3},${b >> 3}`);
  }

  const numColors = colorMap.size;
  if (numColors <= 4) {
    return { preset: 'monochrome', reason: '✨ Terdeteksi: Gambar Monokrom / Hitam-Putih (Setting Monokrom diterapkan)' };
  } else if (numColors <= 32) {
    return { preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks / Graphic Icon (Setting Tajam Logo diterapkan)' };
  } else if (numColors <= 128) {
    return { preset: 'illustration', reason: '✨ Terdeteksi: Vektor Grafis / Ilustrasi (Setting Layer Warna diterapkan)' };
  } else {
    return { preset: 'photo', reason: '✨ Terdeteksi: Foto Realistis / Gradasi Halus (Setting Foto Detail diterapkan)' };
  }
}
