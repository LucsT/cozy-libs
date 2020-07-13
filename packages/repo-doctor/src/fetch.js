const fetch = require('node-fetch')
const memoize = require('lodash/memoize')

const depEntryToObject = type => depEntry => ({
  name: depEntry[0],
  version: depEntry[1],
  type
})

const fetchRepositoryInfo = async repository => {
  const slug = repository.slug
  const packageJsonPath = repository.packageJsonPath || 'package.json'
  const packageJsonURL = `https://raw.githubusercontent.com/${slug}/master/${packageJsonPath}`
  const packageJsonText = await fetch(packageJsonURL).then(resp => resp.text())
  const packageJsonData = JSON.parse(packageJsonText)
  const allDependencies = []
    .concat(
      Object.entries(packageJsonData.dependencies || {}).map(
        depEntryToObject('dependencies')
      )
    )
    .concat(
      Object.entries(packageJsonData.devDependencies || {}).map(
        depEntryToObject('devDependencies')
      )
    )
    .concat(
      Object.entries(packageJsonData.peerDependencies || {}).map(
        depEntryToObject('peerDependencies')
      )
    )

  return {
    dependencies: allDependencies,
    ...repository
  }
}

const fetchDependencyInfo = memoize(
  async dependencyName => {
    const text = await fetch(
      `https://registry.npmjs.org/${dependencyName}`
    ).then(resp => resp.text())
    const data = JSON.parse(text)
    const versions = Object.values(data.versions)
    return {
      name: data.name,
      lastVersion: versions[versions.length - 1].version
    }
  },
  dependencyName => dependencyName
)

module.exports = {
  fetchRepositoryInfo,
  fetchDependencyInfo
}
