# CourseMix 📚

CourseMix is a modern web application that revolutionizes the course registration experience for university students. Built with cutting-edge technology, it offers a seamless interface for course selection, schedule planning, and academic profile management.

## ✨ Key Features

### 🔐 Authentication
- Secure login and registration
- Email verification system
- Role-based access control
- Protected routes and API endpoints

### 📋 Course Management
- Intuitive course search and selection
- Real-time availability tracking
- Smart schedule conflict detection
- Visual timetable planner
- Waitlist management
- Targeted course suggestions

### 👤 Student Profile
- Personalized dashboard
- Academic progress tracking
- Course history viewer
- Profile customization options

### 📊 Analytics
- Schedule optimization suggestions
- Projected Graduation Date
- Prerequisite tracking
- Degree progression tracker

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15.1
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Components:** Shadcn UI
- **Icons:** Lucide React

### Backend
- **API:** Next.js API Routes
- **Database:** Supabase
- **Email Service:** Resend
- **Authentication:** Supabase Auth

### Development
- **Linting:** ESLint
- **Styling:** PostCSS
- **Data Scripts:** Python 3.x

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Python 3.x

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/coursemix.git
cd coursemix
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

4. Start development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Available Scripts

- `npm run dev` - Development mode
- `npm run build` - Production build
- `npm start` - Production server
- `npm run lint` - Code linting

## 🚀 Deployment

1. Build the application
```bash
npm run build
```

2. Start production server
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- The open-source community for providing excellent tools and libraries
- Brock University <3
- All contributors who have helped improve CourseMix
