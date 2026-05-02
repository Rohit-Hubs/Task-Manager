# 🚀 Team Task Manager (TTM)

A professional, full-stack task management and collaboration platform designed for modern teams. Built with a focus on security, performance, and a premium user experience.

---

## ✨ Features

- **📊 Dynamic Dashboard**: Real-time analytics, performance tracking, and activity feeds.
- **📂 Project Management**: Organize tasks into dedicated projects with automatic progress tracking.
- **✅ Task Tracking**: Create, assign, and monitor tasks with status cycling (Pending → Active → Done).
- **🛡️ Secure Auth & RBAC**: Role-Based Access Control (Admin vs. Member) with secure JWT authentication.
- **👥 Team Directory**: Manage your workspace members and view their roles and contact details.
- **🎨 Premium UI**: A stunning dark-mode interface with glassmorphism, smooth animations, and zero emojis.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Icons, CSS Variables (Design System).
- **Backend**: Django 4.2+, Django REST Framework (DRF), SimpleJWT.
- **Database**: SQLite3 (Simple, file-based, no setup required).

---

## 🚀 Getting Started (Beginner Friendly)

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

---

### 2. Backend Setup (Django)

1. **Navigate to the backend folder**:
   ```bash
   cd backend/taskmanager
   ```

2. **Create a virtual environment** (Optional but recommended):
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - **Windows**: `venv\Scripts\activate`
   - **Mac/Linux**: `source venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

6. **Start the backend server**:
   ```bash
   python manage.py runserver
   ```
   *The backend will be running at `http://127.0.0.1:8000/`*

---

### 3. Frontend Setup (React)

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:5173/`*

---

## 📖 How to Use

1. **Sign Up**: Create a new account. You can choose to be an **Administrator** or a **Member**.
2. **Dashboard**: View your team's overall progress and recent activity.
3. **Projects**: (Admins only) Create a new project folder. Click on any project card to see its detailed task list.
4. **Tasks**: Create new tasks, set priorities, and assign them to team members. Click the status icon (Clock/Refresh/Check) to move the task through its lifecycle.
5. **Team**: See everyone who is part of your workspace.

---

## 📁 Project Structure

```text
Task-Manager/
├── backend/            # Django REST API
│   ├── taskmanager/    # Main settings & URLS
│   └── api/            # App logic (Models, Views, Serializers)
├── frontend/           # React + Vite Frontend
│   ├── src/
│   │   ├── components/ # UI Pages and Components
│   │   ├── api.js      # Backend communication logic
│   │   └── index.css   # Global Design System
│   └── public/         # Assets & Favicons
└── README.md           # This file!
```

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

Developed with ❤️ for recruiters and developers.