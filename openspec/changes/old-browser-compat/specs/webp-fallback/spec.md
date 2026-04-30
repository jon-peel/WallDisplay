## ADDED Requirements

### Requirement: JPEG fallback images generated at build time
The photo conversion script SHALL produce a `.jpg` file alongside each `.webp` file so that browsers without WebP support can display slideshow photos.

#### Scenario: JPEG generated for each photo
- **WHEN** `scripts/convert-photos.ts` processes a source image
- **THEN** it writes both a `.webp` and a `.jpg` version to the `photos/` directory

#### Scenario: JPEG quality setting
- **WHEN** a JPEG fallback is generated
- **THEN** it SHALL be encoded at quality 85 to balance file size and visual fidelity

### Requirement: Slideshow serves WebP to capable browsers and JPEG to others
The slideshow renderer SHALL use WebP images when the browser supports them, and fall back to JPEG when it does not.

#### Scenario: WebP-capable browser displays WebP
- **WHEN** the slideshow loads a photo on Safari 14+ or Chrome
- **THEN** the browser receives and displays the `.webp` version

#### Scenario: Non-WebP browser displays JPEG
- **WHEN** the slideshow loads a photo on Safari 13 or earlier (iOS 13 and below)
- **THEN** the browser receives and displays the `.jpg` fallback without errors

#### Scenario: Missing JPEG does not break slideshow
- **WHEN** a `.jpg` fallback is not present for a given photo
- **THEN** the slideshow SHALL skip to the next photo rather than showing a broken image
