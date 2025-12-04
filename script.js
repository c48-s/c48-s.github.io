
let startTime;
let timerInterval;
let running = false;
let elapsedTime = 0;

const timeDisplay = document.getElementById('timeDisplay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const resetButton = document.getElementById('resetButton');

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    String(hours).padStart(2, '0') + ':' +
    String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0')
  );
}

function startTimer() {
  if (!running) {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTime, 1000); // Update every second
    running = true;
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  running = false;
}

function resetTimer() {
  clearInterval(timerInterval);
  running = false;
  elapsedTime = 0;
  timeDisplay.textContent = formatTime(elapsedTime);
}

function updateTime() {
  elapsedTime = Date.now() - startTime;
  timeDisplay.textContent = formatTime(elapsedTime);
}

startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);
resetButton.addEventListener('click', resetTimer);
