import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { X, Check } from 'lucide-react';

const ImageCropper = ({ imageSrc, aspect = 1, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropAreaChange = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/90 flex flex-col animate-in fade-in duration-200">
            <div className="relative flex-1 w-full bg-black">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropAreaChange}
                    onZoomChange={onZoomChange}
                />
            </div>

            <div className="p-4 bg-white z-50 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => {
                            setZoom(e.target.value)
                        }}
                        className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                    >
                        <X size={18} /> Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-cyber-primary hover:bg-cyber-secondary flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                    >
                        <Check size={18} /> Crop & Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
