# AI DocuForge - AI Document Authoring Platform

A modern, production-ready React frontend for AI-assisted document creation and generation. Create professional Word documents and PowerPoint presentations with AI-powered content generation, refinement tools, and seamless export functionality.

![AI DocuForge](https://img.shields.io/badge/React-18.3-61dafb?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8?style=flat&logo=tailwind-css)

## ✨ Features

### Core Functionality
- 🔐 **Authentication** - Secure login/signup with mock mode for demo
- 📊 **Dashboard** - Beautiful project cards with quick actions
- 📝 **Project Creation Wizard** - Guided setup for Word/PowerPoint documents
- 🎨 **Three-Column Workspace**
  - Left: Document structure with drag-and-drop reordering
  - Center: Rich text editor (TipTap) with full formatting toolbar
  - Right: AI refinement tools and revision history
- 🤖 **AI Integration** - Content generation and refinement (mock mode included)
- 💾 **Export** - Download as .docx or .pptx files
- 📱 **Responsive Design** - Mobile-first, works beautifully on all devices

### AI Refinement Tools
- Quick preset actions (formalize, simplify, add bullets, etc.)
- Custom refinement prompts
- Like/Dislike feedback system
- Comment threads on sections
- Revision history with timestamps

### Design System
- **Accent Color**: Teal (#0ea5a4) for a fresh, professional look
- **Typography**: Inter font family for modern readability
- **Components**: Shadcn/ui with custom variants
- **Animations**: Smooth transitions and micro-interactions
- **Dark Mode**: Built-in theme switcher

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-docuforge

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Demo Mode
The application includes a **mock mode** for demonstration without a backend:
- Use any email/password to login
- Pre-loaded sample projects (EV Market Analysis, Product Launch)
- AI generation simulates real API responses
- All data stored in browser localStorage

## 🏗️ Tech Stack

### Frontend
- **React 18.3** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state & caching

### UI & Styling
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful, accessible components
- **Lucide React** - Modern icon library
- **TipTap** - Rich text editor
- **@hello-pangea/dnd** - Drag-and-drop functionality

### Development
- **ESLint** - Code linting
- **TypeScript strict mode** - Maximum type safety
- **Vite SWC** - Fast React refresh

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn components
│   ├── workspace/             # Workspace-specific components
│   │   ├── OutlinePanel.tsx   # Document structure sidebar
│   │   ├── EditorPanel.tsx    # Rich text editor
│   │   └── RefinementPanel.tsx # AI refinement tools
│   └── ProtectedRoute.tsx     # Auth guard
├── pages/
│   ├── Login.tsx              # Authentication
│   ├── Signup.tsx             # Registration
│   ├── Dashboard.tsx          # Project listing
│   ├── NewProject.tsx         # Project creation wizard
│   └── ProjectWorkspace.tsx   # Main editing workspace
├── stores/
│   ├── authStore.ts           # Authentication state
│   └── projectStore.ts        # Project/document state
├── lib/
│   ├── mockData.ts            # Demo data & presets
│   └── utils.ts               # Utility functions
├── App.tsx                    # Root component with routing
└── index.css                  # Design system & global styles
```

## 🎨 Design System

The application uses a comprehensive design system defined in `src/index.css` and `tailwind.config.ts`:

### Color Palette
```css
--primary: 180 92% 47%        /* Teal accent */
--primary-hover: 180 92% 42%  /* Darker teal */
--primary-light: 180 92% 95%  /* Light teal background */
--background: 0 0% 99%        /* Near-white */
--foreground: 220 15% 10%     /* Dark text */
--muted: 220 15% 96%          /* Muted backgrounds */
--accent: 180 80% 55%         /* Accent highlights */
```

### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Balanced, accessible sizing
- **Weights**: 300, 400, 500, 600, 700

### Animations
- Fade in/up for page transitions
- Hover lift effects on cards
- Smooth state transitions
- Loading spinners and progress indicators

## 🔌 API Integration

The frontend is designed to work with the following backend API contract:

### Authentication
```typescript
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

POST /api/auth/signup
Body: { name: string, email: string, password: string }
Response: { token: string, user: User }
```

### Projects
```typescript
GET /api/projects
Response: Project[]

POST /api/projects
Body: { title: string, docType: 'docx' | 'pptx', topic: string, scaffold: Section[] }
Response: { id: string, ...Project }

GET /api/projects/:id
Response: Project

POST /api/projects/:id/generate
Body: { sectionId: string }
Response: { content: string, metadata: object }

POST /api/projects/:id/refine
Body: { sectionId: string, prompt: string }
Response: { content: string }

POST /api/projects/:id/export
Body: { format: 'docx' | 'pptx', sections: string[], includeComments: boolean }
Response: Blob (file download)
```

### Connecting Real Backend
To connect to a real backend, update the API base URL:

1. Create `.env` file:
```env
VITE_API_BASE_URL=https://your-api.com
```

2. Implement API client in `src/lib/api.ts`
3. Replace mock calls in stores with real API calls

## 🧪 Testing

### Manual Testing
The app includes comprehensive mock mode for testing all features:
1. Login with any credentials
2. Explore pre-loaded projects
3. Create new documents (Word/PowerPoint)
4. Test AI generation and refinement
5. Export functionality

### E2E Testing (Recommended)
```bash
# Add Playwright for E2E tests
npm install -D @playwright/test

# Run tests
npm run test:e2e
```

### Unit Testing
```bash
# Add Jest + React Testing Library
npm install -D jest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The production build will be created in the `dist/` directory.

### Deploy Options
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag-and-drop `dist/` folder or connect repo
- **AWS S3 + CloudFront**: Upload `dist/` to S3 bucket
- **Docker**: Create Dockerfile with nginx

### Environment Variables
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENABLE_MOCK_MODE=false
```

## 📸 Screenshots & Demo

### Login/Signup
Clean authentication flow with elegant form design and gradient background.

### Dashboard
Project cards with hover effects, quick actions, and beautiful typography.

### Project Creation
Guided wizard with drag-and-drop section reordering and document type selection.

### Workspace
Three-column layout with outline panel, rich text editor, and refinement tools.

## 🎯 Roadmap

- [ ] Real-time collaboration (WebSocket)
- [ ] Template library for common documents
- [ ] AI cost tracking and usage analytics
- [ ] Advanced export options (PDF, Markdown)
- [ ] Keyboard shortcuts panel (Cmd+K)
- [ ] Version control with branching
- [ ] Team workspaces
- [ ] Mobile app (React Native)

## 📄 License

MIT License - feel free to use this project for any purpose.

## 👏 Acknowledgments

- Design inspired by Notion, Linear, and Figma
- Built with [Lovable](https://lovable.dev)
- Icons by [Lucide](https://lucide.dev)
- Components by [Shadcn/ui](https://ui.shadcn.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ using React + TypeScript + Tailwind CSS**
