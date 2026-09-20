import { parseBlob } from 'music-metadata-browser';

export const extractMetadata = async (file) => {
  try {
    const metadata = await parseBlob(file);
    const common = metadata.common;

    let artworkDataUrl = null;
    if (common.picture && common.picture.length > 0) {
      const picture = common.picture[0];
      const blob = new Blob([picture.data], { type: picture.format });
      artworkDataUrl = await blobToDataUrl(blob);
    }

    return {
      title: common.title || null,
      artist: common.artist || common.albumartist || null,
      album: common.album || null,
      genre: common.genre?.[0] || null,
      year: common.year || null,
      duration: metadata.format.duration || 0,
      artworkDataUrl,
    };
  } catch (error) {
    console.error('Failed to extract metadata:', error);
    return {
      title: null,
      artist: null,
      album: null,
      genre: null,
      year: null,
      duration: 0,
      artworkDataUrl: null,
    };
  }
};

const blobToDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};