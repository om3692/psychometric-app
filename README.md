Psychometric App
A full-stack web application designed to administer and manage psychometric tests. The application supports user authentication with OTP, dynamic test-taking, and an admin panel for uploading questions and reviewing test attempts.

✨ Features
User Authentication: Secure user signup with email OTP verification and login system.
Admin Panel: Separate login for administrators to manage the application.
Dynamic Test Interface: A user-friendly interface for taking tests, with progress tracking and support for various question types (Likert, multiple-choice, ranking, etc.).
CSV Question Upload: Admins can easily create and upload new sets of questions using a CSV file.
Attempt Management: Admins can view a list of all test attempts, filter them by user or date, and export the filtered results to a CSV file.
🛠️ Tech Stack
Backend: Node.js, Express.js
Database: PostgreSQL
View Engine: EJS (Embedded JavaScript) with express-ejs-layouts for templating.
Authentication: bcryptjs for password hashing and express-session for managing user sessions.
File Uploads: multer for handling CSV uploads.
Email: nodemailer for sending OTP emails.
Development: nodemon for live-reloading the server during development.
🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
You need to have the following software installed on your machine:

Node.js (which includes npm)
PostgreSQL
Installation & Setup
Clone the repository

Bash

git clone <your-repository-url>
cd psychometric-app
Install NPM packages
This will install all the dependencies listed in package.json.

Bash

npm install
Set up the PostgreSQL Database

Open psql or your preferred PostgreSQL client.
Create a new database for the project.
SQL

CREATE DATABASE psychometric_db;
Set up the Database Tables

Connect to your new database (\c psychometric_db).
Run the complete SQL schema script provided previously to create all the necessary tables (users, admins, questionsets, questions, etc.).
Create Environment Variables File

In the root directory of the project, create a file named .env.
Copy the contents of the example below into your new .env file and replace the placeholder values with your actual credentials.
The application uses these variables to connect to the database and email service without hard-coding them in the code.
.env.example

# Server Port
PORT=3000

# PostgreSQL Database Connection
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=psychometric_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# Express Session
SESSION_SECRET=a_long_random_secret_string_for_sessions

# Nodemailer (Gmail) for sending OTPs
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password 
Note: For EMAIL_PASS, you need to generate an "App Password" from your Google Account settings if you have 2-Factor Authentication enabled. Your regular Gmail password will not work.

Running the Application
For Development (with auto-restart):

Bash

npm run dev
The server will start, and nodemon will watch for file changes.

For Production:

Bash

npm start
This runs the app with the standard node command.

The server will be running on http://localhost:3000.
