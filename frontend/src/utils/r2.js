import { API_BASE } from '../config/api'

/**
 * Delete a file from R2 by key or full URL.
 * @param {string} keyOrUrl - object key (e.g. "piecework-images/123.png") or full R2 URL.
 * @returns {Promise<{message: string, key?: string}>}
 */
export async function deleteR2File(keyOrUrl) {
  if (!keyOrUrl) throw new Error('keyOrUrl is required')

  const res = await fetch(`${API_BASE}/uploads/file`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyOrUrl }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to delete R2 file (status ${res.status})`)
  }

  return res.json()
}
