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
let peer;
let connection;
let roomCode;
let playerRole;
let playerAnswer;
let otherPlayerAnswer;

// DOM Elements
const roomSetup = document.getElementById('roomSetup');
const gameContainer = document.getElementById('gameContainer');
const createRoomBtn = document.getElementById('createRoomBtn');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const roomCodeInput = document.getElementById('roomCode');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const playerRoleDisplay = document.getElementById('playerRole');
const questionText = document.getElementById('questionText');
const playerAnswerInput = document.getElementById('playerAnswer');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const resultsContainer = document.getElementById('resultsContainer');
const finalResults = document.getElementById('finalResults');
const progressBar = document.querySelector('.progress-bar');
const currentQuestionSpan = document.getElementById('currentQuestion');
const totalQuestionsSpan = document.getElementById('totalQuestions');

// Initialize PeerJS
function initPeer() {
    peer = new Peer();
    
    peer.on('open', (id) => {
        console.log('My peer ID is:', id);
    });

    peer.on('connection', (conn) => {
        connection = conn;
        playerRole = 'Player 1';
        playerRoleDisplay.textContent = playerRole;
        setupConnection();
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        alert('Connection error. Please try again.');
    });
}

// Setup connection event handlers
function setupConnection() {
    connection.on('open', () => {
        console.log('Connection established');
        showGame();
        if (playerRole === 'Player 1') {
            initGame();
        }
    });

    connection.on('data', (data) => {
        handleIncomingData(data);
    });

    connection.on('close', () => {
        alert('Other player disconnected. Game over.');
        location.reload();
    });
}

// Handle incoming data from other player
function handleIncomingData(data) {
    switch (data.type) {
        case 'answer':
            otherPlayerAnswer = data.answer;
            if (playerAnswer) {
                showResults();
            }
            break;
        case 'nextQuestion':
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                showQuestion();
                updateProgress();
            } else {
                showFinalResults();
            }
            break;
        case 'restart':
            currentQuestionIndex = 0;
            scores = [];
            initGame();
            break;
    }
}

// Create a new room
function createRoom() {
    initPeer();
    roomCode = peer.id;
    roomCodeDisplay.textContent = roomCode;
    playerRole = 'Player 1';
    playerRoleDisplay.textContent = playerRole;
}

// Join an existing room
function joinRoom() {
    const code = roomCodeInput.value;
    if (code.length === 6) {
        initPeer();
        roomCode = code;
        roomCodeDisplay.textContent = code;
        playerRole = 'Player 2';
        playerRoleDisplay.textContent = playerRole;
        
        connection = peer.connect(code);
        setupConnection();
    } else {
        alert('Please enter a valid 6-character room code');
    }
}

// Show game interface
function showGame() {
    roomSetup.classList.add('hidden');
    gameContainer.classList.remove('hidden');
}

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
    playerAnswerInput.value = '';
    playerAnswer = null;
    otherPlayerAnswer = null;
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

// Submit answer
function submitAnswer() {
    const answer = playerAnswerInput.value;
    
    if (!answer) {
        alert('Please enter your answer!');
        return;
    }

    playerAnswer = answer;
    connection.send({
        type: 'answer',
        answer: answer
    });

    if (otherPlayerAnswer) {
        showResults();
    }
}

// Show results for current question
function showResults() {
    const similarity = calculateSimilarity(playerAnswer, otherPlayerAnswer);
    scores.push(similarity);

    document.getElementById('player1Result').textContent = playerRole === 'Player 1' ? playerAnswer : otherPlayerAnswer;
    document.getElementById('player2Result').textContent = playerRole === 'Player 2' ? playerAnswer : otherPlayerAnswer;
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
createRoomBtn.addEventListener('click', createRoom);
joinRoomBtn.addEventListener('click', joinRoom);
submitBtn.addEventListener('click', submitAnswer);
nextBtn.addEventListener('click', () => {
    connection.send({ type: 'nextQuestion' });
});
restartBtn.addEventListener('click', () => {
    connection.send({ type: 'restart' });
}); 