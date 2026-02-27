"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, Loader2 } from "lucide-react";
import { MAX_PHOTOS, MAX_PHOTO_SIZE_MB } from "@/lib/constants";
import { toast } from "sonner";

interface PhotoUploaderProps {
  listingId?: string;
  userId: string;
  existingPhotos?: string[];
  coverIndex?: number;
  onChange: (urls: string[], coverIndex: number) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  userId,
  existingPhotos = [],
  coverIndex = 0,
  onChange,
  maxPhotos = MAX_PHOTOS,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [cover, setCover] = useState(coverIndex);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      // Get signed URL from our API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "property-photos", path }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");

      const { signedUrl, token, publicUrl } = await res.json();

      // Upload directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      return publicUrl;
    } catch {
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const filesToUpload = acceptedFiles.slice(0, remaining);
      setUploading(true);

      const results = await Promise.all(filesToUpload.map(uploadFile));
      const newUrls = results.filter((url): url is string => url !== null);

      const updated = [...photos, ...newUrls];
      setPhotos(updated);
      onChange(updated, cover);
      setUploading(false);

      if (newUrls.length > 0) {
        toast.success(`${newUrls.length} photo(s) uploaded`);
      }
    },
    [photos, cover, maxPhotos, onChange]
  );

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    const newCover = cover >= updated.length ? 0 : cover > index ? cover - 1 : cover;
    setPhotos(updated);
    setCover(newCover);
    onChange(updated, newCover);
  };

  const setCoverPhoto = (index: number) => {
    setCover(index);
    onChange(photos, index);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"] },
    maxSize: MAX_PHOTO_SIZE_MB * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop photos here" : "Drag & drop photos here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse ({photos.length}/{maxPhotos})
            </p>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, index) => (
            <div key={url} className="relative group aspect-[4/3] rounded-lg overflow-hidden border">
              <Image
                src={url}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />

              {/* Cover badge */}
              {index === cover && (
                <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-3 w-3" /> Cover
                </div>
              )}

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {index !== cover && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCoverPhoto(index)}
                    className="h-7 text-xs"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Cover
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removePhoto(index)}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
