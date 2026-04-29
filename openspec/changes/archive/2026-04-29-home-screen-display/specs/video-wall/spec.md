## ADDED Requirements

### Requirement: YouTube URL config
The `config.json` file SHALL support a `videoWall` object with a `videos` array of strings (YouTube URLs or video IDs). URLs are parsed at build time and embedded in the compiled output.

#### Scenario: URLs in config
- **WHEN** `config.json` contains `videoWall.videos` with one or more YouTube URLs
- **THEN** the compiled output includes all video IDs for use by the video wall

#### Scenario: Empty videos array
- **WHEN** `config.json` contains `videoWall.videos: []`
- **THEN** the video wall displays an empty-state message indicating no videos are configured

### Requirement: 4×4 video grid
The video wall SHALL display up to 16 videos in a 4-column by 4-row grid that fills the viewport. Each cell SHALL render an embedded YouTube iframe.

#### Scenario: Full page of 16 videos
- **WHEN** the current page has 16 video entries
- **THEN** all 16 iframes are arranged in a 4×4 grid filling the screen

#### Scenario: Partial last page
- **WHEN** the last page has fewer than 16 videos
- **THEN** the grid shows only the available videos; empty cells are not rendered

### Requirement: Video wall paging
The video wall SHALL support paging through videos in groups of 16. Page navigation controls (previous/next arrows) SHALL be displayed. The page indicator SHALL show the current page number and total pages.

#### Scenario: Navigate to next page
- **WHEN** the user clicks the next-page control and a next page exists
- **THEN** the grid updates to show the next 16 videos

#### Scenario: Navigate to previous page
- **WHEN** the user clicks the previous-page control and a previous page exists
- **THEN** the grid updates to show the previous 16 videos

#### Scenario: First page, no previous
- **WHEN** the current page is the first page
- **THEN** the previous-page control is hidden or disabled

#### Scenario: Last page, no next
- **WHEN** the current page is the last page
- **THEN** the next-page control is hidden or disabled

### Requirement: Videos muted by default
All YouTube iframes SHALL be initialised with `mute=1` and `autoplay=1` via the YouTube Iframe API so they play silently when the video wall is displayed.

#### Scenario: Video wall loads
- **WHEN** the video wall mode is active and iframes are initialised
- **THEN** all videos begin playing muted without audio

### Requirement: Click to fullscreen and unmute
Clicking on any video in the grid SHALL open that video fullscreen using the browser Fullscreen API and unmute it via the YouTube Iframe API.

#### Scenario: Click a video
- **WHEN** the user clicks on a video iframe in the grid
- **THEN** that video's container enters fullscreen and the video is unmuted

#### Scenario: Exit fullscreen
- **WHEN** the user presses Escape or exits fullscreen via the browser UI
- **THEN** the video wall grid is restored and the video is muted again

### Requirement: Iframe reuse across pages
The YouTube iframes SHALL be reused (their `src` updated) when navigating between pages rather than destroyed and recreated, to avoid unnecessary player reload delays.

#### Scenario: Page navigation with existing iframes
- **WHEN** the user navigates to a different page
- **THEN** existing iframe elements have their `src` attribute updated to the new video IDs without removing them from the DOM
