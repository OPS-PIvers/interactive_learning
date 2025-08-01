# ExpliCoLearning

A powerful, slide-based web application for creating and delivering rich, interactive learning experiences. This platform enables educators, trainers, and content creators to build engaging, responsive, and accessible educational modules with a modern, intuitive editor.

## 🎯 What It Does

This platform allows you to transform your content into dynamic, slide-based presentations. Unlike traditional presentation software, it provides a robust set of interactive features designed for modern e-learning.

- **Create Slide Decks**: Build presentations with multiple slides, each with its own layout and content
- **Add Interactive Elements**: Place hotspots, text, images, and other media onto slides
- **Design Responsive Layouts**: Ensure your content looks great on desktop, tablet, and mobile devices
- **Implement Complex Interactions**: Use a powerful interaction system to create engaging user experiences
- **Deliver Content Anywhere**: Publish and share your interactive modules with a single link

## ✨ Key Features

### Content Creation
- **Slide-Based Editor**: An intuitive, drag-and-drop interface for creating and arranging slides
- **Rich Media Integration**: Embed images, videos (MP4, YouTube), audio files, and interactive elements
- **Responsive Design Tools**: Fine-tune the layout and positioning of elements for different screen sizes
- **Advanced Interaction System**: Create complex interactions with triggers, conditions, and effects
- **Real-time Preview**: Instantly see how your interactive module will look and behave
- **Mobile-Responsive Editing**: Simplified mobile interface for content creation

### Learning Experience
- **Interactive Elements**: Engage learners with clickable hotspots, quizzes, and multimedia content
- **Guided Navigation**: Control the flow of your presentation with slide transitions and user-guided navigation
- **Multiple Interaction Types**: 
  - Show/hide content and pulse animations
  - Spotlight effects and pan/zoom to specific areas
  - Video modals and audio narration
  - Interactive quizzes with multiple choice answers
  - YouTube integration with start/end times
- **Responsive Viewing**: Content automatically adapts to the learner's device and screen size
- **Accessible Design**: Built with accessibility in mind to support all learners
- **Self-Paced Learning**: Learners control timing and can review previous steps

### Technical Capabilities
- **Modern Tech Stack**: Built with React 18, TypeScript, and Vite for a fast and reliable experience
- **Real-time Data Sync**: Powered by Firebase for live updates and collaboration
- **Unified Modal System**: Intelligent modal positioning that prevents toolbar overlap across all device types
- **Optimized Performance**: Designed for smooth animations and fast loading times
- **Extensible Architecture**: The slide-based model is easy to extend with new features and components
- **Cross-Device Compatibility**: Automatic scaling between desktop and mobile with unified responsive behavior

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project (for backend)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd interactive_learning

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Firebase configuration to the .env file

