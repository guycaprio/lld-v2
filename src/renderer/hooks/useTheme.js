// @flow
import { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import get from 'lodash/get'

const useTheme = (path: any) => {
  const theme = useContext(ThemeContext)
  return get(theme, path)
}

export default useTheme
