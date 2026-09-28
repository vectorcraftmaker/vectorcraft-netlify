import ImageTracer from 'imagetracerjs';

export const PRESETS = {
  logo: {
    name: '🌟 Ultra-Smooth Logo & Art (Rekomendasi Utama)',
    description: 'Menghasilkan garis vektor super mulus, tajam, dan bebas bintik pecah.',
    options: {
      corsenabled: false,
      ltres: 1,
      qtres: 1,
      pathomit: 20,
      rightangleenhance: true,
      colorsampling: 2,
      numberofcolors: 16,
      mincolorratio: 0,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 0,
      linefilter: true,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 3,
      blurdelta: 30
    }
  },
  illustration: {
    name: '🎨 Vektor Warna Mulus',
    description: 'Sangat cocok untuk ilustrasi warna, kartun, dan grafis bergaya seni.',
    options: {
      corsenabled: false,
      ltres: 0.8,
      qtres: 0.8,
      pathomit: 12,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 24,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 0,
      linefilter: true,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 2,
      blurdelta: 20
    }
  },
  photo: {
    name: '📸 Foto & High Detail',
    description: 'Menangkap detail warna realistis dengan kurva halus.',
    options: {
      corsenabled: false,
      ltres: 0.3,
      qtres: 0.3,
      pathomit: 4,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 48,
      colorquantcycles: 4,
      layering: 0,
      strokewidth: 0,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 1,
      blurdelta: 15
    }
  },
  monochrome: {
    name: '⬛ Siluet Monokrom',
    description: 'Tracing hitam-putih mulus untuk cap, logo 1 warna, dan stempel.',
    options: {
      corsenabled: false,
      ltres: 0.5,
      qtres: 0.5,
      pathomit: 20,
      rightangleenhance: true,
      colorsampling: 0,
      numberofcolors: 2,
      colorquantcycles: 2,
      layering: 0,
      strokewidth: 0,
      linefilter: true,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 2,
      blurdelta: 20
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

        // Execute ImageTracerJS vectorization
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
    return { preset: 'monochrome', reason: '✨ Terdeteksi: Gambar Monokrom / Hitam-Putih (Preset Mulus Monokrom diterapkan)' };
  } else if (numColors <= 32) {
    return { preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks (Preset Ultra-Smooth Logo diterapkan)' };
  } else if (numColors <= 128) {
    return { preset: 'illustration', reason: '✨ Terdeteksi: Vektor Grafis / Ilustrasi (Preset Vektor Warna Mulus diterapkan)' };
  } else {
    return { preset: 'photo', reason: '✨ Terdeteksi: Foto Realistis (Preset Foto Detail diterapkan)' };
  }
}
