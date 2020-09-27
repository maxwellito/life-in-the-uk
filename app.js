const progress = document.getElementById("progress");
const intro = document.getElementById("intro");
const quiz = document.getElementById("quiz");
const form = document.getElementById("form");
const summary = document.getElementById("summary");
const summaryCircle = document.getElementById("summary-circle");
const summaryResult = document.getElementById("summary-result");

let questionStore = new Map();
let questionKeys = [];
let currentScreen;
let quizQuestions;
let quizIndex = 0;
let quizGoodAnswers = 0;
let currentQuestion;

 showScreen=(screen)=> {
  if (currentScreen) {
    currentScreen.style.display = "none";
  }
  currentScreen = screen;
  currentScreen.style.display = "inherit";
}

 startGame=(badOnes)=> {
  const picked = getQuestionSet(badOnes);
  quizIndex = 0;
  quizGoodAnswers = 0;
  quizQuestions = picked;
  showScreen(quiz);
  progress.style.width = 0;
  renderQuestion();
}

 getQuestionSet=(badOnes)=> {
  const maxIndex = questionStore.size;
  const arrLength = 24;

  if (badOnes) {
    return Array.from(questionStore.values())
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 200)
      .sort(() => Math.random() - 0.5)
      .slice(0, 24);
  } else {
    const output = [];
    while (output.length < arrLength) {
      const i = Math.floor(Math.random() * maxIndex);
      const question = questionStore.get(questionKeys[i]);
      if (!output.includes(question)) {
        output.push(question);
      }
    }
    return output;
  }
}

 renderQuestion=()=> {
  const q = (currentQuestion = quizQuestions[quizIndex]);
  const pick =
    q.answers.length > 1 ? `data-info="Pick ${q.answers.length}"` : "";
  const tip = q.tip
    ? `<p class="tip">${q.tip.split("\n").join("<br/>")}</p>`
    : "";
  const ans = q.options
    .map((o, i) => [o, q.answers.includes(i)])
    .map(
      ([a, isGood]) => `<label class="${isGood ? "good" : "bad"}">
              <input type="checkbox" value="${a}" onchange="inputChange(event)" class="${
        isGood ? "good" : "bad"
      }"/>
              <span>${a}</span>
            </label>`
    );

  form.innerHTML = `
          <p ${pick}>${q.question}</p>
          ${ans.join("")}
          ${tip}
        `;
}

 inputChange=(event)=> {
  if (!currentQuestion) {
    event.currentTarget.checked = !event.currentTarget.checked;
    return false;
  }
  let checked = 0;
  let isRight = true;
  let inputs = Array.from(form.querySelectorAll("input"));
  inputs.forEach((x) => {
    if (x.checked) {
      checked++;
    }
    isRight =
      isRight &&
      ((x.checked && x.className === "good") ||
        (!x.checked && x.className === "bad"));
  });
  if (checked === currentQuestion.answers.length) {
    complete(isRight);
  }
}

 nextQuestion=()=> {
  form.classList.remove("reveal");
  quizIndex++;
  if (quizIndex === 24) {
    endGame();
  } else {
    renderQuestion();
  }
}

 complete=(wasGood)=> {
  if (wasGood) {
    quizGoodAnswers++;
    currentQuestion.rank++;
  } else {
    currentQuestion.rank--;
  }
  localStorage.setItem(currentQuestion.id, currentQuestion.rank);
  currentQuestion = null;
  form.classList.add("reveal");
  progress.style.width = `${((quizIndex + 1) / 24) * 100}%`;
}

 endGame=()=> {
  showScreen(summary);
  setTimeout(() => {
    summaryCircle.style.strokeDashoffset = (1 - quizGoodAnswers / 24) * 289;
    summaryCircle.style.stroke = quizGoodAnswers >= 18 ? "green" : "red";
  }, 10);
  summaryResult.innerText = quizGoodAnswers;
  summary.className = "";
  summary.classList.add(quizGoodAnswers >= 18 ? "success" : "fail");
}

 retry=(badOnes)=> {
  summaryCircle.style.strokeDashoffset = 289;
  summaryCircle.style.stroke = "#eee";
  startGame(badOnes);
}

// Start
showScreen(intro);
fetch("./questions_base.json")
  .then((e) => e.json())
  .then((data) => {
    data.forEach((q) =>
      questionStore.set(q.id, {
        ...q,
        rank: parseInt(localStorage[q.id] || "0", 10),
      })
    );
    questionKeys = Array.from(questionStore.keys());
    intro.querySelector(".actions").classList.remove("hide");
  });
