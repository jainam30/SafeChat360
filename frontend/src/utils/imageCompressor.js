/**
 * Compresses an image file using HTML5 Canvas.
 * @param {File} file - The image file to compress.
 * @param {number} maxWidth - The maximum width of the output image.
 * @param {number} quality - The quality of the output JPG (0 to 1).
 * @returns {Promise<string>} - A promise that resolves to the Base64 string of the compressed image.
 */
export const compressImage = (file, maxWidth = 1080, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress (JPEG usually gives better compression for photos)
                // If it's a PNG with transparency, we might lose it or have black background.
                // For social feed photos, JPEG is usually fine.
                // We'll fallback to file type if possible, or force jpeg for compression.
                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                // Note: PNG quality argument is effectively ignored in many browsers, 
                // but we can at least resize.

                const dataUrl = canvas.toDataURL(outputType, quality);
                resolve(dataUrl);
            };
            img.onerror = (err) => {
                reject(err);
            };
        };
        reader.onerror = (err) => {
            reject(err);
        };
    });
};
