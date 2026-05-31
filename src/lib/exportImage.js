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
  if (!navigator?.clipboard?.write) {
    throw new Error("Clipboard access requires HTTPS. Make sure you're using a secure connection.");
  }
  if (!window.ClipboardItem) throw new Error("Clipboard image is not supported in this browser.");

  const ClipboardItemCtor = window.ClipboardItem;
  const attempts = [
    () => navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]),
    () =>
      navigator.clipboard.write([
        new ClipboardItemCtor({
          "image/png": Promise.resolve(blob)
        })
      ])
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to copy image to clipboard.");
}

function resolveSize(options) {
  const { sizePreset, customWidth, customHeight } = options;
  const size =
    sizePreset === "custom"
      ? { width: Number(customWidth) || 1080, height: Number(customHeight) || 1080 }
      : SIZE_MAP[sizePreset] || SIZE_MAP.story;
  return size;
}
