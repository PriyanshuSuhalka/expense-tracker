export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/**
 * Share a file through the OS share sheet (Drive, WhatsApp, email…); fall back to a download.
 * Returns 'shared' | 'downloaded' | 'cancelled'.
 */
export async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // any other share failure: fall through to a plain download
    }
  }
  saveBlob(blob, filename)
  return 'downloaded'
}
