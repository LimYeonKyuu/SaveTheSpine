const skeleton = [
  [5, 6], // 오른쪽 어깨에서 왼쪽 어깨
  [5, 7], // 오른쪽 어깨에서 오른쪽 팔꿈치
  [7, 9], // 오른쪽 팔꿈치에서 오른쪽 손목
  [6, 8], // 왼쪽 어깨에서 왼쪽 팔꿈치
  [8, 10], // 왼쪽 팔꿈치에서 왼쪽 손목
  //   [5, 11], // 오른쪽 어깨에서 오른쪽 엉덩이
  //   [6, 12], // 왼쪽 어깨에서 왼쪽 엉덩이
  //   [11, 12], // 오른쪽 엉덩이에서 왼쪽 엉덩이
  //   [11, 13], // 오른쪽 엉덩이에서 오른쪽 무릎
  //   [13, 15], // 오른쪽 무릎에서 오른쪽 발목
  //   [12, 14], // 왼쪽 엉덩이에서 왼쪽 무릎
  //   [14, 16], // 왼쪽 무릎에서 왼쪽 발목
];

async function setupCamera() {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      const canvas = document.getElementById("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve(video);
    };
  });
}

async function loadPoseNet() {
  const net = await posenet.load();
  return net;
}

function drawCircle(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
}

function checkPose(pose) {
  const nose = pose.keypoints[0];
  const leftWrist = pose.keypoints[9];
  const rightWrist = pose.keypoints[10];
  const leftHeight=nose.position.y-leftWrist.position.y;
  const rightHeight=nose.position.y-rightWrist.position.y;
  const rightWidth=nose.position.x-rightWrist.position.x;
  const leftWidth=nose.position.x-leftWrist.position.x;
  console.log(rightWidth,' ,', leftWidth);
  return  (leftHeight>100) && (rightHeight>100) && (Math.abs(rightWidth-95)<40) && (Math.abs(leftWidth)<40);
}

async function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const successMessage = document.createElement("div");
  successMessage.innerText = "7초간 더 유지하세요.";
  successMessage.style.position = "absolute";
  successMessage.style.top = "20px";
  successMessage.style.left = "20px";
  successMessage.style.color = "#2ecc71"; // Bright green color
  successMessage.style.fontFamily = "Arial, sans-serif"; // Clean and readable font
  successMessage.style.fontSize = "36px"; // Larger font size
  successMessage.style.display = "none";
  document.body.appendChild(successMessage);

  let successFlag = false;
  let failedCount=0;
  let successTimeout = null;
  let startTime = Date.now();
  let countdownInterval = null;

  function handleSuccess() {
    successMessage.style.display = "block";

    countdownInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      successMessage.innerText = `7초간 더 유지하세요. (${7 - elapsed})`;

      if (elapsed >= 7) {
        clearInterval(countdownInterval);
        window.location.href = "../pose5/pose.html";
      }
    }, 1000);
  }

  function resetTimer() {
    clearInterval(countdownInterval);
    successMessage.style.display = "none";
    successFlag = false;
    startTime = Date.now();
  }

  function poseDetectionFrame() {
    net
      .estimateSinglePose(video, {
        flipHorizontal: false,
      })
      .then((pose) => {
        drawPose(pose);
        if (!checkPose(pose)) {
          failedCount++;
        } else{
          failedCount=0;
          successFlag=true;
        }
        if (failedCount>30){
          resetTimer();
        }
        if(successFlag){
          handleSuccess();
        }
        requestAnimationFrame(poseDetectionFrame);
      });
  }
  poseDetectionFrame();
}


function drawPose(pose) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pose.keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });

  skeleton.forEach(([i, j]) => {
    const startPoint = pose.keypoints[i];
    const endPoint = pose.keypoints[j];
    if (startPoint.score > 0.5 && endPoint.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startPoint.position.x, startPoint.position.y);
      ctx.lineTo(endPoint.position.x, endPoint.position.y);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

async function main() {
  const video = await setupCamera();
  video.play();
  const net = await loadPoseNet();
  detectPoseInRealTime(video, net);
}

main();