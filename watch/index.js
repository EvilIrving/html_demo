let canvas = document.getElementById("watch-container");
let ctx = canvas.getContext("2d");
function animate() {
  const now = new Date();
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  ctx.save();
  ctx.clearRect(0, 0, 500, 500);
  ctx.translate(250, 250);
  ctx.rotate(-Math.PI / 2);

  //   画 小时刻度
  ctx.storkeStyle = "black";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.save();
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(120, 0);
    ctx.stroke();
  }

  ctx.restore();
  ctx.save();

  // 画 分钟刻度
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  for (let i = 0; i < 60; i++) {
    // if (i % 5 === 0) return;
    ctx.rotate(Math.PI / 30);
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(130, 0);
    ctx.stroke();
  }
  ctx.restore();

  //   画时针 分针 秒针
  ctx.save();
  //   计算时针旋转角度
  const hDeg =
    h * (Math.PI / 6) + m * (Math.PI / 6 / 60) + s * (Math.PI / 60 / 60 / 6);
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.rotate(hDeg);
  ctx.moveTo(-20, 0);
  ctx.lineTo(100, 0);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const mDeg = m * (Math.PI / 60) + s * (Math.PI / 60 / 6);
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.strokeStyle = "green";
  ctx.beginPath();
  ctx.rotate(mDeg);
  ctx.moveTo(-20, 0);
  ctx.lineTo(100, 0);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  const sDeg = s * (Math.PI / 60);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "blue";
  ctx.beginPath();
  ctx.rotate(sDeg);
  ctx.moveTo(-20, 0);
  ctx.lineTo(100, 0);
  ctx.stroke();
  ctx.restore();

  //   中心圆
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.restore();
  ctx.restore();
  window.requestAnimationFrame(animate);
}
function init() {
  // 解决retina screen
  const dpi = window.devicePixelRatio;
  canvas.width = 500 * dpi;
  canvas.height = 500 * dpi;
  ctx.scale(dpi, dpi);
}
init();
window.requestAnimationFrame(animate);
