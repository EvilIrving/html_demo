class Watch {
  constructor(selector) {
    this.canvas = document.getElementById(selector);
    this.ctx = canvas.getContext("2d");
    this.width = null;
    this.height = null;
  }

  init() {
    const canvas = this.canvas;
    const ctx = this.ctx;

    const dpi = window.devicePixelRatio;
    this.width = canvas.width * dpi;
    this.height = canvas.height * dpi;
    canvas.width = this.width;
    canvas.height = this.height;
    ctx.scale(dpi, dpi);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
  }

  drawWatch() {
    // 计算当前时间
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    // 画表盘
    ctx.save();
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(150, 0);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  animate() {
    this.drawWatch();
    window.requestAnimationFrame(animate);
  }
}

const watch = new Watch("watch-container");
watch.init();
watch.animate();
