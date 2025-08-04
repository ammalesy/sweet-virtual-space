# Co-KPlus React Web Application

A modern React web application built with Vite, Tailwind CSS, and React Router.

## Features

- **React 19** - Latest React version with modern features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **React Router** - Client-side routing for single-page application
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Navigation Menu** - Clean navigation between Channel and About Us pages

## Pages

- **Channel** - Display available channels with interactive cards
- **About Us** - Company information, team, and contact section

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── Navbar.jsx          # Navigation component
├── pages/
│   ├── Channel.jsx         # Channel page
│   └── AboutUs.jsx         # About Us page
├── App.jsx                 # Main app component with routing
├── main.jsx               # React entry point
└── index.css              # Tailwind CSS imports
```

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - CSS framework
- **React Router DOM** - Routing library
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request