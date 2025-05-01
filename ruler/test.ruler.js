class RulerPicker {
  constructor(canvasElement, config = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;

    this.config = {
      // 刻度线颜色
      tickColor: "red",
      valueTickColor: "yellow",
      numberColor: "#e5e5e5",
      MajorTickColor: "blue",
      backgroundColor: "#fff",
      pixelsPerUnit: 70, // 每单位长度的像素数
      tickInterval: 0.1, // 0.1单位作为一个小刻度
      majorTickInterval: 1, //  1 单位作为大刻度间隔
      initialValue: 10, // 初始值
      minValue: 0, // 最小值
      maxValue: 30, // 最大值
      unitName: "cm", // 单位
    };

    this.init();
  }

  // 初始化
  init() {
    // 处理 高 dpr 屏幕
    this.canvas.width = this.canvas.clientWidth * this.dpr;
    this.canvas.height = this.canvas.clientHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.bindEvent();
    this.drawInterval();
  }

  // 绑定事件
  bindEvent() {
    // 移动端触摸相关事件
    this.canvas.addEventListener(
      "touchstart",
      this.handleDragStart.bind(this),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", this.handleDrag.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleDragEnd.bind(this));
    this.canvas.addEventListener("touchcacel", this.handleDragEnd.bind(this));

    // 兼容 pc 端
    this.canvas.addEventListener("mousemove", this.handleDrag.bind(this));
    this.canvas.addEventListener("mouseup", this.handleDragEnd.bind(this));
    this.canvas.addEventListener("mousedown", this.handleDragStart.bind(this));
    this.canvas.addEventListener("mouseleave", this.handleDragEnd.bind(this));
  }

  // 拖动开始事件
  handleDragStart(e) {}
  // 拖动处理事件
  handleDrag(e) {}
  // 拖动结束事件
  handleDragEnd(e) {}

  //   吸附动画
  snapAnimation() {}

  /**
   * 绘制刻度
   * @param {*} ctx
   * @param {*} start
   * @param {*} end
   */
  drawInterval() {
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1),
      height = this.canvas.height / (window.devicePixelRatio || 1),
      centerX = width / 2,
      valueRange = width / this.config.pixelsPerUnit,
      centerValue = this.config.initialValue,
      start = centerValue - valueRange / 2,
      end = centerValue + valueRange / 2;

    let currentTick =
      Math.ceil(start / this.config.tickInterval) * this.config.tickInterval;

    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, width, this.canvas.height);

    let startY = height * 0.5,
      tickHeight = height * 0.15,
      majorTickHeight = height * 0.25,
      numberY = height * 0.9;

    ctx.lineWidth = 1;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    while (currentTick <= end && currentTick <= this.config.maxValue) {
      if (currentTick >= this.config.minValue) {
        const tickX =
          centerX + (currentTick - centerValue) * this.config.pixelsPerUnit;

        const isMajorTick =
          Math.abs(currentTick % this.config.majorTickInterval) <
            this.config.tickInterval / 2 ||
          Math.abs(
            (currentTick % this.config.majorTickInterval) -
              this.config.majorTickInterval
          ) <
            this.config.tickInterval / 2;

        ctx.beginPath();
        ctx.strokeStyle = this.getTickColor(currentTick, isMajorTick);
        ctx.moveTo(tickX, startY);
        ctx.lineTo(
          tickX,
          isMajorTick ? startY + majorTickHeight : startY + tickHeight
        );
        ctx.stroke();

        // 大刻度添加一个文字
        if (isMajorTick) {
          ctx.fillStyle = this.config.numberColor;
          let numStr = "";
          if (Math.abs(currentTick - Math.round(currentTick)) < 0.0001) {
            // 整数判断
            numStr = Math.round(currentTick).toString();
          } else {
            numStr = currentTick.toFixed(1);
          }
          ctx.fillText(numStr, tickX, numberY);
        }
      }
      currentTick += this.config.tickInterval;
      if (this.config.tickInterval < 0) break;
    }
  }

  getTickColor(currentTick, isMajorTick) {
    if (
      Math.abs(currentTick - this.config.initialValue) <
      this.config.tickInterval / 2
    ) {
      return this.config.valueTickColor;
    }

    if (isMajorTick) {
      return this.config.MajorTickColor;
    }

    return this.config.tickColor;
  }
}
