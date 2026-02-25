# Changelog

## [Unreleased]

### Fixed
- **HTML Upload Parsing**: Fixed share extraction from exported HTML files -- QRious regex failed on derivation paths containing single quotes; added embedded `shareData` array to all HTML exports as primary extraction path

## [0.3.3] - 2026-02-24

### Added
- **Vault Backup PNG Export**: New image export option alongside HTML for vault backups with same card formatting
- **Title/Version Header**: Added document header to Share Cards exports with title and version information

### Changed
- **QR Code Size**: Increased from 168px to 252px (150% enlargement) for improved mobile/desktop scannability
- **PDF Margins**: Standardized to 10mm on all sides for consistent print layout
- **PDF Quality Settings**: Increased html2canvas scale to 2 and PNG quality to 0.98 for sharper mobile rendering

### Fixed
- **Mobile PDF Rendering**: Fixed blank page issue on mobile devices by setting explicit canvas dimensions and using PNG instead of JPEG
- **Vault Address Alignment**: Fixed word wrapping of private keys on mobile by adding 2em left padding to address column
- **JSON Export Modal**: Fixed password field auto-population issue - now accepts empty password input without dismissing modal
- **Vault Backup Header**: Matches Share Cards export formatting with "SHAMIR SECRET SHARING CARD" title and version footer

## [0.3.2] - 2026-02-24

### Added
- **Vault Backup HTML Export**: New formatted backup document with complete seed phrase, instructions, security warnings, and embedded QR code
- **Enhanced Export UI**: Explicit labeling of export formats (HTML, PDF, PNG QR codes)
- **Comprehensive Export Tests**: New test suites validating all export formats (HTML, PDF, vault QR codes)
- **Vault QR Code Detection**: Smart error message when attempting to scan vault backup QR codes via share scanner

### Changed
- **Layout Standardization**: Removed compact (2-up) and wallet-size (4-up) layouts, standardized to full-page only
- **Vault Export Addresses**: Now includes all addresses (previously truncated to first 5) for consistency with share workflow
- **Export Labels**: Changed to explicit "Share Cards HTML/PDF" and "Vault Backup HTML" labels
- **QR Scanner Error Handling**: Improved detection of vault backup QR codes with helpful error guidance
- **Mobile Alignment**: Fixed vault address share sets table to align vertically with address derivations on mobile
- **Settings Footer**: Moved "Clear All Data" and "Download Standalone HTML" buttons to footer, right-aligned
- **Documentation**: Clarified QR code sizing documentation in README

### Fixed
- **Export Consistency**: Vault exports now match share workflow exports exactly with all addresses included
- **Export Format Clarity**: Users can now clearly distinguish between share cards and vault backups
- **QR Import Guidance**: Clear error message guides users to scan individual share cards instead of vault backups
- **Mobile Layout**: Vault settings tables now have consistent vertical alignment on small screens

## [0.3.1] - 2026-02-24

### Added
- **Camera Performance**: Fixed severe performance degradation (1 frame every 5-10 seconds)
- **QR Fallback**: Added lightweight jsQR library as fallback when zxing fails
- **Reset Button**: New "Reset Matches" button to clear scanned shares and start over
- **Haptic Feedback**: Added navigator.vibrate() for mobile haptic feedback on successful QR detection
- **Audio Improvements**: Better iOS audio context handling with automatic resume on user gesture

### Changed
- **Scanner Optimization**: Replaced expensive multi-granularity tiled scanning with simple 2-second interval fallback
- **Canvas Display**: New startCanvasDisplay() function using requestAnimationFrame (~30fps) for responsive video display

### Fixed
- **Camera Display**: Camera was invisible due to missing display rendering function
- **QR Detection**: Added jsQR fallback for devices where zxing library fails
- **Mobile Audio**: Fixed silent operation on iOS with improved AudioContext lifecycle management

## [0.3.0] - 2026-02-22

### Added
- **QR Scanner**: Camera-based QR code scanning for share recovery with real-time canvas display
- **PDF Export**: Support for exporting shares as PDF with full-page layout
- **HTML Export**: Support for exporting shares as printable HTML files
- **Vault System**: Encrypted IndexedDB storage with AES-256-GCM encryption
- **File Upload**: Support for importing shares from PDF, HTML, and JSON files
- **Address Derivation**: BIP44 HD wallet address generation with multiple path types

### Changed
- **UI Polish**: Improved layouts and spacing for print consistency
- **QR Encoding**: Full-page layout with optimized QR code sizing for scannability

## [0.2.0] - 2026-02-15

### Added
- **Shamir's Secret Sharing**: Implement GF(2^8) secret splitting algorithm
- **Share Cards**: Generate printable cards with QR codes for share distribution
- **Print Dialog**: Support for printing share cards directly from browser
- **Entropy Collection**: Mouse-based entropy collection for random number generation
- **Type Safety**: Full TypeScript support with strict type checking

## [0.1.0] - 2026-02-01

### Added
- **Initial Release**: Basic seed phrase generation and splitting functionality
- **Web Interface**: Simple UI for generating and managing secrets
- **Offline Support**: Fully client-side operation with no server requirements
