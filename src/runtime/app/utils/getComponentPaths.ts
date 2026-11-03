import fs from 'fs'
import path from 'path'

export default function getComponentPaths() {
    const baseDir = path.resolve(process.cwd(), 'app/components')

    const components = [
        {
            path: '~/components',
            extensions: ['vue'],
            pathPrefix: false,
        },
    ]

    for (const folder of getAllFolderPaths(baseDir)) {
        components.push({
            path: folder,
            extensions: ['vue'],
            pathPrefix: false,
        })
    }

    return components
}

function getAllFolderPaths(dir: string): string[] {
    const results: string[] = []

    if (!fs.existsSync(dir)) return results

    const items = fs.readdirSync(dir)

    for (const item of items) {
        const fullPath = path.join(dir, item)

        if (fs.statSync(fullPath).isDirectory()) {
            const aliasPath =
                '~/' +
                path
                    .relative(path.resolve(process.cwd(), 'app'), fullPath)
                    .replace(/\\/g, '/')

            results.push(aliasPath)

            results.push(...getAllFolderPaths(fullPath))
        }
    }

    return results
}