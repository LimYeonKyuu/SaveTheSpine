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
  
  function calculateHeadAngle(pose) {
    const leftEye = pose.keypoints[1];
    const rightEye = pose.keypoints[2];
    const nose = pose.keypoints[0];

    let angle = Math.abs(Math.atan2(rightEye.position.y - leftEye.position.y, rightEye.position.x - leftEye.position.x) -
        Math.atan2(nose.position.y - leftEye.position.y, nose.position.x - leftEye.position.x));

    angle = (angle * 180) / Math.PI;

    if (angle > 180) {
        angle %= 360; // 360보다 큰 각도를 360으로 나눈 나머지를 취함
    }

    return angle;
}

function checkPose(pose) {
    const headAngle = calculateHeadAngle(pose);
    const nose = pose.keypoints[0];
    const leftWrist = pose.keypoints[10];

    console.log(headAngle);
    return (headAngle > 50) && (headAngle <60) && (leftWrist.position.y < nose.position.y);
}
  
async function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const successMessage = document.createElement("div");
  successMessage.innerText = "3초간 더 유지하세요.";
  successMessage.style.position = "absolute";
  successMessage.style.top = "20px";
  successMessage.style.left = "20px";
  successMessage.style.color = "green";
  successMessage.style.fontSize = "40px";
  successMessage.style.display = "none";
  document.body.appendChild(successMessage);

  let successFlag = false;
  let successTimeout = null;

  function handleSuccess() {
      successMessage.style.display = "block";
      // 3초 후에 이동
      successTimeout = setTimeout(() => {
          window.location.href = "../pose4/pose.html";
      }, 3000);
  }

  function poseDetectionFrame() {
      net
          .estimateSinglePose(video, {
              flipHorizontal: false,
          })
          .then((pose) => {
              drawPose(pose);
              if (!successFlag && checkPose(pose)) {
                  successFlag = true;
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