# Accessibility Features

This document outlines the accessibility features implemented in the EmmaTech website.

## WCAG 2.1 AA Compliance

The website is designed to meet WCAG 2.1 Level AA standards.

### Implemented Features

#### 1. Keyboard Navigation
- All interactive elements (buttons, links, form fields) are keyboard accessible
- Proper focus indicators on all interactive elements
- Skip to main content link for keyboard users
- Modal focus trapping to prevent focus from leaving the modal

#### 2. Screen Reader Support
- Semantic HTML elements (main, section, footer)
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content (form errors, success messages)
- Proper heading hierarchy (h1, h2, h3)
- Form labels properly associated with inputs

#### 3. Visual Accessibility
- Color contrast ratios meet WCAG AA standards
- Focus indicators visible on all interactive elements
- Text remains readable when zoomed to 200%
- No information conveyed by color alone

#### 4. Form Accessibility
- All form fields have associated labels
- Required fields clearly marked
- Inline error messages with role="alert"
- Error messages linked to form fields
- Success messages announced to screen readers

#### 5. Modal Accessibility
- Focus trapped within modal when open
- ESC key closes modal
- Focus returned to trigger element on close
- Backdrop click closes modal
- Proper ARIA attributes (role="dialog", aria-modal="true")

## Testing

### Automated Testing
Run accessibility tests with:
```bash
npm test
```

The test suite includes axe-core automated accessibility testing.

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test skip to content link
- [ ] Verify modal focus trapping
- [ ] Test ESC key to close modals

#### Screen Reader Testing
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Verify all content is announced
- [ ] Verify form errors are announced
- [ ] Verify success messages are announced

#### Visual Testing
- [ ] Zoom to 200% and verify readability
- [ ] Test with high contrast mode
- [ ] Verify color contrast ratios
- [ ] Test with different color blindness simulations

## Known Issues

None at this time.

## Future Improvements

- Add more comprehensive ARIA landmarks
- Implement reduced motion preferences
- Add high contrast theme option
- Improve mobile screen reader experience
