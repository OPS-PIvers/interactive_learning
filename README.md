# Interactive Learning Hub

A sophisticated web application for creating and delivering interactive multimedia training modules. Build engaging educational experiences by placing interactive hotspots on images and guiding learners through timeline-driven sequences.

## 🎯 What It Does

The Interactive Learning Hub allows content creators to transform static images into dynamic, interactive learning experiences. Users can:

- **Create Interactive Modules**: Add clickable hotspots to images with rich multimedia content
- **Build Timeline Sequences**: Guide learners through step-by-step experiences with 17+ interaction types
- **Deliver Engaging Content**: Present information through videos, audio, quizzes, and visual effects
- **Support Multiple Devices**: Responsive design optimized for both desktop and mobile

## ✨ Key Features

### Content Creation
- **Visual Hotspot Editor**: Drag-and-drop interface for placing interactive markers
- **Rich Media Integration**: Videos (MP4, YouTube), audio files, images, and text
- **Timeline Builder**: Create sequential learning experiences with multiple interaction types
- **Mobile-Responsive Editing**: Simplified mobile interface for content creation
- **Real-time Preview**: Test learning modules as you build them

### Learning Experience
- **Interactive Hotspots**: Clickable markers with customizable colors, sizes, and descriptions
- **Guided Navigation**: Step-by-step timeline with progress tracking
- **Multiple Interaction Types**: 
  - Show/hide content and pulse animations
  - Spotlight effects and pan/zoom to specific areas
  - Video modals and audio narration
  - Interactive quizzes with multiple choice answers
  - YouTube integration with start/end times
- **Self-Paced Learning**: Learners control timing and can review previous steps

### Technical Capabilities
- **Cross-Device Compatibility**: Automatic scaling between desktop and mobile
- **Real-time Data Sync**: Firebase backend with live updates
- **Performance Optimized**: Throttled calculations and memoized components
- **Accessibility Features**: Keyboard navigation and screen reader support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project (for backend)
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd interactive_learning

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Firebase configuration

# Start development server
npm run dev
```

### Development Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run test suite
npm run test:ui      # Run tests with UI
```

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling and design system
- **Custom Hooks** for mobile detection, touch gestures, and positioning

### Backend & Data
- **Firebase Firestore** for real-time NoSQL database
- **Firebase Storage** for media file hosting
- **Firebase Hosting** for web application deployment

### Development Tools
- **Vitest** for comprehensive testing
- **TypeScript** for enhanced developer experience
- **ESLint & PostCSS** for code quality

## 📱 Usage Examples

### Creating a Training Module
1. **Start New Project**: Click "Create New Project" and add title/description
2. **Upload Background**: Add the base image learners will explore
3. **Add Hotspots**: Click on the image to place interactive markers
4. **Configure Content**: Set hotspot titles, descriptions, and multimedia
5. **Build Timeline**: Create guided learning sequences
6. **Test & Publish**: Preview the experience and save when ready

### Real-World Applications
- **Corporate Training**: Equipment walkthroughs, safety procedures
- **Educational Content**: Anatomy lessons, historical timelines, scientific processes
- **Product Demos**: Feature highlights, user onboarding flows
- **Museum Exhibits**: Digital interactive displays and virtual tours
- **Technical Documentation**: Step-by-step procedures with visual guidance

## 🏛️ Architecture

### Component Structure
```
src/client/components/
├── App.tsx                    # Main application shell
├── InteractiveModule.tsx      # Core learning module container
├── HotspotViewer.tsx         # Individual hotspot rendering
├── HorizontalTimeline.tsx    # Step-by-step navigation
├── MediaModal.tsx            # Video/audio/image modals
├── EditorToolbar.tsx         # Content creation tools
└── Mobile*Components         # Mobile-optimized interfaces
```

### Data Layer
```
src/lib/
├── firebaseApi.ts            # Database operations
├── firebaseProxy.ts          # API abstraction layer
├── dataSanitizer.ts          # Input validation & security
└── safeMathUtils.ts          # Mathematical operations
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database and Storage
3. Add your Firebase config to `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### Environment Variables
- `VITE_FIREBASE_*`: Firebase configuration
- `NODE_ENV`: Development/production mode
- Additional configuration options in `vite.config.ts`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the component examples in `/src/client/components`

---

**Interactive Learning Hub** - Transforming static content into engaging, interactive educational experiences.