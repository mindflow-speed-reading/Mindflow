import { extendTheme } from '@chakra-ui/react';

import { FormLabel } from './components';

import { borders, breakpoints, colors, fonts, fontSizes, fontWeights, radii, shadows, space } from './foundations';

import { textStyles } from './styles';

export const theme = extendTheme({
  // Foundations
  borders,
  breakpoints,
  colors,
  radii,
  shadows,
  space,

  // Typography
  fonts,
  fontSizes,
  fontWeights,

  // Layer
  textStyles,

  // Components
  components: {
    // @ts-ignore
    FormLabel
  }
});
