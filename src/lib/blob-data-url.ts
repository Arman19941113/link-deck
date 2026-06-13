// Browser helpers for converting between Blob values and data URLs.

/** Reads a Blob as a data URL. */
export function blobToDataUrl(blob: Blob, errorMessage = 'Blob could not be encoded as a data URL'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error(errorMessage))
    })
    reader.addEventListener('error', () => {
      reject(new Error(errorMessage))
    })
    reader.readAsDataURL(blob)
  })
}

/** Converts a data URL into a Blob. */
export async function dataUrlToBlob(
  dataUrl: string,
  errorMessage = 'Data URL could not be decoded as a Blob',
): Promise<Blob> {
  const response = await fetch(dataUrl)

  if (!response.ok) {
    throw new Error(errorMessage)
  }

  return response.blob()
}
