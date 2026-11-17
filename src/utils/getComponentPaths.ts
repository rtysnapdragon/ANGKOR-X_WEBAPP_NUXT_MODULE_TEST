
import fs from 'node:fs'
import path from 'node:path'

interface ComponentDirectory {
  path: string
  extensions: string[]
  pathPrefix: boolean
}

export default function getComponentPaths(
  baseDir: string,
): ComponentDirectory[] {
  if (typeof baseDir !== 'string' || !baseDir.trim()) {
    throw new TypeError('baseDir must be a valid directory path')
  }

  const resolvedDir = path.resolve(baseDir)

  if (!fs.existsSync(resolvedDir)) {
    return []
  }

  const components: ComponentDirectory[] = [
    {
      path: resolvedDir,
      extensions: ['vue'],
      pathPrefix: false,
    },
  ]

  for (const folder of getAllFolderPaths(resolvedDir)) {
    components.push({
      path: folder,
      extensions: ['vue'],
      pathPrefix: false,
    })
  }

  return components
}

function getAllFolderPaths(dir: string): string[] {
  if (typeof dir !== 'string' || !dir.trim()) {
    return []
  }

  if (!fs.existsSync(dir)) {
    return []
  }

  const results: string[] = []

  for (const item of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    if (!item.isDirectory()) continue

    const fullPath = path.join(dir, item.name)

    results.push(fullPath)
    results.push(...getAllFolderPaths(fullPath))
  }

  return results
}
