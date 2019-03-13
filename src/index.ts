import * as fs from "fs"
import * as path from "path"
import * as child_process from "child_process"
import decompress from "decompress"

interface Package {
    readonly name: string
    readonly version: string
}

type Action = "publish"|"unpublish"

const traverse = async (dir: string, action: Action): Promise<void> => {
    console.log("@ts-common/publish is started")
    const cwd = path.resolve("./")
    console.log(`current folder: ${cwd}`)
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        const filePath = path.join(dir, file.name)
        if (file.isDirectory()) {
            traverse(filePath, action)
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
            let viewNames: string = ""
            try {
                viewNames = child_process.execSync(`npm view ${id} name`).toString()
            } catch (e) { }
            const exist = viewNames != ""
            if (action == "publish") {
                if (!exist) {
                    console.log(`publishing ${id} from ${filePath}`)
                    try {
                        child_process.execSync(`npm publish ${filePath} --access=public`)
                    } catch (e) {
                        process.exitCode = 1
                    }
                } else {
                    console.log(`${id} from ${filePath} is skipped`)
                }
            } else {
                if (exist) {
                    console.log(`unpublishing ${id} from ${filePath}`)
                    try {
                        child_process.execSync(`npm unpublish ${id}`)
                    } catch (e) {
                        process.exitCode = 1
                    }
                } else {
                    console.log(`${id} from ${filePath} is skipped`)
                }
            }
        }
    }
    console.log("@ts-common/publish is dones")
}

traverse("..", process.argv.indexOf("unpublish") >= 0 ? "unpublish" : "publish")
