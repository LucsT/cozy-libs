import { themes } from './DocumentTypeData'

const findDefaultItemTheme = item => {
  return themes.find(
    theme => theme.defaultItems && theme.defaultItems.includes(item.label)
  )
}

export const getThemeByItem = item => {
  const defaultTheme = findDefaultItemTheme(item)
  if (defaultTheme) {
    return defaultTheme
  }
  return themes.find(theme => {
    return theme.items.some(it => it.label === item.label)
  })
}
