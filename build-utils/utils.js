import fs from 'fs'
import process from 'process'

const slash = process.platform === 'win32' ? '\\' : '/'

export function getEnv() {
  return fs
    .readFileSync('.env', 'utf8')
    .split('\n')
    .reduce((acc, line) => {
      const [key, value] = line.split('=')
      if (!key || !value) return acc
      acc[key] = value.trim()
      return acc
    }, {})
}

export function debounce(callback, delay) {
  let timeout = null
  return function (...args) {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        resolve(callback(...args))
      }, delay)
    })
  }
}

function getTspFiles(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }

  return fs
    .readdirSync(dir, { recursive: true })
    .filter((file) => file.endsWith('.tsp'))
    .map((file) => `${dir}/${file.split(slash).join('/')}`)
}

export const getBundledCode = async (env) => {
  const SERVICE_TITLE = env.SERVICE_TITLE || 'Main Service'
  const SERVER_URL = env.SERVER_URL || 'http://localhost:3000'
  const SERVER_NAME = env.SERVER_NAME || 'MainServer'

  const sharedFiles = getTspFiles('./src/shared')
  const specFiles = getTspFiles('./src/specs')

  const doNotEditWarning = `// Code is auto-generated. DO NOT EDIT.\n`

  const importStatements = `
import "@typespec/http";
${[...sharedFiles, ...specFiles]
  .map((file) => {
    return `import "${file}";`
  })
  .join('\n')}`

  const usingStatements = `\n
using TypeSpec.Http;
using Shared;
    `

  const serviceDecorator = `
@service({
    title: "${SERVICE_TITLE}",
})
@server("${SERVER_URL}", "${SERVER_NAME}")
`

  const namespace = `\nnamespace MainService;\n\n`

  const namespaceRegex = 'namespace ([^;]*)'
  const tagRegex = '(@tag.*)[\\s\\S]*namespace'
  const routeRegex = '(@route.*)[\\s\\S]*namespace'
  const interfaceRegex = 'interface Interface'
  const authedInterfaceRegex = 'interface AuthedInterface'
  const specsSource = (
    await Promise.all(
      specFiles.map(async (file) => {
        const content = await fs.promises.readFile(file).catch(console.error)

        const source = content.toString()
        const namespaceMatch = source.match(namespaceRegex)
        const tagMatch = source.match(tagRegex)
        const routeMatch = source.match(routeRegex)
        const interfaceMatch = source.match(interfaceRegex)
        const authedInterfaceMatch = source.match(authedInterfaceRegex)

        return {
          namespace: namespaceMatch ? namespaceMatch[1] : '',
          tag: tagMatch ? tagMatch[1] : '',
          route: routeMatch ? routeMatch[1] : '',
          interface: !!interfaceMatch,
          authedInterface: !!authedInterfaceMatch,
        }
      })
    )
  ).sort((a, b) => a.tag.localeCompare(b.tag))

  const specs = {}
  const insert = (node, keys, value) => {
    const key = keys.shift()
    if (!node[key]) {
      node[key] = {
        namespace: key,
        children: {},
        value: null,
      }
    }

    if (keys.length === 0) {
      if (node[key].value) {
        for (const k in value) {
          node[key].value[k] ||= value[k]
        }
      } else {
        node[key].value = value
      }
      return
    }

    insert(node[key].children, keys, value)
  }
  for (const spec of specsSource) {
    if (!spec.namespace) continue
    if (!spec.tag && !spec.route && !spec.interface && !spec.authedInterface)
      continue
    const namespaces = spec.namespace.split('.')
    insert(specs, namespaces, spec)
  }

  let main = ''
  const write = (str, indent) => {
    main += ' '.repeat(indent) + str + '\n'
  }
  const dfs = (node, indent = 0) => {
    let first = true
    for (const key in node) {
      if (!first) {
        write('', indent)
      }
      first = false

      const { value } = node[key]

      write(`namespace ${key}Impl {`, indent)
      if (value?.interface) {
        if (value?.tag) {
          write(value?.tag, indent + 2)
        }
        if (value.route) {
          write(value.route, indent + 2)
        }
        write(
          `interface ${key}Interface extends ${value.namespace}.Interface {}`,
          indent + 2
        )
      }
      if (value?.authedInterface) {
        if (value.interface) {
          write('', indent)
        }

        if (value?.tag) {
          write(value?.tag, indent + 2)
        }
        if (value.route) {
          write(value.route, indent + 2)
        }
        write(`@useAuth(Authorization)`, indent + 2)
        write(
          `interface ${key}AuthedInterface extends ${value.namespace}.AuthedInterface {}`,
          indent + 2
        )
      }

      dfs(node[key].children, indent + 2)
      write('}', indent)
    }
  }

  dfs(specs)
  const mainSource =
    doNotEditWarning +
    importStatements +
    usingStatements +
    serviceDecorator +
    namespace +
    main

  return mainSource
}

export function build(path, options = {}) {
  const { env } = options
  return getBundledCode(env)
    .then((code) => {
      fs.writeFileSync(path, code)
      console.log(`${path} file generated`)
    })
    .catch(console.error)
}
