






const targetDate = new Date("March 7, 2026 00:00:01").getTime(); // Set your target date and time

const countdown = setInterval(function() {
  const now = new Date().getTime();
  const distance = targetDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("days").innerHTML = days < 10 ? "0" + days : days;
  document.getElementById("hours").innerHTML = hours < 10 ? "0" + hours : hours;
  document.getElementById("minutes").innerHTML = minutes < 10 ? "0" + minutes : minutes;
  document.getElementById("seconds").innerHTML = seconds < 10 ? "0" + seconds : seconds;

  if (distance < 0) {
    clearInterval(countdown);
    document.getElementById("countdown-timer").innerHTML = "EXPIRED";
  }
}, 1000);
