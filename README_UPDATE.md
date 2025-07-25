# Slide-Based Interactive Learning Platform

A powerful, slide-based web application for creating and delivering rich, interactive learning experiences. This platform enables educators, trainers, and content creators to build engaging, responsive, and accessible educational modules with a modern, intuitive editor.

## 🎯 What It Does

This platform allows you to transform your content into dynamic, slide-based presentations. Unlike traditional presentation software, it provides a robust set of interactive features designed for modern e-learning.

- **Create Slide Decks**: Build presentations with multiple slides, each with its own layout and content.
- **Add Interactive Elements**: Place hotspots, text, images, and other media onto slides.
- **Design Responsive Layouts**: Ensure your content looks great on desktop, tablet, and mobile devices.
- **Implement Complex Interactions**: Use a powerful interaction system to create engaging user experiences.
- **Deliver Content Anywhere**: Publish and share your interactive modules with a single link.

## ✨ Key Features

### Content Creation
- **Slide-Based Editor**: An intuitive, drag-and-drop interface for creating and arranging slides.
- **Rich Media Integration**: Embed images, videos, and audio from various sources.
- **Responsive Design Tools**: Fine-tune the layout and positioning of elements for different screen sizes.
- **Advanced Interaction System**: Create complex interactions with triggers, conditions, and effects.
- **Real-time Preview**: Instantly see how your interactive module will look and behave.

### Learning Experience
- **Interactive Elements**: Engage learners with clickable hotspots, quizzes, and multimedia content.
- **Guided Navigation**: Control the flow of your presentation with slide transitions and user-guided navigation.
- **Responsive Viewing**: Content automatically adapts to the learner's device and screen size.
- **Accessible Design**: Built with accessibility in mind to support all learners.

### Technical Capabilities
- **Modern Tech Stack**: Built with React, TypeScript, and Vite for a fast and reliable experience.
- **Real-time Data Sync**: Powered by Firebase for live updates and collaboration.
- **Optimized Performance**: Designed for smooth animations and fast loading times.
- **Extensible Architecture**: The slide-based model is easy to extend with new features and components.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project (for backend)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd interactive-learning-platform

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
npm run dev          # Start the development server
npm run build        # Build the application for production
npm run preview      # Preview the production build locally
npm run test         # Run the test suite
```

## 🏗️ Technology Stack

### Frontend
- **React 18**: For building a component-based user interface.
- **TypeScript**: For type safety and improved developer experience.
- **Vite**: For fast development and optimized builds.
- **Tailwind CSS**: For a utility-first approach to styling.
- **dnd-kit**: For accessible, high-performance drag-and-drop.
- **Framer Motion**: For smooth animations and transitions.

### Backend & Data
- **Firebase Firestore**: For a real-time, NoSQL database.
- **Firebase Storage**: For hosting and managing media files.
- **Firebase Hosting**: For deploying the web application.

### Development Tools
- **Vitest**: For running tests and ensuring code quality.
- **ESLint**: For code linting and maintaining consistency.

## 🏛️ Architecture

The application is built on a slide-based architecture, which provides a more predictable and maintainable structure compared to traditional, coordinate-based systems.

### Core Concepts
- **SlideDeck**: A collection of slides that make up a complete interactive module.
- **InteractiveSlide**: A single slide containing elements, transitions, and layout information.
- **SlideElement**: An individual piece of content on a slide, such as a hotspot, text, or image.
- **ResponsivePosition**: A system for defining the position and size of elements across different devices.
- **ElementInteraction**: A powerful system for defining how elements respond to user input.

### Component Structure
```
src/client/components/
├── slides/                  # Components related to the slide-based editor and viewer
│   ├── SlideEditor.tsx      # The main slide editor component
│   └── SlideViewer.tsx      # The component for viewing interactive slides
├── SlideBasedEditor.tsx     # The main editor component that ties everything together
├── EditorToolbar.tsx        # The toolbar for the slide editor
├── PropertiesPanel.tsx      # The panel for editing the properties of slides and elements
└── ...                      # Other reusable components
```

### Data Layer
```
src/shared/
├── slideTypes.ts            # Defines the data structures for the slide-based architecture
├── migrationUtils.ts        # Utilities for migrating data from older formats
└── ...                      # Other shared types and utilities
```

## 🔧 Configuration

### Firebase Setup
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Firestore, Firebase Storage, and Firebase Hosting.
3. Copy your Firebase project configuration into the `.env` file.

### Environment Variables
The `.env` file contains all the necessary environment variables for configuring the application. Refer to `.env.example` for a complete list.

## 🤝 Contributing

We welcome contributions from the community! To contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them with a descriptive message.
4. Push your changes to your forked repository.
5. Open a pull request and describe the changes you've made.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## 🙋‍♂️ Support

If you have any questions, issues, or feature requests, please open an issue on GitHub. We'll do our best to respond as quickly as possible.
