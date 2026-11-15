# School Results Management System

A full school results system for managing students, classes, academic results, and performance reports.

## Features
- Admin authentication
- Role-based access for admin/teacher workflow
- Student registration and class assignment
- Score entry by subject, assessment, and term
- Dashboard summary cards and analytics
- Class and subject performance reports
- SQLite persistence for local development

## Default login
- Email: admin@greenwoodhigh.edu
- Password: admin123

## Setup
1. Install dependencies:
   npm install
2. Start the server:
   npm start
3. Open the app in your browser:
   http://localhost:3000/login

## Project structure
- `server.js` – Express app and database setup
- `views/` – EJS pages for login, dashboard, student, results, and reports
- `school.db` – SQLite database created at runtime
- `index.html` and `styles.css` – starter UI retained for preview
