import { toBlob, toPng } from "html-to-image";

const SIZE_MAP = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 }
};

export async function exportCardAsPng(node, options) {
  const size = resolveSize(options);
  const { templateId } = options;

  const dataUrl = await toPng(node, {
    backgroundColor: "transparent",
    pixelRatio: 2,
    canvasWidth: size.width,
    canvasHeight: size.height
  });

  const filename = `runshare-${templateId}-${size.width}x${size.height}.png`;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function copyCardImageToClipboard(node, options) {
  const size = resolveSize(options);
  const blob = await toBlob(node, {
    backgroundColor: "transparent",
    pixelRatio: 2,
    canvasWidth: size.width,
    canvasHeight: size.height
  });

  if (!blob) throw new Error("Failed to render PNG blob.");
  if (!window.ClipboardItem) throw new Error("Clipboard image is not supported in this browser.");

  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

function resolveSize(options) {
  const { sizePreset, customWidth, customHeight } = options;
  const size =
    sizePreset === "custom"
      ? { width: Number(customWidth) || 1080, height: Number(customHeight) || 1080 }
      : SIZE_MAP[sizePreset] || SIZE_MAP.story;
  return size;
}
