import { readdir } from 'fs/promises'
import { join } from 'path'

export async function getAvailableLocales(): Promise<string[]> {
  try {
    const base = join(process.cwd(), 'src', 'locales')
    const entries = await readdir(base, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return ['de']
  }
}
