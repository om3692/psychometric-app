document.addEventListener('DOMContentLoaded', () => {

    const state = {
        token: null,
        username: null,
        questions: [],
        interpretations: {},
        currentQuestionIndex: 0,
        userAnswers: {},
        answerHistory: [], // To track the sequence of answers for the back button
        chartInstance: null
    };

    const API_URL = 'http://localhost:3000/api';

    // --- DOM Elements ---
    const sections = document.querySelectorAll('.section');
    const logoutButton = document.getElementById('logoutButton');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const uploadForm = document.getElementById('uploadForm');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const startTestButton = document.getElementById('startTestButton');
    const retakeTestButton = document.getElementById('retakeTestButton');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const customAlert = document.getElementById('customAlert');
    const downloadCsvButton = document.getElementById('downloadCsvButton');
    const loader = document.getElementById('loader');
    const testContent = document.getElementById('testContent');
    const questionContainer = document.getElementById('questionContainer');
    const backButton = document.getElementById('backButton');
    const resultsChartContainer = document.querySelector('#resultsSection .max-w-2xl');
    const interpretationContainer = document.getElementById('interpretation');

    // --- UI & Navigation ---
    function showSection(sectionId, fromPopState = false) {
        sections.forEach(section => section.classList.toggle('active', section.id === sectionId));
        
        const isAuthSection = ['loginSection', 'signupSection'].includes(sectionId);
        const appHeader = document.getElementById('appHeader');
        const appFooter = document.getElementById('appFooter');
        if(appHeader) appHeader.classList.toggle('hidden', isAuthSection);
        if(appFooter) appFooter.classList.toggle('hidden', isAuthSection);


        if (!fromPopState) {
            if (window.location.hash !== `#${sectionId}`) {
                history.pushState({ sectionId }, '', `#${sectionId}`);
            }
        }
    }

    function showAlert(message, type = 'error') {
        if (!customAlert) return;
        customAlert.textContent = message;
        customAlert.className = `custom-alert ${type} show`;
        setTimeout(() => customAlert.classList.remove('show'), 3000);
    }

    // --- API Requests ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            if (response.status === 204 || response.headers.get('content-length') === '0') return null;
            return await response.json();
        } catch (error) {
            showAlert(error.message);
            throw error;
        }
    }

    async function apiRequestFormData(endpoint, method = 'POST', formData) {
        const headers = {};
        if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
        const config = { method, headers, body: formData };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            showAlert(error.message);
            throw error;
        }
    }

    // --- Event Listeners ---
    if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); showSection('signupSection'); });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showSection('loginSection'); });
    if (startTestButton) startTestButton.addEventListener('click', startTest);
    if (retakeTestButton) retakeTestButton.addEventListener('click', startTest);

    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = { email: loginForm.loginEmail.value, password: loginForm.loginPassword.value };
            const data = await apiRequest('/auth/login', 'POST', body);
            
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);

            state.token = data.token;
            state.username = data.username;
            
            if (usernameDisplay) usernameDisplay.textContent = state.username;
            loginForm.reset();
            showSection('dashboardSection');
        } catch (error) { /* Handled by apiRequest */ }
    });

    if (signupForm) signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const body = { username: signupForm.signupUsername.value, email: signupForm.signupEmail.value, password: signupForm.signupPassword.value };
            await apiRequest('/auth/signup', 'POST', body);
            showAlert('Signup successful! Please log in.', 'success');
            signupForm.reset();
            showSection('loginSection');
        } catch (error) { /* Handled by apiRequest */ }
    });

    if (logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('lastUserAnswers');

        state.token = null;
        state.username = null;
        history.pushState({ sectionId: 'loginSection' }, '', '#loginSection');
        showSection('loginSection', true);
    });

    if (uploadForm) uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('questionsFile');
        if (!fileInput.files.length) {
            showAlert('Please select a CSV file to upload.');
            return;
        }
        const formData = new FormData();
        formData.append('questionsFile', fileInput.files[0]);
        try {
            const result = await apiRequestFormData('/test/upload-questions', 'POST', formData);
            showAlert(result.message, 'success');
            uploadForm.reset();
            state.questions = []; // Invalidate cache
        } catch (error) { /* Handled by apiRequest */ }
    });

    if (downloadCsvButton) downloadCsvButton.addEventListener('click', () => {
        const csvContent = `question,option1_text,option1_type,option2_text,option2_type,option3_text,option3_type,option4_text,option4_type
"When faced with a difficult problem, you prefer to:","Analyze it logically and systematically.","Analytical","Brainstorm creative and unconventional solutions.","Creative","Collaborate with others to find a solution.","Collaborative","Take immediate action and learn by doing.","Action-Oriented"
"In a social gathering, you are more likely to:","Engage in deep, one-on-one conversations.","Analytical","Be the life of the party, telling stories.","Creative","Introduce people and facilitate connections.","Collaborative","Organize an activity or a game.","Action-Oriented"
"Your ideal work environment is:","Quiet, organized, and focused on individual tasks.","Analytical","Dynamic, inspiring, and full of new ideas.","Creative","A supportive team where everyone helps each other.","Collaborative","Fast-paced, with clear goals and tangible results.","Action-Oriented"`;

        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "questions_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.sectionId) {
            showSection(e.state.sectionId, true);
        } else {
            initializeApp(true);
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && testContent && testContent.parentElement.classList.contains('active')) {
            e.preventDefault();
            goBackOneQuestion();
        }
    });

    if(backButton) backButton.addEventListener('click', goBackOneQuestion);

    // --- Test Logic ---
    function goBackOneQuestion() {
        if (state.currentQuestionIndex > 0) {
            state.currentQuestionIndex--;
            const lastAnswerType = state.answerHistory.pop();
            if (lastAnswerType && state.userAnswers[lastAnswerType]) {
                state.userAnswers[lastAnswerType]--;
            }
            displayQuestion();
        }
    }

    async function startTest() {
        localStorage.removeItem('lastUserAnswers');
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.answerHistory = [];
        showSection('testSection');
        if(loader) loader.classList.remove('hidden');
        if(testContent) testContent.classList.add('hidden');
        try {
            if (state.questions.length === 0) {
                state.questions = await apiRequest('/test/questions');
            }
            if (Object.keys(state.interpretations).length === 0) {
                state.interpretations = await apiRequest('/test/interpretations');
            }
            if(loader) loader.classList.add('hidden');
            if(testContent) testContent.classList.remove('hidden');
            displayQuestion();
        } catch (error) {
            if(loader) loader.classList.add('hidden');
            if(testContent) testContent.classList.remove('hidden');
            showSection('dashboardSection');
        }
    }

    function displayQuestion() {
        if(backButton) backButton.classList.toggle('hidden', state.currentQuestionIndex === 0);

        if (!state.questions || state.questions.length === 0) {
            if(document.getElementById('questionText')) document.getElementById('questionText').textContent = "No questions found. An admin needs to upload a question CSV file.";
            if(document.getElementById('optionsContainer')) document.getElementById('optionsContainer').innerHTML = '';
            return;
        }
        if (state.currentQuestionIndex >= state.questions.length) {
            showResults();
            return;
        }
        updateProgressBar();
        const questionData = state.questions[state.currentQuestionIndex];
        
        if(questionContainer) questionContainer.classList.remove('fade-in');

        if (!questionData || !questionData.question || !Array.isArray(questionData.options) || questionData.options.length === 0) {
            console.error('Malformed question data found! Skipping.', questionData);
            state.currentQuestionIndex++;
            setTimeout(displayQuestion, 100);
            return;
        }
        
        setTimeout(() => {
            if(document.getElementById('questionText')) document.getElementById('questionText').textContent = questionData.question;
            const optionsContainer = document.getElementById('optionsContainer');
            if(optionsContainer) optionsContainer.innerHTML = '';
            
            const icons = [
                `<svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>`,
                `<svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.443 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l.443 2.387a2 2 0 00.547 1.806a2 2 0 001.806.547l2.387-.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.443-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-.443-2.387a2 2 0 00-.547-1.806z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"></path></svg>`,
                `<svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`,
                `<svg class="option-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`
            ];

            questionData.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'w-full rounded-lg option-btn';
                button.innerHTML = `
                    ${icons[index % icons.length]}
                    <span class="flex-1 font-medium">${option.text}</span>
                `;
                button.onclick = (e) => {
                    document.querySelectorAll('.option-btn').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.remove('selected');
                    });
                    e.currentTarget.classList.add('selected');
                    
                    setTimeout(() => {
                        selectOption(option.type);
                    }, 400);
                };
                if(optionsContainer) optionsContainer.appendChild(button);
            });
            if(questionContainer) questionContainer.classList.add('fade-in');
        }, 100);
    }

    function selectOption(type) {
        state.userAnswers[type] = (state.userAnswers[type] || 0) + 1;
        state.answerHistory.push(type);
        state.currentQuestionIndex++;
        displayQuestion();
    }

    function updateProgressBar() {
        if (!state.questions || state.questions.length === 0) return;
        const progress = (state.currentQuestionIndex / state.questions.length) * 100;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        if(progressBar) progressBar.style.width = `${progress}%`;
        if(progressText) progressText.textContent = `${Math.round(progress)}%`;
    }

    // --- Results Logic ---
    async function showResults() {
        if (Object.keys(state.userAnswers).length > 0) {
            localStorage.setItem('lastUserAnswers', JSON.stringify(state.userAnswers));
        }

        showSection('resultsSection');
        updateProgressBar();
        try { await apiRequest('/test/submit', 'POST', { answers: state.userAnswers }); } catch (error) { console.error("Failed to submit results:", error); }

        const answersToDisplay = state.userAnswers;

        if (Object.keys(answersToDisplay).length === 0) {
            if(resultsChartContainer) resultsChartContainer.classList.add('hidden');
            if(interpretationContainer) interpretationContainer.innerHTML = `<h3 class="text-2xl font-semibold mb-2 text-red-600">No Results</h3><p class="text-gray-600">No answers were recorded. Please retake the test.</p>`;
            return;
        }

        if(resultsChartContainer) resultsChartContainer.classList.remove('hidden');
        if(interpretationContainer) interpretationContainer.innerHTML = `<h3 class="text-2xl font-semibold mb-2 text-[var(--brand-blue)]" id="dominantTrait"></h3><p id="interpretationText" class="text-gray-600 leading-relaxed"></p>`;

        let dominantTrait = '';
        let maxScore = -1;
        Object.entries(answersToDisplay).forEach(([trait, score]) => {
            if (score > maxScore) {
                maxScore = score;
                dominantTrait = trait;
            }
        });
        
        const dominantTraitEl = document.getElementById('dominantTrait');
        const interpretationTextEl = document.getElementById('interpretationText');

        if(dominantTraitEl) dominantTraitEl.textContent = `Your Dominant Trait: ${dominantTrait}`;
        if(interpretationTextEl) interpretationTextEl.textContent = state.interpretations[dominantTrait] || "Your results are being calculated.";
        
        const ctx = document.getElementById('resultsChart')?.getContext('2d');
        if (!ctx) return;

        if (state.chartInstance) state.chartInstance.destroy();
        state.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(answersToDisplay),
                datasets: [{
                    label: 'Your Traits',
                    data: Object.values(answersToDisplay),
                    backgroundColor: 'rgba(0, 51, 160, 0.2)',
                    borderColor: 'rgba(0, 51, 160, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(251, 191, 36, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(0, 51, 160, 1)'
                }]
            },
            options: {
                responsive: true,
                scales: { r: { 
                    suggestedMin: 0, 
                    suggestedMax: Math.max(...Object.values(answersToDisplay), 3),
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    angleLines: { color: 'rgba(0, 0, 0, 0.05)' },
                    pointLabels: { font: { size: 14, weight: '600' }, color: '#374151' }
                } },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Initial Load ---
    async function initializeApp(isPopState = false) {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');

        if (token && username) {
            state.token = token;
            state.username = username;
            if (usernameDisplay) usernameDisplay.textContent = state.username;
            
            const initialSection = window.location.hash.replace('#', '') || 'dashboardSection';
            const lastUserAnswers = localStorage.getItem('lastUserAnswers');

            if (initialSection === 'resultsSection' && lastUserAnswers) {
                state.userAnswers = JSON.parse(lastUserAnswers);
                if (Object.keys(state.interpretations).length === 0) {
                    try {
                        state.interpretations = await apiRequest('/test/interpretations');
                    } catch (e) { console.error(e) }
                }
                showResults();
            } else if (['loginSection', 'signupSection'].includes(initialSection)) {
                showSection('dashboardSection');
            }
            else {
                showSection(initialSection, true);
            }
        } else {
            const initialSection = window.location.hash.replace('#', '') === 'signupSection' ? 'signupSection' : 'loginSection';
            showSection(initialSection, true);
        }
    }

    initializeApp();
});