# Start the development server
npm run dev
```

### Development Scripts
```bash
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run test         # Run test suite in watch mode
npm run test:run     # Run tests once (required before commits)
npm run test:ui      # Run tests with UI
```

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling and design system
- **dnd-kit** for accessible, high-performance drag-and-drop
- **Framer Motion** for smooth animations and transitions
- **Custom Hooks** for unified device detection, viewport management, and modal constraints
- **Responsive Design System** with centralized z-index management and layout constraints

### Backend & Data
- **Firebase Firestore** for real-time NoSQL database
- **Firebase Storage** for hosting and managing media files
- **Firebase Hosting** for deploying the web application

### Development Tools
- **Vitest** for comprehensive testing
- **TypeScript** for enhanced developer experience
- **ESLint & PostCSS** for code quality and styling

## 📱 Usage Examples

### Creating a Training Module
1. **Start New Project**: Click "Create New Project" and add title/description
2. **Create Slides**: Add multiple slides to build your presentation flow
3. **Add Interactive Elements**: Place hotspots, text, images, and media on slides
4. **Configure Content**: Set element properties, descriptions, and multimedia
5. **Build Interactions**: Create engaging user interactions and effects
6. **Test & Publish**: Preview the experience and save when ready

### Real-World Applications
- **Corporate Training**: Equipment walkthroughs, safety procedures, onboarding
- **Educational Content**: Anatomy lessons, historical timelines, scientific processes
- **Product Demos**: Feature highlights, user onboarding flows
- **Museum Exhibits**: Digital interactive displays and virtual tours
- **Technical Documentation**: Step-by-step procedures with visual guidance

## 🏛️ Architecture

The application is built on a slide-based architecture, which provides a more predictable and maintainable structure compared to traditional, coordinate-based systems.

### Core Concepts
- **SlideDeck**: A collection of slides that make up a complete interactive module
- **InteractiveSlide**: A single slide containing elements, transitions, and layout information
- **SlideElement**: An individual piece of content on a slide, such as a hotspot, text, or image
- **ResponsivePosition**: A system for defining the position and size of elements across different devices
- **ElementInteraction**: A powerful system for defining how elements respond to user input

### Component Structure
```
src/client/
├── components/
│   ├── slides/              # Slide-specific components and effects
│   │   ├── SlideEditor.tsx  # Main slide editor component
│   │   ├── SlideViewer.tsx  # Component for viewing interactive slides
│   │   └── effects/         # Effect settings and rendering
│   ├── responsive/          # Unified responsive components
│   │   └── ResponsiveModal.tsx # Unified modal system
│   ├── SlideBasedEditor.tsx # Main editor component
│   ├── SlideBasedViewer.tsx # Main viewer component
│   ├── mobile/              # Mobile-optimized interfaces
│   ├── desktop/             # Desktop modal components
│   ├── icons/               # Custom icon components
│   └── interactions/        # Interaction system components
├── hooks/
│   ├── useDeviceDetection.ts    # Unified device type detection
│   ├── useViewportHeight.ts     # Viewport management with iOS Safari support
│   └── useLayoutConstraints.ts  # Modal constraint system
└── utils/
    ├── ModalLayoutManager.ts    # Modal positioning utilities
    └── zIndexLevels.ts          # Centralized z-index management
```

### Data Layer
```
src/shared/
├── slideTypes.ts            # Data structures for slide-based architecture
├── migrationUtils.ts        # Utilities for migrating data from older formats
├── types.ts                 # Core application types
└── InteractionPresets.ts    # Predefined interaction patterns
```

## 🔧 Configuration

### Firebase Setup
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database, Firebase Storage, and Firebase Hosting
3. Copy your Firebase project configuration into the `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id
```

### Development Environment
- **Development Bypass**: Set `VITE_DEV_AUTH_BYPASS=true` for instant authentication during development
- **Test Credentials**: Use `TEST_USER_EMAIL=test@localhost.dev` and `TEST_USER_PASSWORD=TestPassword123!`
- **Puppeteer Integration**: Automated testing with MCP server integration

## 🧪 Testing

The project includes comprehensive testing with Vitest:

```bash
npm run test:run     # Run all tests once
npm run test         # Run tests in watch mode
npm run test:ui      # Run tests with visual interface
```

### Critical Tests
- **React Error Detection**: Tests for React Hook errors and component violations
- **Migration Testing**: Validates data migration from legacy formats
- **Slide Architecture**: Tests responsive positioning and element interactions

## 🤖 Puppeteer MCP Integration

The project includes comprehensive Puppeteer MCP integration for automated browser testing:

### Available Commands
```bash
npm run mcp:workflow test    # Run comprehensive MCP tests
npm run mcp:validate         # Validate MCP configuration
npm run auth:test           # Test authentication system
npm run puppeteer:test      # Run Puppeteer functionality tests
```

### Authentication Methods
- **Development Bypass**: Instant authentication for testing
- **Test Credentials**: Predefined test user accounts
- **Session Management**: Automated login/logout workflows

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with a descriptive message
4. Run `npm run test:run` to ensure all tests pass
5. Push your changes to your forked repository
6. Open a pull request and describe the changes you've made

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## 🙋‍♂️ Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation in the `.claude/` folder
- Review the component examples in `src/client/components`

---

**ExpliCoLearning** - Transforming static content into engaging, interactive educational experiences.