/**
 * Upload utilities — S3-backed drop-in replacement for UploadThing.
 *
 * Exports the same `uploadFiles` and `useUploadThing` API surface so that
 * all existing component imports continue to work without changes.
 */

'use client'

import { useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

export interface UploadResult {
  /** Public URL of the uploaded file. */
  url: string
  /** MIME type (e.g. "image/jpeg"). */
  type: string
  /** S3 object key (useful for deletion). */
  key?: string
}

// ── uploadFiles (imperative) ───────────────────────────────────────────────

/**
 * Upload files to S3 via the server upload endpoint.
 *
 * ```ts
 * const results = await uploadFiles('postImages', { files: [file1, file2] })
 * results[0].url // public S3 URL
 * ```
 */
export async function uploadFiles(
  endpoint: string,
  opts: { files: File[]; [key: string]: unknown },
): Promise<UploadResult[]> {
  if (!opts.files.length) return []

  const formData = new FormData()
  formData.append('endpoint', endpoint)
  for (const file of opts.files) {
    formData.append('files', file)
  }

  const res = await fetch('/api/s3/upload', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `Upload fehlgeschlagen (${res.status})`)
  }

  const data = await res.json()
  return (data.files ?? []) as UploadResult[]
}

// ── useUploadThing (hook) ──────────────────────────────────────────────────

/**
 * Hook for uploading files to S3.
 *
 * ```tsx
 * const { startUpload, isUploading } = useUploadThing('postImages')
 * const results = await startUpload(files)
 * ```
 */
export function useUploadThing(endpoint: string) {
  const [isUploading, setIsUploading] = useState(false)

  const startUpload = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      setIsUploading(true)
      try {
        return await uploadFiles(endpoint, { files })
      } finally {
        setIsUploading(false)
      }
    },
    [endpoint],
  )

  return { startUpload, isUploading }
}
