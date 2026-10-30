import fs from 'fs';
import path from 'path';

/**
 * Extracts text and page metadata from PDF, DOCX, or TXT file.
 * Preserves page boundaries wherever feasible.
 */
export const extractDocumentText = async (filePath, fileType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = fileType ? fileType.toLowerCase() : path.extname(filePath).toLowerCase().replace('.', '');

  if (ext === 'txt') {
    const rawText = fs.readFileSync(filePath, 'utf-8');
    if (!rawText.trim()) {
      return {
        pages: [{ pageNumber: 1, text: '' }],
        fullText: '',
        pageCount: 1,
        requiresOcr: false,
        warning: 'The uploaded text file is empty.'
      };
    }
    return {
      pages: [{ pageNumber: 1, text: rawText.trim() }],
      fullText: rawText.trim(),
      pageCount: 1,
      requiresOcr: false
    };
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    const fullText = result.value ? result.value.trim() : '';

    // Estimate page breaks every ~3000 characters for docx if pages not natively tagged
    const docxPages = [];
    if (fullText.length === 0) {
      docxPages.push({ pageNumber: 1, text: '' });
    } else {
      const charPerPage = 2500;
      let currentIndex = 0;
      let pageNum = 1;
      while (currentIndex < fullText.length) {
        const slice = fullText.slice(currentIndex, currentIndex + charPerPage);
        docxPages.push({ pageNumber: pageNum, text: slice.trim() });
        currentIndex += charPerPage;
        pageNum++;
      }
    }

    return {
      pages: docxPages,
      fullText,
      pageCount: docxPages.length,
      requiresOcr: false
    };
  }

  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(filePath);

    const pages = [];
    let currentPage = 1;

    // Custom pagerender to capture per-page text
    const customPagerender = function (pageData) {
      return pageData.getTextContent().then(textContent => {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY == item.transform[5] || !lastY) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: currentPage++,
          text: text.trim()
        });
        return text;
      });
    };

    const pdfData = await pdfParse(dataBuffer, { pagerender: customPagerender });

    const fullText = pdfData.text ? pdfData.text.trim() : '';
    const hasText = pages.some(p => p.text.length > 20);

    return {
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }],
      fullText,
      pageCount: pdfData.numpages || pages.length || 1,
      requiresOcr: !hasText && (pdfData.numpages > 0),
      warning: (!hasText && pdfData.numpages > 0)
        ? 'No extractable text detected in PDF. The document may be an image scan requiring optical character recognition (OCR).'
        : null
    };
  }

  throw new Error(`Unsupported document format: ${ext}`);
};

