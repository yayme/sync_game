// Game questions
const questions = [
    "Imagine a bird. What color is it?",
    "Where is the bird flying to?",
    "What's the weather like in your imagination?",
    "What kind of tree would you plant in your dream garden?",
    "If you could have any animal as a pet, what would it be?"
];

// Match messages based on score ranges
const matchMessages = {
    high: [
        "Perfect match! You're totally in sync! 💫",
        "Amazing connection! Your minds are aligned! ✨",
        "Incredible match! You think alike! 🌟"
    ],
    medium: [
        "Good match! You're on the same wavelength! 🌊",
        "Nice connection! You're getting closer! 💫",
        "Pretty good match! Keep going! ✨"
    ],
    low: [
        "Different perspectives! That's interesting! 🌈",
        "Unique answers! That's what makes it fun! 🎨",
        "Creative differences! Keep exploring! 🌟"
    ]
};

// Game state
let currentQuestionIndex = 0;
let scores = [];

// DOM Elements
const questionText = document.getElementById('questionText');
const player1Answer = document.getElementById('player1Answer');
const player2Answer = document.getElementById('player2Answer');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const resultsContainer = document.getElementById('resultsContainer');
const finalResults = document.getElementById('finalResults');
const progressBar = document.querySelector('.progress-bar');
const currentQuestionSpan = document.getElementById('currentQuestion');
const totalQuestionsSpan = document.getElementById('totalQuestions');

// Initialize game
function initGame() {
    totalQuestionsSpan.textContent = questions.length;
    updateProgress();
    showQuestion();
}

// Show current question
function showQuestion() {
    questionText.textContent = questions[currentQuestionIndex];
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    player1Answer.value = '';
    player2Answer.value = '';
    resultsContainer.classList.add('hidden');
    finalResults.classList.add('hidden');
}

// Update progress bar
function updateProgress() {
    const progress = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.setProperty('--progress', `${progress}%`);
    progressBar.style.width = `${progress}%`;
}

// Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1, str2) {
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();

    if (str1 === str2) return 100;
    if (str1.length === 0) return 0;
    if (str2.length === 0) return 0;

    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= str1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str2.length; j++) {
        matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    const maxLength = Math.max(str1.length, str2.length);
    const distance = matrix[str1.length][str2.length];
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.round(similarity);
}

// Get random message based on score
function getMatchMessage(score) {
    let category;
    if (score >= 80) category = 'high';
    else if (score >= 50) category = 'medium';
    else category = 'low';
    
    const messages = matchMessages[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

// Show results for current question
function showResults() {
    const answer1 = player1Answer.value;
    const answer2 = player2Answer.value;
    
    if (!answer1 || !answer2) {
        alert('Both players need to submit their answers!');
        return;
    }

    const similarity = calculateSimilarity(answer1, answer2);
    scores.push(similarity);

    document.getElementById('player1Result').textContent = answer1;
    document.getElementById('player2Result').textContent = answer2;
    document.getElementById('matchScore').textContent = similarity;
    document.getElementById('matchMessage').textContent = getMatchMessage(similarity);

    resultsContainer.classList.remove('hidden');
}

// Show final results
function showFinalResults() {
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    document.getElementById('finalScore').textContent = averageScore;
    document.getElementById('finalMessage').textContent = getMatchMessage(averageScore);
    finalResults.classList.remove('hidden');
}

// Event Listeners
submitBtn.addEventListener('click', () => {
    showResults();
});

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
        updateProgress();
    } else {
        showFinalResults();
    }
});

restartBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    scores = [];
    initGame();
});

// Initialize the game
initGame(); 