const fileInput = document.getElementById('fileInput');
    const aspectPreset = document.getElementById('aspectPreset');
    const outWidth = document.getElementById('outWidth');
    const outHeight = document.getElementById('outHeight');
    const topMargin = document.getElementById('topMargin');
    const bottomMargin = document.getElementById('bottomMargin');
    const textAlign = document.getElementById('textAlign');
    const fontScale = document.getElementById('fontScale');
    const textVerticalAlign = document.getElementById('textVerticalAlign');
    const textBlockOffset = document.getElementById('textBlockOffset');
    const exportFormat = document.getElementById('exportFormat');
    const jpegQuality = document.getElementById('jpegQuality');
    const customText1 = document.getElementById('customText1');
    const customText2 = document.getElementById('customText2');
    const customText3 = document.getElementById('customText3');
    const previewCanvas = document.getElementById('previewCanvas');
    const ctx = previewCanvas.getContext('2d');
    const imageMeta = document.getElementById('imageMeta');
    const previewInfo = document.getElementById('previewInfo');

    const fields = {
      showCamera: document.getElementById('showCamera'),
      showLens: document.getElementById('showLens'),
      showFocal: document.getElementById('showFocal'),
      showFNumber: document.getElementById('showFNumber'),
      showShutter: document.getElementById('showShutter'),
      showISO: document.getElementById('showISO'),
      showDate: document.getElementById('showDate'),
      showTitleLine: document.getElementById('showTitleLine')
    };

    const state = {
      image: null,
      fileName: '',
      exif: {},
      bg: 'black'
    };

    const ratioMap = {
      '16:9': [16, 9],
      '3:2': [3, 2],
      '4:3': [4, 3],
      '1:1': [1, 1],
      '9:16': [9, 16]
    };

    function updateHeightFromPreset() {
      const preset = aspectPreset.value;
      if (preset !== 'custom') {
        const [w, h] = ratioMap[preset];
        const width = Math.max(100, Number(outWidth.value) || 1920);
        outHeight.value = Math.round(width * h / w);
        outHeight.disabled = true;
      } else {
        outHeight.disabled = false;
      }
    }

    function resetSettings() {
      aspectPreset.value = '16:9';
      outWidth.value = 1920;
      outHeight.value = 1080;
      topMargin.value = 10;
      bottomMargin.value = 10;
      textAlign.value = 'center';
      textVerticalAlign.value = 'middle';
      fontScale.value = 1.0;
      textBlockOffset.value = 0;
      exportFormat.value = 'png';
      jpegQuality.value = 95;
      customText1.value = '';
      customText2.value = '';
      customText3.value = '';
      Object.values(fields).forEach((el) => {
        el.checked = ['showCamera','showLens','showFocal','showFNumber','showShutter','showISO','showDate'].includes(el.id);
      });
      state.bg = 'black';
      document.querySelectorAll('#bgColorChips .chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.bg === 'black');
      });
      updateHeightFromPreset();
      render();
    }

    function formatExposureTime(value) {
      if (!value || Number.isNaN(value)) return '';
      const num = Number(value);
      if (num >= 1) return `${trimZero(num)}s`;
      const reciprocal = Math.round(1 / num);
      return reciprocal > 0 ? `1/${reciprocal}s` : `${num}s`;
    }

    function trimZero(num) {
      return Number(num).toFixed(1).replace(/\.0$/, '');
    }

    function formatDate(val) {
      if (!val) return '';
      try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) {
          const match = String(val).match(/^(\d{4})[:\-/](\d{2})[:\-/](\d{2})/);
          return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      } catch {
        return String(val);
      }
    }

    function buildExifLines(exif) {
      const line1Parts = [];
      const line2Parts = [];
      const line3Parts = [];

      if (fields.showCamera.checked && exif.Model) line1Parts.push(exif.Model);
      if (fields.showLens.checked && exif.LensModel) line1Parts.push(exif.LensModel);
      const extra1 = (customText1.value || '').trim();
      if (extra1) line1Parts.push(extra1);

      const focal = exif.FocalLengthIn35mmFormat || exif.FocalLength;
      if (fields.showFocal.checked && focal) {
        const value = Number(focal);
        line2Parts.push(`${trimZero(value)}mm`);
      }
      if (fields.showFNumber.checked && exif.FNumber) line2Parts.push(`F${trimZero(exif.FNumber)}`);
      if (fields.showShutter.checked && exif.ExposureTime) line2Parts.push(formatExposureTime(exif.ExposureTime));
      if (fields.showISO.checked && exif.ISO) line2Parts.push(`ISO ${exif.ISO}`);
      if (fields.showDate.checked) {
        const dt = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;
        if (dt) line2Parts.push(formatDate(dt));
      }
      const extra2 = (customText2.value || '').trim();
      if (extra2) line2Parts.push(extra2);

      const extra3 = (customText3.value || '').trim();
      if (extra3) line3Parts.push(extra3);

      return {
        line1: line1Parts.join(' / '),
        line2: line2Parts.join(' / '),
        line3: line3Parts.join(' / ')
      };
    }

    async function loadImageFile(file) {
      state.fileName = file.name;
      state.exif = await (typeof exifr === 'undefined' ? Promise.resolve({}) : exifr.parse(file, {
        tiff: true,
        exif: true,
        ifd0: true,
        xmp: false,
        icc: false,
        iptc: false,
        interop: false,
        gps: false
      })).catch(() => ({})) || {};

      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });

      state.image = img;
      imageMeta.textContent = `ファイル: ${file.name} / 画像サイズ: ${img.naturalWidth} × ${img.naturalHeight} / 機材: ${state.exif.Model || '取得なし'} / レンズ: ${state.exif.LensModel || '取得なし'}`;
      render();
    }

    function render() {
      const canvasW = Math.max(100, Number(outWidth.value) || 1920);
      const canvasH = Math.max(100, Number(outHeight.value) || 1080);
      previewCanvas.width = canvasW;
      previewCanvas.height = canvasH;

      const bgIsBlack = state.bg === 'black';
      const bgColor = bgIsBlack ? '#050505' : '#ffffff';
      const textColor = bgIsBlack ? '#f5f5f5' : '#111111';
      const subColor = bgIsBlack ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,17,0.72)';
      const lineColor = bgIsBlack ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      const topPx = canvasH * (Math.max(0, Number(topMargin.value) || 0) / 100);
      // 下余白が指定値より小さくても、EXIFの全行を収める幅を確保する。
      // 写真は縮小して全体を表示し、トリミングしない。
      const previewExif = buildExifLines(state.exif);
      const previewBase = Math.min(canvasW, canvasH) * 0.028 * (Number(fontScale.value) || 1);
      const sizes = [
        previewExif.line1 ? Math.max(14, previewBase) : 0,
        previewExif.line2 ? Math.max(12, previewBase * 0.72) : 0,
        previewExif.line3 ? Math.max(12, previewBase * 0.60) : 0
      ].filter(Boolean);
      const textHeight = sizes.reduce((a, b) => a + b, 0)
        + Math.max(0, sizes.length - 1) * Math.max(8, previewBase * 0.35);
      const minimumFooter = sizes.length
        ? textHeight + Math.max(28, canvasH * 0.045)
        : 0;
      const requestedBottom = canvasH * (Math.max(0, Number(bottomMargin.value) || 0) / 100);
      const bottomPx = Math.max(requestedBottom, minimumFooter);
      const photoAreaY = topPx;
      const photoAreaH = Math.max(10, canvasH - topPx - bottomPx);
      const photoAreaW = canvasW;

      if (!state.image) {
        ctx.fillStyle = subColor;
        ctx.font = '600 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('画像を読み込んでください', canvasW / 2, canvasH / 2);
        previewInfo.textContent = `出力サイズ: ${canvasW} × ${canvasH}`;
        return;
      }

      const img = state.image;
      const scale = Math.min(photoAreaW / img.naturalWidth, photoAreaH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = (canvasW - drawW) / 2;
      const drawY = photoAreaY + (photoAreaH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      const { line1, line2, line3 } = buildExifLines(state.exif);
      const padX = canvasW * 0.04;
      const align = textAlign.value;
      let textX = padX;
      if (align === 'center') textX = canvasW / 2;
      if (align === 'right') textX = canvasW - padX;
      ctx.textAlign = align;

      const base = Math.min(canvasW, canvasH) * 0.028 * (Number(fontScale.value) || 1);
      const headSize = Math.max(14, base);
      const subSize = Math.max(12, base * 0.72);
      const noteSize = Math.max(12, base * 0.60);
      const lineGap = Math.max(8, base * 0.35);
      const footerTop = canvasH - bottomPx;
      const footerBottom = canvasH;
      const footerH = footerBottom - footerTop;

      if (fields.showTitleLine.checked) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = Math.max(1, canvasW * 0.0009);
        const lx1 = padX;
        const lx2 = canvasW - padX;
        const ly = footerTop + Math.max(5, canvasH * 0.007);
        ctx.beginPath();
        ctx.moveTo(lx1, ly);
        ctx.lineTo(lx2, ly);
        ctx.stroke();
      }

      const textItems = [];
      if (line1) textItems.push({ text: line1, size: headSize, weight: 700, color: textColor, gapAfter: lineGap });
      if (line2) textItems.push({ text: line2, size: subSize, weight: 500, color: subColor, gapAfter: lineGap * 0.8 });
      if (line3) textItems.push({ text: line3, size: noteSize, weight: 500, color: subColor, gapAfter: 0 });

      // フッター内の上下の安全余白。罫線がある場合も文字と重ならない。
      const footerInset = Math.max(12, Math.min(footerH * 0.18, canvasH * 0.025));
      const topGuide = fields.showTitleLine.checked
        ? footerTop + footerInset + Math.max(5, canvasH * 0.007)
        : footerTop + footerInset;
      const bottomGuide = footerBottom - footerInset;
      const availableTextH = Math.max(10, bottomGuide - topGuide);
      let textBlockH = 0;
      textItems.forEach((item, idx) => {
        textBlockH += item.size;
        if (idx < textItems.length - 1) textBlockH += item.gapAfter;
      });

      let startY = topGuide;
      const vAlign = textVerticalAlign.value;
      if (vAlign === 'middle') {
        startY = topGuide + (availableTextH - textBlockH) / 2;
      } else if (vAlign === 'bottom') {
        startY = bottomGuide - textBlockH;
      }
      startY += Number(textBlockOffset.value || 0);
      const minStartY = topGuide;
      const maxStartY = bottomGuide - textBlockH;
      startY = Math.min(Math.max(startY, minStartY), Math.max(minStartY, maxStartY));

      let baseline = startY;
      textItems.forEach((item, idx) => {
        ctx.fillStyle = item.color;
        ctx.font = `${item.weight} ${item.size}px sans-serif`;
        ctx.fillText(item.text, textX, baseline + item.size);
        baseline += item.size;
        if (idx < textItems.length - 1) baseline += item.gapAfter;
      });

      previewInfo.textContent = `出力サイズ: ${canvasW} × ${canvasH} / 写真描画サイズ: ${Math.round(drawW)} × ${Math.round(drawH)} / クロップなし`;
    }

    function saveImage() {
      if (!state.image) {
        alert('先に画像を読み込んでください。');
        return;
      }
      render();
      const format = exportFormat.value;
      const link = document.createElement('a');
      const baseName = (state.fileName || 'export').replace(/\.[^.]+$/, '');
      if (format === 'jpeg') {
        const q = Math.min(1, Math.max(0.5, (Number(jpegQuality.value) || 95) / 100));
        link.href = previewCanvas.toDataURL('image/jpeg', q);
        link.download = `${baseName}_exif_frame.jpg`;
      } else {
        link.href = previewCanvas.toDataURL('image/png');
        link.download = `${baseName}_exif_frame.png`;
      }
      link.click();
    }

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await loadImageFile(file);
      } catch (err) {
        console.error(err);
        alert('画像の読み込みに失敗しました。');
      }
    });

    aspectPreset.addEventListener('change', () => { updateHeightFromPreset(); render(); });
    outWidth.addEventListener('input', () => { updateHeightFromPreset(); render(); });
    outHeight.addEventListener('input', render);
    [topMargin, bottomMargin, textAlign, textVerticalAlign, fontScale, textBlockOffset, exportFormat, jpegQuality, customText1, customText2, customText3].forEach(el => { el.addEventListener('input', render); el.addEventListener('change', render); });
    Object.values(fields).forEach(el => el.addEventListener('change', render));

    document.getElementById('bgColorChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      state.bg = chip.dataset.bg;
      document.querySelectorAll('#bgColorChips .chip').forEach(c => c.classList.toggle('active', c === chip));
      render();
    });

    document.getElementById('renderBtn').addEventListener('click', render);
    document.getElementById('saveBtn').addEventListener('click', saveImage);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);

    updateHeightFromPreset();
    render();
