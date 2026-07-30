import React, { useRef, useState, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, Download, Loader2 } from "lucide-react";
import { downloadMediaFile } from "../lib/download";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = "Product Video Player"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    setHasError(false);
    setDownloadError(null);
    setIsDownloading(false);
    if (isOpen && videoRef.current && videoUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isOpen, videoUrl]);

  if (!isOpen || !videoUrl) return null;

  const handleDownload = async () => {
    if (!videoUrl || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    const filename = `${title.toLowerCase().replace(/\s+/g, "_")}.mp4`;
    const res = await downloadMediaFile(videoUrl, filename);
    setIsDownloading(false);
    if (!res.success) {
      setDownloadError(res.error || "Unable to download video file.");
    }
  };

  const togglePlay = () => {
    if (!videoRef.current || hasError) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
        setHasError(true);
      });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-xs sm:text-sm font-extrabold text-white font-mono truncate">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative bg-black flex items-center justify-center aspect-video w-full overflow-hidden">
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-300 gap-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="font-mono text-sm font-bold text-white">Video unavailable.</p>
              <p className="text-xs text-zinc-400 max-w-sm">The media clip could not be loaded or is no longer accessible from storage.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onError={() => {
                  setHasError(true);
                  setIsPlaying(false);
                }}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {!isPlaying && !hasError && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 bg-emerald-600/90 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-7 h-7 ml-1" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Video Controls Bar */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-2">
          {downloadError && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center justify-between text-xs text-rose-300 animate-fadeIn">
              <span className="font-mono text-[11px]">{downloadError}</span>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="text-rose-400 hover:text-white font-bold ml-2 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Timeline slider */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-400 min-w-[36px]">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-zinc-700 accent-emerald-500 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-zinc-400 min-w-[36px]">{formatTime(duration)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="p-2 text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-emerald-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-700 accent-emerald-500 rounded-lg cursor-pointer hidden sm:block"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-3 py-1.5 text-xs font-bold font-mono text-emerald-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 border border-zinc-700 disabled:opacity-50"
                title="Download video clip to device"
              >
                {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isDownloading ? "Downloading..." : "Download"}</span>
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
