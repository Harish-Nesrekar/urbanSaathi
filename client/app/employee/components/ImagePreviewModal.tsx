"use client";

type ImagePreviewModalProps = {
  previewImage: string | null;
  onClose: () => void;
};

export default function ImagePreviewModal({
  previewImage,
  onClose,
}: ImagePreviewModalProps) {
  if (!previewImage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div className="absolute right-5 top-5 flex gap-3">
        <a
          href={previewImage}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
        >
          Open Original
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/30"
        >
          ✕ Close
        </button>
      </div>

      <img
        src={previewImage}
        alt="Full size attachment"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
    </div>
  );
}