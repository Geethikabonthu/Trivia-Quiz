const API_URL = "https://the-trivia-api.com/v2/questions";

const categories = [
  "science",
  "history",
  "geography",
  "music",
  "sport_and_leisure",
  "film_and_tv"
];

const gameState = {
  players: [],
  scores: [0, 0],
  round: 1,
  usedCategories: [],
  questions: [],
  currentQuestionIndex: 0
};

/* ---------- Screen Management ---------- */
const screens = {
  player: document.getElementById("screen-player"),
  category: document.getElementById("screen-category"),
  question: document.getElementById("screen-question"),
  summary: document.getElementById("screen-summary"),
  final: document.getElementById("screen-final")
};

function showScreen(screen) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

/* ---------- SCREEN 1: PLAYER SETUP ---------- */
document.getElementById("startGame").onclick = () => {
  const p1 = document.getElementById("player1").value.trim();
  const p2 = document.getElementById("player2").value.trim();

  if (!p1 || !p2 || p1 === p2) {
    alert("Enter two unique player names");
    return;
  }

  gameState.players = [p1, p2];
  showCategoryScreen();
};

/* ---------- SCREEN 2: CATEGORY SELECTION ---------- */
function showCategoryScreen() {
  showScreen(screens.category);
  document.getElementById("roundText").innerText = `Round ${gameState.round}`;

  const select = document.getElementById("categorySelect");
  select.innerHTML = "";

  categories
    .filter(cat => !gameState.usedCategories.includes(cat))
    .forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat.replace(/_/g, " ").toUpperCase();
      select.appendChild(option);
    });
}

document.getElementById("startRound").onclick = async () => {
  const category = document.getElementById("categorySelect").value;
  gameState.usedCategories.push(category);
  
  // Show loading state
  document.getElementById("startRound").innerText = "Loading Questions...";
  gameState.questions = await fetchQuestions(category);
  document.getElementById("startRound").innerText = "Start Round";
  
  gameState.currentQuestionIndex = 0;
  showQuestion();
};

/* ---------- API FETCH (Strict Order: Easy, Medium, Hard) ---------- */
async function fetchQuestions(category) {
  const difficulties = ["easy", "medium", "hard"];
  let orderedQuestions = [];

  for (let diff of difficulties) {
    try {
      const res = await fetch(
        `${API_URL}?categories=${category}&difficulties=${diff}&limit=2`
      );
      const data = await res.json();
      // Push both questions for this difficulty (One for Player 1, one for Player 2)
      orderedQuestions.push(...data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }
  return orderedQuestions;
}

/* ---------- SCREEN 3: QUESTION GAMEPLAY ---------- */
function showQuestion() {
  showScreen(screens.question);

  const q = gameState.questions[gameState.currentQuestionIndex];
  // Logic: 0,2,4 = Player 1 | 1,3,5 = Player 2
  const turn = gameState.currentQuestionIndex % 2;

  document.getElementById("info").innerHTML = `
    <strong>Round ${gameState.round}</strong> | Category: ${q.category.toUpperCase()}<br>
    Difficulty: <span style="color: gold">${q.difficulty.toUpperCase()}</span><br>
    Turn: <span style="text-decoration: underline">${gameState.players[turn]}</span>
  `;

  document.getElementById("scores").innerText =
    `${gameState.players[0]}: ${gameState.scores[0]} | ${gameState.players[1]}: ${gameState.scores[1]}`;

  document.getElementById("questionText").innerText = q.question.text;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  const options = [q.correctAnswer, ...q.incorrectAnswers]
    .sort(() => Math.random() - 0.5);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;
    btn.onclick = () => handleAnswer(btn, q.correctAnswer, q.difficulty, turn);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("nextBtn").disabled = true;
}

function handleAnswer(btn, correct, difficulty, turn) {
  document.querySelectorAll("#options button").forEach(b => {
    b.disabled = true;
    if (b.innerText === correct) b.style.backgroundColor = "lightgreen";
  });

  if (btn.innerText === correct) {
    const points = { easy: 10, medium: 15, hard: 20 };
    gameState.scores[turn] += points[difficulty];
  } else {
    btn.style.backgroundColor = "salmon";
  }

  document.getElementById("nextBtn").disabled = false;
}

/* ---------- NEXT BUTTON ---------- */
document.getElementById("nextBtn").onclick = () => {
  gameState.currentQuestionIndex++;

  if (gameState.currentQuestionIndex < 6) {
    showQuestion();
  } else {
    showRoundSummary();
  }
};

/* ---------- SCREEN 4: ROUND SUMMARY ---------- */
function showRoundSummary() {
  showScreen(screens.summary);
  const isGameOver = gameState.usedCategories.length === categories.length;
  
  document.getElementById("nextRound").disabled = isGameOver;
  if (isGameOver) {
      document.getElementById("nextRound").innerText = "All Categories Used";
  }
}

document.getElementById("nextRound").onclick = () => {
  gameState.round++;
  showCategoryScreen();
};

document.getElementById("endGame").onclick = () => {
  showFinal();
};

/* ---------- SCREEN 5: FINAL RESULT ---------- */
function showFinal() {
  showScreen(screens.final);

  const [p1, p2] = gameState.players;
  const [s1, s2] = gameState.scores;

  let result = `<h3>Final Standings</h3>
                ${p1}: ${s1}<br>${p2}: ${s2}<br><br>`;

  if (s1 > s2) result += `<strong>${p1} Wins 🎉</strong>`;
  else if (s2 > s1) result += `<strong>${p2} Wins 🎉</strong>`;
  else result += "<strong>It's a Draw 🤝</strong>";

  document.getElementById("finalResult").innerHTML = result;
}

/* ---------- NEW GAME RESET ---------- */
document.getElementById("newGame").onclick = () => {
  gameState.scores = [0, 0];
  gameState.round = 1;
  gameState.usedCategories = [];
  gameState.questions = [];
  gameState.currentQuestionIndex = 0;

  document.getElementById("player1").value = "";
  document.getElementById("player2").value = "";

  showScreen(screens.player);
};