# TopPlayersofAllSports - AI Coding Instructions

## Architecture Overview

This is a **full-stack sports analytics platform** with a **React frontend** and **Spring Boot backend**. The app provides real-time sports data, player analytics, news feeds, and calendar events across multiple sports.

### Frontend Architecture (React + Vite)
- **Component System**: Uses custom UI components (`src/components/ui/`) with CVA (Class Variance Authority) for styling variants
- **Icon Pattern**: Import `AppIcon` from `'../components/AppIcon'` (uses Lucide React icons with fallback handling)
- **Image Pattern**: Import `AppImage` from `'../components/AppImage'` (includes error fallback to `/assets/images/no_image.png`)
- **Routing**: Centralized in `src/Routes.jsx` with React Router v6
- **Auth**: Context-based authentication (`src/contexts/AuthContext.jsx`) with JWT tokens
- **Services**: API layer in `src/services/` handles backend communication and AI integration

### Backend Architecture (Spring Boot)
- **Package Structure**: `com.topplayersofallsports.backend.{controller,service,repository,entity,dto,security}`
- **Security**: JWT-based auth with role-based access (ADMIN, MODERATOR, EDITOR, USER)
- **Database**: PostgreSQL with Spring Data JPA
- **External APIs**: Integrated with API-Football and OpenAI/Gemini for AI features

## Critical Development Patterns

### Component Import Convention
```jsx
// ALWAYS use these exact imports for consistency
import AppIcon from '../../components/AppIcon';        // NOT Icon
import AppImage from '../../components/AppImage';      // NOT Image  
import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
```

### Button Component Usage
```jsx
// Use variant and size props with iconName for consistency
<Button 
  variant="outline"     // default|outline|secondary|ghost|link|success|warning|danger
  size="sm"            // xs|sm|default|lg|xl|icon
  iconName="ChevronLeft"  // Lucide icon name (optional)
>
  Button Text
</Button>
```

### Tailwind CSS Patterns
- **Custom CSS Variables**: Use semantic color variables like `text-text-primary`, `bg-background`, `border-border`
- **Component Styling**: CVA-based variants in `src/components/ui/` components
- **Responsive Design**: Mobile-first approach with `sm:`, `md:`, `lg:`, `xl:` breakpoints

### Page Structure Pattern
```jsx
// Standard page layout pattern used across all pages
return (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Page content */}
      </div>
    </main>
  </div>
);
```

## Development Workflows

### Frontend Development
```bash
npm start                    # Vite dev server (port 3000)
npm run build               # Production build
npm run serve               # Preview production build
```

### Backend Development  
```bash
# From backend/ directory
./start-dev.bat             # Windows dev mode with auto-reload
./start-prod.bat            # Production mode
./gradlew bootRun           # Alternative dev start
```

### Environment Setup
- **Frontend**: Uses `VITE_` prefixed environment variables
- **Backend**: Profiles managed via `application-{dev|prod}.properties`
- **API Keys**: Stored in backend environment (API-Football, OpenAI/Gemini)

## Service Integration Patterns

### API Service Structure
```javascript
// Pattern for new API services
class NewService {
  constructor() {
    this.authToken = null;
  }
  
  setAuthToken(token) { this.authToken = token; }
  
  async makeRequest(endpoint, options = {}) {
    // Standardized error handling and auth token injection
  }
}
```


## Data Flow Architecture

1. **Frontend** → `src/services/` → **Backend REST APIs** → **Database/External APIs**
2. **AI Integration**: Frontend requests → Backend AI services → OpenAI/Gemini → Processed responses
4. **State Management**: React Context for auth, local state for components (no Redux currently)

## Key Files for New Features

- **Add Route**: Modify `src/Routes.jsx` 
- **New Page**: Create in `src/pages/{feature-name}/index.jsx`
- **UI Components**: Extend `src/components/ui/` with CVA patterns
-

## Common Pitfalls to Avoid

1. **Import Inconsistency**: Always use `AppIcon` and `AppImage` (not `Icon`/`Image`)
2. **Missing Error Handling**: Wrap service calls in try-catch with user-friendly error messages
4. **Styling Conflicts**: Use semantic CSS variables, not hardcoded Tailwind colors
5. **Route Protection**: Ensure protected routes check authentication state

## Testing & Quality

- **Error Boundaries**: `ErrorBoundary` component wraps all routes
- **Image Fallbacks**: All images auto-fallback to placeholder
- **Icon Fallbacks**: Unknown icons render as `HelpCircle`
- **Service Resilience**: All API calls include timeout and error handling
