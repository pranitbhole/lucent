import { useState } from "react";
import { ImagePlus, X, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UNSPLASH_COVERS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&q=80",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1200&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=80",
];

export default function CoverImage({ coverImage, onCoverChange }) {
  const [showInput, setShowInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const randomCover = () => {
    const random = UNSPLASH_COVERS[Math.floor(Math.random() * UNSPLASH_COVERS.length)];
    onCoverChange(random);
    setShowInput(false);
  };

  const applyUrl = () => {
    if (urlInput.trim()) {
      onCoverChange(urlInput.trim());
      setUrlInput("");
      setShowInput(false);
    }
  };

  const removeCover = () => {
    onCoverChange(null);
    setShowInput(false);
  };

  if (!coverImage) {
    return (
      <div className="w-full h-10 flex items-center gap-2 mb-2">
        <button
          onClick={randomCover}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs transition-colors"
        >
          <ImagePlus size={14} />
          Add cover
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full mb-6 group">
      {/* Cover Image */}
      <div className="w-full h-52 rounded-xl overflow-hidden">
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80";
          }}
        />
      </div>

      {/* Overlay buttons on hover */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={randomCover}
          className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
        >
          <Shuffle size={12} />
          Random
        </button>
        <button
          onClick={() => setShowInput((prev) => !prev)}
          className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
        >
          <ImagePlus size={12} />
          Change
        </button>
        <button
          onClick={removeCover}
          className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm transition-colors"
        >
          <X size={12} />
          Remove
        </button>
      </div>

      {/* URL Input */}
      {showInput && (
        <div className="absolute bottom-14 right-3 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 flex gap-2 w-80">
          <Input
            placeholder="Paste image URL..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyUrl()}
            className="bg-gray-700 border-gray-600 text-white text-sm"
            autoFocus
          />
          <Button size="sm" onClick={applyUrl}>Apply</Button>
        </div>
      )}
    </div>
  );
}