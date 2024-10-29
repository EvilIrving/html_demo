// main.js:ImageTrueBlender Class Definition
class ImageTrueBlender {
  constructor(canvasId, srcs) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    // 设置固定画布尺寸
    this.canvas.width = 600;
    this.canvas.height = 600;

    this.templates = [
      {
        x: 0,
        y: 0,
        width: 0.5,
        height: 1,
        overlapDirection: ["right"],
      },
      {
        x: 0.5,
        y: 0,
        width: 0.5,
        height: 1,
        // overlapDirection: ["left", "right", "top", "bottom"],
        overlapDirection: ["left"],
      },
    ];
    this.imgs = [];
    // 初始化时加载图片
    this.initImages(srcs);
    // 绑定滑动条事件
    this.overlapRatio = 0.16;
    this.bindSlider();
  }

  async initImages(srcs) {
    try {
      const imgs = await Promise.all(srcs.map(this.loadImage));
      this.imgs = imgs.map((img, index) => ({
        img: img,
        width: img.width,
        height: img.height,
        imgRatio: img.width / img.height,
        renderWidth: 0,
        renderHeight: 0,
        template: this.templates[index],
      }));
      const overlapRatio = 0.16;
      this.blend(overlapRatio);
      const slider = document.getElementById("overlapSlider");
      const valueDisplay = document.getElementById("overlapValue");
      slider.value = overlapRatio;
      valueDisplay.textContent = `${(overlapRatio * 100).toFixed(0)}%`;
    } catch (error) {
      console.error("图片加载失败:", error);
    }
  }

  bindSlider() {
    const slider = document.getElementById("overlapSlider");
    const valueDisplay = document.getElementById("overlapValue");
    slider.addEventListener("input", () => {
      const overlapRatio = parseFloat(slider.value);
      valueDisplay.textContent = `${(overlapRatio * 100).toFixed(0)}%`;
      this.overlapRatio = overlapRatio;
      this.blend(overlapRatio);
    });
  }

  blend() {
    if (!this.imgs.length) {
      console.error("图片尚未加载完成.");
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.imgs = this.getImgRenderArea();

    // 绘制非重叠部分 切片
    this.imgs.forEach((img) => {
      const {
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight,
      } = this.getDestinationArea(img);
      this.ctx.drawImage(
        img.img,
        0,
        0,
        img.renderWidth,
        img.renderHeight,
        destinationX,
        destinationY,
        destinationWidth,
        destinationHeight
      );
    });

    // 处理重叠区域
    this.processOverlapRegion();
  }

  // 获取图片需要渲染在画布的区域
  getDestinationArea(img) {
    const { x, y, width, height } = img.template;
    const destinationWidth = this.canvas.width * width;
    const destinationHeight = this.canvas.height * height;
    return {
      destinationX: this.canvas.width * x,
      destinationY: this.canvas.height * y,
      destinationWidth,
      destinationHeight,
    };
  }

  // 将需要截取的切片宽高，返回给img
  getImgRenderArea() {
    /**
     * 根据 frame 宽高和比例，获取第一张图片需要渲染在画布的区域
     * frameRatio = frameWidth / frameHeight
     * imgRatio = imgWidth / imgHeight
     * 如果 frameRatio > imgRatio 则 图片高度等于 frameHeight，宽度等于 imgWidth * (frameHeight / imgHeight)
     * 如果 frameRatio < imgRatio 则 图片宽度等于 frameWidth，高度等于 imgHeight * (frameWidth / imgWidth)
     * scaleRatio = frameWidth / imgWidth = frameHeight / imgHeight
     * sourceWidth = imgWidth * scaleRatio
     * sourceHeight = imgHeight * scaleRatio
     */
    return this.imgs.map((img) => {
      const frameWidth = this.canvas.width / 2;
      const frameHeight = this.canvas.height;

      const { renderWidth, renderHeight } = this.getWidthAndHeight(
        img,
        frameWidth,
        frameHeight
      );
      return {
        ...img,
        renderWidth,
        renderHeight,
      };
    });
  }
  // 根据img ,frame 宽高和比例，获取图片切片宽高
  getWidthAndHeight(img, frameWidth, frameHeight) {
    const frameRatio = frameWidth / frameHeight;
    let renderWidth, renderHeight;

    // frame 是竖向(<1)，而图片横向(>1)，则保持高度适应，宽度等比例适应，若图片竖向(<1)，也保持高度适应，宽度等比例适应
    // 反之，frame 是横向(>1)，而图片竖向(<1)，则保持宽度适应，高度等比例适应，若图片横向(<1)，也保持宽度适应，高度等比例适应
    if (frameRatio < 1) {
      renderHeight = img.height;
      renderWidth = frameWidth * (img.height / frameHeight);
    } else {
      renderWidth = img.width;
      renderHeight = frameHeight * (img.width / frameWidth);
    }

    return { renderWidth, renderHeight };
  }

  // 处理重叠区域
  processOverlapRegion() {
    const frameWidth = this.canvas.width / 2;
    const overlapWidth = Math.round(
      frameWidth * (1 + this.overlapRatio) - frameWidth
    );
    const overlapStartX = frameWidth - overlapWidth;

    const overlapRegion = this.ctx.createImageData(
      overlapWidth,
      this.canvas.height
    );

    const imgDatas = this.imgs.map((img, index) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.renderWidth;
      canvas.height = img.renderHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img.img, 0, 0, img.renderWidth, img.renderHeight);
      return ctx.getImageData(
        index === 0 ? overlapStartX : 0,
        0,
        overlapWidth,
        this.canvas.height
      ).data;
    });

    const cosineInterpolation = (x) => (1 - Math.cos(x * Math.PI)) / 2;

    for (let y = 0, offset = 0; y < this.canvas.height; y++) {
      for (let x = 0; x < overlapWidth; x++, offset += 4) {
        const blendFactor = cosineInterpolation(x / (overlapWidth - 1));
        const inverseBlend = 1 - blendFactor;

        overlapRegion.data[offset] = Math.round(
          imgDatas[0][offset] * inverseBlend + imgDatas[1][offset] * blendFactor
        );
        overlapRegion.data[offset + 1] = Math.round(
          imgDatas[0][offset + 1] * inverseBlend +
            imgDatas[1][offset + 1] * blendFactor
        );
        overlapRegion.data[offset + 2] = Math.round(
          imgDatas[0][offset + 2] * inverseBlend +
            imgDatas[1][offset + 2] * blendFactor
        );
        overlapRegion.data[offset + 3] = 255; // 设置不透明度
      }
    }

    this.ctx.putImageData(overlapRegion, overlapStartX, 0);
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // 处理跨域问题
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

// 初始化 ImageTrueBlender 实例
document.addEventListener("DOMContentLoaded", () => {
  const image1Src = "./images/3.jpg";
  const image2Src = "./images/4.jpg";
  new ImageTrueBlender("canvas", [image1Src, image2Src]);
});
