import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, X, RefreshCw, Check, Upload, Trash2, AlertCircle, Smartphone } from 'lucide-react';
import { AlertMessage } from './AlertMessage';

interface PassportPhotoPickerProps {
  photoUrl: string;
  onPhotoChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

export const PassportPhotoPicker: React.FC<PassportPhotoPickerProps> = ({
  photoUrl,
  onPhotoChange,
  label = 'Passport Photograph',
  required = false,
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [customUrlMode, setCustomUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Input refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.error('Error stopping track:', e);
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.error('Error in stopCameraStream:', e);
    } finally {
      setIsCameraActive(false);
    }
  };

  const startCamera = async (facing: 'user' | 'environment' = 'user') => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC Camera is not supported on this browser. Please use Gallery or System Camera option.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
      setFacingMode(facing);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => {
            console.warn('Video play warning:', err);
          });
        }
      }, 150);
    } catch (err: any) {
      console.error('Error starting live camera stream:', err);
      setIsCameraActive(false);

      let msg = 'Could not access device camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings or select a photo from your gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device found on this device. Please select a photo from your gallery.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Camera is currently in use by another app. Please close other camera apps or choose a photo from your gallery.';
      } else if (err.message) {
        msg = err.message;
      }

      setCameraError(msg);
    }
  };

  const capturePhotoFromCamera = () => {
    setIsProcessing(true);
    setCameraError(null);

    try {
      if (!videoRef.current) {
        throw new Error('Camera feed element not found.');
      }

      const video = videoRef.current;
      const vw = video.videoWidth || video.width || 0;
      const vh = video.videoHeight || video.height || 0;

      if (vw <= 0 || vh <= 0) {
        throw new Error('Camera preview frame is still initializing. Please wait a moment and try again.');
      }

      // Create offscreen canvas element to prevent display:none context issues on mobile devices
      const canvas = document.createElement('canvas');
      const size = Math.min(vw, vh);
      const startX = (vw - size) / 2;
      const startY = (vh - size) / 2;

      canvas.width = 250;
      canvas.height = 250;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas rendering context not supported on this browser.');
      }

      context.drawImage(video, startX, startY, size, size, 0, 0, 250, 250);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      if (!dataUrl || dataUrl.length < 50) {
        throw new Error('Snapshot generation failed. Please try again.');
      }

      // Stop stream BEFORE closing modal and updating state to release camera hardware cleanly
      stopCameraStream();

      // Immediately pass photo to parent form
      onPhotoChange(dataUrl);

      setIsOptionsOpen(false);
      setCameraError(null);
    } catch (err: any) {
      console.error('Capture photo error:', err);
      setCameraError(err.message || 'Failed to capture photo. Please try again or select from gallery.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAndSetImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Selected file is not an image. Please choose a JPEG or PNG photo.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setCameraError('Image file is too large (over 15MB). Please choose a smaller photo.');
      return;
    }

    setIsProcessing(true);
    setCameraError(null);

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 250;
          canvas.height = 250;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 250, 250);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onPhotoChange(compressedDataUrl);
          } else {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                onPhotoChange(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        } catch (e: any) {
          console.error('Image crop processing error:', e);
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              onPhotoChange(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        } finally {
          URL.revokeObjectURL(objectUrl);
          stopCameraStream();
          setIsOptionsOpen(false);
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setIsProcessing(false);
        setCameraError('Could not read selected image file. Please try another photo.');
      };

      img.src = objectUrl;
    } catch (err: any) {
      console.error('File load error:', err);
      setIsProcessing(false);
      setCameraError('Error processing image file. Please try another photo.');
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImageFile(file);
    }
    // Reset file input value so same file can be selected again if needed
    e.target.value = '';
  };

  const handleNativeCameraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndSetImageFile(file);
    }
    e.target.value = '';
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  const defaultAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  return (
    <div className="space-y-2">
      <label className="block font-black text-black text-xs uppercase tracking-wider">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>

      {/* Hidden File Input for Gallery Selection */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />

      {/* Hidden File Input for Native Camera Capture (Android/iOS System Camera) */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="user"
        onChange={handleNativeCameraSelect}
        className="hidden"
      />

      {/* Main Preview Container */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border-2 border-slate-800 bg-white shadow-sm">
        <div className="relative group shrink-0">
          <img
            src={photoUrl || defaultAvatar}
            alt="Passport Photograph Preview"
            onError={(e) => {
              // Fallback if URL fails to load
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover border-4 border-[#014421] shadow-md bg-slate-100"
          />
          {photoUrl ? (
            <div className="absolute -bottom-2 -right-2 bg-[#014421] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
              <Check className="w-4 h-4 text-[#DAA520]" />
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left w-full">
          <div className="text-xs font-black text-black">
            {photoUrl && photoUrl.startsWith('data:')
              ? '✓ Photo Captured / Attached'
              : photoUrl
              ? '✓ Current Member Photo Attached'
              : 'No passport photo attached'}
          </div>
          <p className="text-[11px] text-black font-semibold leading-relaxed">
            Standard passport photograph format (300x300 px). Required for cooperative ID cards, registers & print slips.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCameraError(null);
                setIsOptionsOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 border-2 border-[#014421] shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Camera className="w-4 h-4 text-[#DAA520]" />
              <span>{photoUrl ? 'Change Photo' : 'Add Passport Photo'}</span>
            </button>

            {photoUrl ? (
              <button
                type="button"
                onClick={() => onPhotoChange('')}
                className="px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Photo Options Modal */}
      {isOptionsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border-4 border-[#014421] shadow-2xl p-6 text-black space-y-5 my-auto animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#014421] text-white flex items-center justify-center font-black">
                  <Camera className="w-4 h-4 text-[#DAA520]" />
                </div>
                <h3 className="font-extrabold text-black text-base">Select Passport Photo Source</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setIsOptionsOpen(false);
                }}
                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-black font-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Display inside Modal */}
            {cameraError && (
              <AlertMessage
                type="error"
                title="Camera / Media Alert"
                message={cameraError}
                onClose={() => setCameraError(null)}
              />
            )}

            {/* Live WebRTC Camera Active Mode */}
            {isCameraActive ? (
              <div className="space-y-4">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-square border-2 border-slate-800 flex items-center justify-center shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Passport framing guideline overlay */}
                  <div className="absolute inset-6 border-2 border-dashed border-[#DAA520] rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/70 text-[#DAA520] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Center Face Here
                    </span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-black font-bold text-xs flex items-center gap-1.5 border border-slate-400 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Flip Camera</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={capturePhotoFromCamera}
                    className="px-5 py-3 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black text-sm flex items-center gap-2 shadow-md border-2 border-[#DAA520] cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-[#DAA520]" />
                    ) : (
                      <Camera className="w-5 h-5 text-[#DAA520]" />
                    )}
                    <span>{isProcessing ? 'Processing...' : 'Use Photo'}</span>
                  </button>
                </div>
              </div>
            ) : customUrlMode ? (
              /* Custom Web Image URL Mode */
              <div className="space-y-3">
                <label className="block text-xs font-black text-black">Enter Direct Image URL / Web Link:</label>
                <input
                  type="url"
                  placeholder="https://example.com/passport-photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-slate-800 bg-white text-black font-bold text-xs focus:border-[#014421]"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomUrlMode(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-black font-bold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInput.trim()) {
                        onPhotoChange(urlInput.trim());
                        setIsOptionsOpen(false);
                        setCustomUrlMode(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#014421] text-white font-black text-xs hover:bg-emerald-800 cursor-pointer"
                  >
                    Attach Photo URL
                  </button>
                </div>
              </div>
            ) : (
              /* Default Options List */
              <div className="space-y-3">
                <p className="text-xs font-bold text-black">
                  Select how you want to add the passport photograph:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Live WebRTC Camera Stream */}
                  <button
                    type="button"
                    onClick={() => startCamera('user')}
                    className="p-3.5 rounded-xl border-2 border-[#014421] bg-emerald-50 hover:bg-emerald-100 text-black flex items-center gap-3.5 transition-all text-left shadow-sm group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#014421] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Camera className="w-5 h-5 text-[#DAA520]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-black">1. Take Photo (Live In-App Camera)</div>
                      <div className="text-[11px] text-slate-800 font-medium">Use live camera preview with instant face centering frame.</div>
                    </div>
                  </button>

                  {/* Option 2: Native Phone Camera App */}
                  <button
                    type="button"
                    onClick={() => {
                      if (nativeCameraInputRef.current) {
                        nativeCameraInputRef.current.click();
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-slate-800 bg-amber-50 hover:bg-amber-100 text-black flex items-center gap-3.5 transition-all text-left shadow-sm group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Smartphone className="w-5 h-5 text-[#DAA520]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-black">2. Open System Phone Camera App</div>
                      <div className="text-[11px] text-slate-800 font-medium">Launch Android/iOS native camera app directly to snap picture.</div>
                    </div>
                  </button>

                  {/* Option 3: Phone Gallery / File Picker */}
                  <button
                    type="button"
                    onClick={() => {
                      if (galleryInputRef.current) {
                        galleryInputRef.current.click();
                      }
                    }}
                    className="p-3.5 rounded-xl border-2 border-slate-800 bg-white hover:bg-slate-50 text-black flex items-center gap-3.5 transition-all text-left shadow-sm group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5 text-[#DAA520]" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-black">3. Choose from Phone Gallery / Files</div>
                      <div className="text-[11px] text-slate-800 font-medium">Select an existing passport photograph saved on your device.</div>
                    </div>
                  </button>

                  {/* Option 4: Image Web Link */}
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput(photoUrl);
                      setCustomUrlMode(true);
                    }}
                    className="p-2.5 rounded-xl border border-slate-400 bg-slate-100 hover:bg-slate-200 text-black flex items-center justify-between text-xs font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-slate-700" />
                      Paste Image Link / Web URL
                    </span>
                    <span className="text-slate-700 font-extrabold">→</span>
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setIsOptionsOpen(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-extrabold text-xs hover:bg-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
