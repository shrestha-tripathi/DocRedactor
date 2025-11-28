export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateRedactedFileName(originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) {
    return `${originalName}_redacted`;
  }
  const name = originalName.slice(0, lastDot);
  const ext = originalName.slice(lastDot);
  return `${name}_redacted${ext}`;
}
