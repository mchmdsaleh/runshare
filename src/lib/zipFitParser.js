import JSZip from "jszip";

export async function extractFirstFitFromZip(file) {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const fitEntries = entries.filter((entry) => entry.name.toLowerCase().endsWith(".fit"));

  if (!fitEntries.length) {
    throw new Error("No .fit file found inside ZIP.");
  }

  const firstFit = fitEntries[0];
  const content = await firstFit.async("arraybuffer");
  return new File([content], firstFit.name.split("/").pop() || "activity.fit", {
    type: "application/octet-stream"
  });
}
