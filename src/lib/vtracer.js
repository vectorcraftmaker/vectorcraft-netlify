import ImageTracer from 'imagetracerjs';

export const PRESETS = {
  logo: {
    name: '🌟 Clean Smooth Curved Vector (Rekomendasi Utama)',
    description: 'Menyatukan warna menjadi kurva lengkung mulus & utuh, bebas bintik pecah.',
    options: {
      corsenabled: false,
      ltres: 1.5,
      qtres: 1.5,
      pathomit: 30,
      rightangleenhance: true,
      colorsampling: 2,
      numberofcolors: 10,
      mincolorratio: 0,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 0,
      linefilter: true,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 3,
      blurdelta: 40
    }
  },
  illustration: {
    name: '🎨 Vektor Kartun & Ilustrasi',
    description: 'Bentuk bidang warna menyatu yang rapi untuk kartun dan seni vektor.',
    options: {
      corsenabled: false,
      ltres: 1.2,
      qtres: 1.2,
      pathomit: 20,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 16,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 0,
      linefilter: true,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 2,
      blurdelta: 30
    }
  },
  photo: {
    name: '📸 Foto & High Detail',
    description: 'Untuk foto realistis dengan gradasi warna lebih kompleks.',
    options: {
      corsenabled: false,
      ltres: 0.5,
      qtres: 0.5,
      pathomit: 8,
      rightangleenhance: false,
      colorsampling: 2,
      numberofcolors: 32,
      colorquantcycles: 4,
      layering: 0,
      strokewidth: 0,
      linefilter: false,
      scale: 1,
      roundcoords: 1,
      viewbox: true,
      blurradius: 1,
      blurdelta: 20
    }
  },
  monochrome: {
    name: '⬛ Siluet Monokrom Mulus',
    description: 'Tracing 1 warna hitam-putih dengan garis melengkung bersih.',
    options: {
      corsenabled: false,
      ltres: 1.5,
      qtres: 1.5,
      pathomit: 30,
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
      blurradius: 3,
      blurdelta: 30
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
    colorMap.add(`${r >> 4},${g >> 4},${b >> 4}`);
  }

  const numColors = colorMap.size;
  if (numColors <= 4) {
    return { preset: 'monochrome', reason: '✨ Terdeteksi: Monokrom (Preset Siluet Mulus diterapkan)' };
  } else if (numColors <= 60) {
    return { preset: 'logo', reason: '✨ Terdeteksi: Logo / Teks (Preset Clean Smooth Curved Vector diterapkan)' };
  } else if (numColors <= 150) {
    return { preset: 'illustration', reason: '✨ Terdeteksi: Vektor Kartun & Ilustrasi diterapkan' };
  } else {
    return { preset: 'logo', reason: '✨ Terdeteksi: Logo / Seni Vektor (Preset Clean Smooth Curved Vector diterapkan)' };
  }
}
