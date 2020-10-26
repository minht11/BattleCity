const REGISTER_WORKER = 'service-worker:'

export default function serviceWorkerPlugin () {
  const filesRefs = []
  return ({
    load(id) {
      if (id.startsWith(REGISTER_WORKER)) {
        const emitedFileRef = this.emitFile({
          type: 'chunk',
          id: id.slice(REGISTER_WORKER.length),
          fileName: 'sw.js',
        })
        filesRefs.push(emitedFileRef)

        return `export default import.meta.ROLLUP_FILE_URL_${emitedFileRef}`
      }
    },
    async resolveId(source, importer) {
      if (source.startsWith(REGISTER_WORKER)) {
        const resolvedId = await this.resolve(source.slice(REGISTER_WORKER.length), importer)

        return REGISTER_WORKER + resolvedId.id
      }
      return null
    },
    generateBundle(outputOptions, bundle) {
      const workerActualFileNames = filesRefs.map((ref) => this.getFileName(ref))
      const bundleKeys = Object.keys(bundle)

      const getFiles = (isDynamic) => {
        return bundleKeys
        .filter((id) => {
          const entry = bundle[id]
          return !workerActualFileNames.includes(id)
            && (isDynamic && entry.isDynamicEntry || !isDynamic && !entry.isDynamicEntry)
        })
        .map((id) => `/${id}`)
      }

      const staticFiles = getFiles(false)
      const dynamicFiles = getFiles(true)
      const workerVersion = `${new Date().getTime()}`

      const staticFilesRegexp = new RegExp('STATIC_FILES_URLS_FROM_PLUGIN', 'g')
      const dynamicFilesRegexp = new RegExp('DYNAMIC_FILES_URLS_FROM_PLUGIN', 'g')
      const workerVersionRegexp = new RegExp('SERVICE_WORKER_VERSION_FROM_PLUGIN', 'g')

      const replaceCode = (file, regexp, value) => {
        if (regexp.test(file.code)) {
          file.code = file.code.replace(regexp, JSON.stringify(value))
        }
      }

      bundleKeys.forEach((id) => {
        const file = bundle[id]
        if (file.type === 'chunk') {
          replaceCode(file, staticFilesRegexp, staticFiles)
          replaceCode(file, dynamicFilesRegexp, dynamicFiles)
          replaceCode(file, workerVersionRegexp, workerVersion)
        }
      })      
    },
  })
}
