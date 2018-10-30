import * as fs from "fs"
import * as path from "path"
import * as child_process from "child_process"
import decompress from "decompress"

interface Package {
    readonly name: string
    readonly version: string
}

const traverse = async (dir: string): Promise<void> => {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        const filePath = path.join(dir, file.name)
        if (file.isDirectory()) {
            traverse(filePath)
        } else if (path.extname(file.name) === ".tgz") {
            const files = await decompress(
                filePath,
                {
                    filter: file => file.path === "package/package.json"
                }
            )
            const packageJson = files[0]
            const { name, version } = JSON.parse(packageJson.data.toString()) as Package
            const id = `${name}@${version}`
            const viewNames = child_process.execSync(`npm view ${id} name`).toString().split("\n")
            if (viewNames[0] != name) {
                console.log(`publishing ${id} from ${filePath}`)
                child_process.execSync(`npm publish ${filePath} --access=public`)
            } else {
                console.log(`${id} from ${filePath} is skipped`)
            }
        }
    }
}

traverse("..")
