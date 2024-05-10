window.main = async function() {
    const container = document.getElementById("main-container");
    container.style.display = 'none'; // 메인 컨테이너 숨기기
    window.location.href = 'pose1/pose.html';
}


document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.querySelector('button');
    const minutesInput = document.getElementById('minutes-input');
    const secondsInput = document.getElementById('seconds-input');
    const minutesDisplay = document.getElementById('time-minutes');
    const secondsDisplay = document.getElementById('time-seconds');

    function startTimer() {
        const minutes = parseInt(minutesInput.value);
        const seconds = parseInt(secondsInput.value);
        let timeLeft = (isNaN(minutes) ? 0 : minutes * 60) + (isNaN(seconds) ? 0 : seconds);

        updateTimerDisplay(timeLeft);
        minutesInput.disabled = true;
        secondsInput.disabled = true;
        startButton.disabled = true;

        const timerInterval = setInterval(() => {
            timeLeft -= 1;
            updateTimerDisplay(timeLeft);

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                window.location.href = 'page.html'; // 타이머가 끝나면 page.html로 리디렉션
            }
        }, 1000);
    }

    function updateTimerDisplay(seconds) {
        const minutesPart = Math.floor(seconds / 60);
        const secondsPart = seconds % 60;
        minutesDisplay.textContent = minutesPart.toString().padStart(2, '0');
        secondsDisplay.textContent = secondsPart.toString().padStart(2, '0');
    }

    startButton.onclick = startTimer;
});
