# Halloween Lacta - Photobooth

## Project Structure

This photobooth application is organized into modular JavaScript files for better maintainability and separation of concerns.

### File Organization

#### HTML & CSS
- **`photobooth.html`** - Main HTML structure and DOM elements
- **`photobooth.css`** - All styles for the application
- **`index.html`** - Entry point that redirects to photobooth.html

#### JavaScript Modules

The application logic is separated into focused modules:

1. **`config.js`** - Configuration and constants
   - Canvas dimensions (WIDTH, HEIGHT)
   - Template paths and configuration
   - Animation configurations
   - Idle timer settings

2. **`templates.js`** - Template management and animations
   - Template loading and preloading
   - Template switching logic (previous/next/pick)
   - Animation state management
   - Easing functions
   - Template rendering with effects (breathing, blinking, falling)

3. **`ui.js`** - UI interactions
   - QR code timer management
   - Notification system
   - Progress bar updates
   - Navigation controls

4. **`upload.js`** - Photo upload functionality
   - Photo processing
   - API upload logic
   - Error handling for uploads

5. **`photobooth.js`** - Main coordination and camera
   - Camera initialization and management
   - Video rendering loop
   - Snapshot capture
   - Event listeners (swipe, idle, etc.)
   - Coordination between modules

#### Supporting Files
- **`api.js`** - API client configuration with axios
- **`spinner.js`** - Loading spinner management
- **`lib/qrcode.min.js`** - QR code generation library

### Module Dependencies

Load order in HTML (important for dependencies):
```html
<script src="./config.js"></script>        <!-- 1. Configuration first -->
<script src="./templates.js"></script>     <!-- 2. Template management -->
<script src="./ui.js"></script>            <!-- 3. UI controls -->
<script src="./upload.js"></script>        <!-- 4. Upload functionality -->
<script src="./photobooth.js"></script>    <!-- 5. Main coordinator last -->
```

### Key Features by Module

#### Templates Module
- 3 template variations (m-1, m-2, m-3)
- Multi-element animations with staggered entry
- Breathing effects on elements
- Blinking animations
- Falling chip animations
- Smooth template transitions

#### UI Module
- QR code display timer (16 seconds default)
- Add time functionality (max 5 clicks)
- Progress bar with color transitions
- Notification system for errors

#### Upload Module
- Image conversion and rotation
- Form data preparation
- API upload with progress
- Error handling and fallbacks

### Best Practices Applied

1. **Separation of Concerns** - Each file has a single, well-defined responsibility
2. **Modularity** - Functions are focused and reusable
3. **Configuration Management** - Constants and configuration centralized
4. **Error Handling** - Consistent error handling across modules
5. **Code Organization** - Related functionality grouped together

