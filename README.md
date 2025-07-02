Psychometric Assessment Web App
## ✨ Features

* **Secure User Authentication:**
    * Sleek, eye-catchy signup and login pages.
    * Passwords are securely hashed using `bcrypt` before being stored.
    * Session management is handled with JSON Web Tokens (JWT).
    * Specific error messages for incorrect passwords, existing emails, or existing usernames.
* **Interactive Test Experience:**
    * A multi-question assessment to determine user traits.
    * Engaging UI with icons, hover effects, and smooth animations.
    * A progress bar to show completion status.
    * Ability to go back to the previous question using a "Back" button or the `Backspace` key.
* **Dynamic Question Management:**
    * Admins can easily update the entire question set by uploading a simple CSV file.
    * A sample CSV file can be downloaded directly from the admin panel.
    * The backend validates the CSV to prevent data corruption.
* **Visualized Results:**
    * Test results are displayed instantly upon completion.
    * A dynamic radar chart (using Chart.js) provides a visual breakdown of the user's scores.
    * A clear interpretation of the user's dominant trait is provided.
* **Persistent Sessions:**
    * The application remembers user sessions, so you remain logged in even after reloading the page.
    * Test results are also saved, allowing you to view them again after a refresh.

## 🛠️ Tech Stack

* **Frontend:**
    * HTML5
    * Tailwind CSS (for styling)
    * Vanilla JavaScript (for all client-side logic)
    * Chart.js (for results visualization)
* **Backend:**
    * Node.js
    * Express.js (for the server and API routing)
    * `bcrypt` (for password hashing)
    * `jsonwebtoken` (for session management)
    * `multer` (for handling file uploads)
    * `csv-parser` (for processing CSV files)


      
## 🚀 Getting Started

Follow these steps to get the application running on your local machine.

### Prerequisites

* Node.js and npm (Node Package Manager) installed on your computer.

### Installation & Setup

1.  **Clone the repository** or download and extract the project files into a folder named `psychometric-app`.

2.  **Open a terminal** in the `psychometric-app` directory.

3.  **Install dependencies** by running the following command:
    ```bash
    npm install
    ```

4.  **Create the necessary data files.** Inside the `data` folder, create two empty files:
    * `users.json` (add `[]` to the file)
    * `results.json` (add `[]` to the file)
    * The `questions.json` and `interpretations.json` files will be created or updated as needed.

5.  **Start the server:**
    ```bash
    npm start
    ```
    You should see a confirmation message in the terminal: `✅ Server is running on http://localhost:3000`

6.  **Open the application:** Open your web browser and navigate to `http://localhost:3000`.

## Usage

* **Taking the Test:**
    1.  Create a new account or log in with an existing one.
    2.  From the dashboard, click "Start Test".
    3.  Answer the questions. You can use the "Back" button to change a previous answer.
    4.  View your results on the final page.

* **Admin - Updating Questions:**
    1.  Log in to the application.
    2.  On the dashboard, you will see the "Admin Panel".
    3.  Click "Download Sample CSV" to get the correct file format.
    4.  Edit the CSV to add, remove, or change questions.
    5.  Click "Choose File", select your updated CSV, and click "Upload CSV".
    6.  The test will now use your new set of questions.
