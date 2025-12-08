import { theme } from './theme';

// Media query helper functions for responsive design
export const breakpoints = {
  mobile: `@media (min-width: ${theme.breakpoints.mobile})`,
  tablet: `@media (min-width: ${theme.breakpoints.tablet})`,
  desktop: `@media (min-width: ${theme.breakpoints.desktop})`,
  wide: `@media (min-width: ${theme.breakpoints.wide})`,
};

// Helper for max-width queries
export const maxBreakpoints = {
  mobile: `@media (max-width: ${parseInt(theme.breakpoints.tablet) - 1}px)`,
  tablet: `@media (max-width: ${parseInt(theme.breakpoints.desktop) - 1}px)`,
  desktop: `@media (max-width: ${parseInt(theme.breakpoints.wide) - 1}px)`,
};
