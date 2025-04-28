class Watch {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // 默认配置
    this.config = {
      hourHandColor: options.hourHandColor || "black",
      minuteHandColor: options.minuteHandColor || "green",
      secondHandColor: options.secondHandColor || "blue",
      hourScaleColor: options.hourScaleColor || "black",
      minuteScaleColor: options.minuteScaleColor || "red",
      centerColor: options.centerColor || "red",
      hourHandLength: options.hourHandLength || 100,
      minuteHandLength: options.minuteHandLength || 100,
      secondHandLength: options.secondHandLength || 100,
      hourScaleLength: options.hourScaleLength || 20, // 140-120
      minuteScaleLength: options.minuteScaleLength || 10, // 140-130
      radius: options.radius || 140,
    };

    this.init();
    this.start();
  }

  init() {
    // 解决retina screen
    const dpi = window.devicePixelRatio;

    // 获取容器尺寸，使表盘填充满canvas
    const containerWidth = this.canvas.clientWidth;
    const containerHeight = this.canvas.clientHeight;

    this.canvas.width = containerWidth * dpi;
    this.canvas.height = containerHeight * dpi;

    // 设置画布尺寸
    this.width = containerWidth;
    this.height = containerHeight;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    // 计算半径以填充画布（取宽高中较小值的一半作为半径）
    const maxRadius = (Math.min(this.width, this.height) / 2) * 0.9; // 留出10%边距
    this.config.radius = maxRadius;

    // 根据半径调整指针和刻度长度
    this.config.hourHandLength = maxRadius * 0.6;
    this.config.minuteHandLength = maxRadius * 0.75;
    this.config.secondHandLength = maxRadius * 0.85;
    this.config.hourScaleLength = maxRadius * 0.15;
    this.config.minuteScaleLength = maxRadius * 0.07;

    this.ctx.scale(dpi, dpi);
  }

  drawHourScale() {
    const { radius, hourScaleColor, hourScaleLength } = this.config;

    this.ctx.strokeStyle = hourScaleColor;
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = "round";

    this.ctx.save();
    for (let i = 0; i < 12; i++) {
      this.ctx.rotate(Math.PI / 6);
      this.ctx.beginPath();
      this.ctx.moveTo(radius, 0);
      this.ctx.lineTo(radius - hourScaleLength, 0);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawOuterRing() {
    const { radius } = this.config;
    this.ctx.lineWidth = 5;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius / 0.95, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMinuteScale() {
    const { radius, minuteScaleColor, minuteScaleLength } = this.config;

    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = minuteScaleColor;

    this.ctx.save();
    // 从1开始，到60结束，这样可以避免第一个和最后一个位置的问题
    for (let i = 1; i <= 60; i++) {
      // 先旋转到正确位置
      this.ctx.rotate(Math.PI / 30);

      // 只在不是小时刻度的位置画分钟刻度
      // 小时刻度在 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 的位置
      if (i % 5 !== 0) {
        this.ctx.beginPath();
        this.ctx.moveTo(radius, 0);
        this.ctx.lineTo(radius - minuteScaleLength, 0);
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  drawHourHand(h, m, s) {
    const { hourHandColor, hourHandLength } = this.config;

    const hDeg =
      h * (Math.PI / 6) + m * (Math.PI / 6 / 60) + s * (Math.PI / 60 / 60 / 6);

    this.ctx.save();
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = hourHandColor;
    this.ctx.beginPath();
    this.ctx.rotate(hDeg);
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(hourHandLength, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawMinuteHand(m, s) {
    const { minuteHandColor, minuteHandLength } = this.config;

    const mDeg = m * (Math.PI / 30) + s * (Math.PI / 30 / 60);

    this.ctx.save();
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = minuteHandColor;
    this.ctx.beginPath();
    this.ctx.rotate(mDeg);
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(minuteHandLength, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSecondHand(s) {
    const { secondHandColor, secondHandLength } = this.config;

    const sDeg = s * (Math.PI / 30);

    this.ctx.save();
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = "round";
    this.ctx.strokeStyle = secondHandColor;
    this.ctx.beginPath();
    this.ctx.rotate(sDeg);
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(secondHandLength, 0);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawCenter() {
    const { centerColor } = this.config;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = centerColor;
    this.ctx.fill();
    this.ctx.restore();
  }

  draw() {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    // 清除画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 移动坐标系到中心点
    this.ctx.save();
    this.ctx.translate(this.centerX, this.centerY);
    this.ctx.rotate(-Math.PI / 2); // 旋转坐标系，使12点方向为起点

    // 绘制表盘和指针
    this.drawOuterRing();
    this.drawHourScale();
    this.drawMinuteScale();
    this.drawHourHand(h, m, s);
    this.drawMinuteHand(m, s);
    this.drawSecondHand(s);
    this.drawCenter();

    this.ctx.restore();

    // 请求下一帧动画
    window.requestAnimationFrame(() => this.draw());
  }

  start() {
    window.requestAnimationFrame(() => this.draw());
  }
}

// 使用示例
document.addEventListener("DOMContentLoaded", () => {
  const watch = new Watch("watch-container", {
    hourHandColor: "black",
    minuteHandColor: "green",
    secondHandColor: "blue",
    centerColor: "red",
  });
});
