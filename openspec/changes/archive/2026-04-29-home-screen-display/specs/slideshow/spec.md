## ADDED Requirements

### Requirement: Build-time photo discovery
The build script SHALL scan the `photos/` directory and generate a manifest of all image files (JPEG, PNG, WebP) including filename, pixel width, pixel height, and orientation (`landscape` | `portrait`). The manifest SHALL be embedded as a TypeScript module at `src/generated/photo-manifest.ts`.

#### Scenario: Photos folder contains images
- **WHEN** the build script runs and `photos/` contains one or more supported image files
- **THEN** a manifest file is generated listing each image with its filename, width, height, and orientation

#### Scenario: Photos folder is empty
- **WHEN** the build script runs and `photos/` contains no supported image files
- **THEN** the manifest is generated as an empty array and the build succeeds without error

#### Scenario: Unsupported file type in photos folder
- **WHEN** the build script runs and `photos/` contains a file that is not JPEG, PNG, or WebP
- **THEN** that file is silently ignored and does not appear in the manifest

### Requirement: Photo orientation classification
The build script SHALL classify each photo as `landscape` if its pixel width is greater than its pixel height, and `portrait` otherwise. EXIF rotation metadata SHALL be applied before classification.

#### Scenario: Landscape image
- **WHEN** an image has width > height after EXIF rotation
- **THEN** it is classified as `landscape` in the manifest

#### Scenario: Portrait image
- **WHEN** an image has height >= width after EXIF rotation
- **THEN** it is classified as `portrait` in the manifest

### Requirement: Slideshow layout — fullscreen landscape
The slideshow SHALL display a single landscape photo filling the entire screen (edge-to-edge, `object-fit: cover`) when the current slide is a landscape photo.

#### Scenario: Landscape slide displayed
- **WHEN** the current slide photo has orientation `landscape`
- **THEN** the photo occupies 100% of viewport width and height with no other photos visible

### Requirement: Slideshow layout — tiled portrait pair
The slideshow SHALL display two portrait photos side-by-side, each occupying 50% of the viewport width and 100% of the height, when two consecutive portrait photos are grouped together.

#### Scenario: Two portrait photos tiled
- **WHEN** two consecutive slides are both `portrait`
- **THEN** both photos are displayed simultaneously side-by-side filling the screen

### Requirement: Slideshow layout — mixed tile (one portrait + two landscape)
The slideshow SHALL display one portrait photo on the left half and two landscape photos stacked vertically on the right half when a mixed tile group is formed.

#### Scenario: Mixed tile displayed
- **WHEN** a slide group contains one portrait and two landscape photos
- **THEN** the portrait photo fills the left 50% of the screen, and the two landscape photos each fill 50% height on the right 50%

### Requirement: Automatic slide advancement
The slideshow SHALL automatically advance to the next slide or tile group at a configurable interval. The default interval SHALL be 10 seconds. The interval SHALL be configurable via `slideshowInterval` (in seconds) in `config.json`.

#### Scenario: Default interval
- **WHEN** `config.json` does not specify `slideshowInterval`
- **THEN** slides advance every 10 seconds

#### Scenario: Custom interval
- **WHEN** `config.json` specifies `slideshowInterval: 5`
- **THEN** slides advance every 5 seconds

### Requirement: Slideshow photo ordering
The slideshow SHALL display photos in a randomised order that is re-shuffled each time the full set has been shown once (looping shuffle).

#### Scenario: All photos shown once
- **WHEN** all photos in the manifest have been displayed
- **THEN** the slideshow reshuffles and begins again from the start of the new order
