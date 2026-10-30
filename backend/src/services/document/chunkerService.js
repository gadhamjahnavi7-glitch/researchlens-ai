/**
 * Splits extracted pages into semantic chunks of approx 400-600 characters
 * with ~100 characters overlap while tracking original page numbers.
 */
export const chunkDocumentPages = (pages, targetChunkSize = 500, overlap = 100) => {
  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const pageText = page.text || '';
    if (!pageText.trim()) continue;

    // Split page into paragraphs or sentences
    const paragraphs = pageText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    let currentBuffer = '';

    for (const para of paragraphs) {
      if ((currentBuffer.length + para.length) <= targetChunkSize) {
        currentBuffer += (currentBuffer ? '\n\n' : '') + para;
      } else {
        if (currentBuffer.length > 0) {
          chunks.push({
            chunkIndex: globalChunkIndex++,
            pageNumber: page.pageNumber,
            text: currentBuffer.trim(),
            tokenCount: Math.ceil(currentBuffer.length / 4)
          });
          // carry forward overlap
          const overlapText = currentBuffer.slice(-overlap);
          currentBuffer = overlapText + ' ' + para;
        } else {
          // Paragraph itself is larger than targetChunkSize; split by sentences
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [para];
          for (const sentence of sentences) {
            if ((currentBuffer.length + sentence.length) <= targetChunkSize) {
              currentBuffer += (currentBuffer ? ' ' : '') + sentence.trim();
            } else {
              if (currentBuffer.length > 0) {
                chunks.push({
                  chunkIndex: globalChunkIndex++,
                  pageNumber: page.pageNumber,
                  text: currentBuffer.trim(),
                  tokenCount: Math.ceil(currentBuffer.length / 4)
                });
                const overlapText = currentBuffer.slice(-overlap);
                currentBuffer = overlapText + ' ' + sentence.trim();
              } else {
                chunks.push({
                  chunkIndex: globalChunkIndex++,
                  pageNumber: page.pageNumber,
                  text: sentence.trim(),
                  tokenCount: Math.ceil(sentence.length / 4)
                });
                currentBuffer = '';
              }
            }
          }
        }
      }
    }

    if (currentBuffer.trim().length > 0) {
      chunks.push({
        chunkIndex: globalChunkIndex++,
        pageNumber: page.pageNumber,
        text: currentBuffer.trim(),
        tokenCount: Math.ceil(currentBuffer.length / 4)
      });
    }
  }

  return chunks;
};

