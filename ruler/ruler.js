class RulerPicker {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        // --- Default Configuration ---
        this.config = {
            min: options.min ?? 0, // 刻度最小值
            max: options.max ?? 20, // 刻度最大值
            initialValue: options.initialValue ?? 0, // 预设值
            unit: options.unit ?? 'kg', // 单位
            tickInterval: options.tickInterval ?? 0.1,       // 小刻度间隔 Minor tick spacing
            majorTickInterval: options.majorTickInterval ?? 1, // 大刻度间隔 Major tick spacing
            pixelsPerUnit: options.pixelsPerUnit ?? 80,       // 每单位/像素 Scale density
            tickColor: options.tickColor ?? '#ccc', 
            majorTickColor: options.majorTickColor ?? '#888',
            numberColor: options.numberColor ?? '#555',
            indicatorColor: options.indicatorColor ?? '#007bff', 
            backgroundColor: options.backgroundColor ?? '#fff',
            onChange: options.onChange ?? function() {},
            onUnitChange: options.onUnitChange ?? function() {},
            snapAnimationDuration: options.snapAnimationDuration ?? 200 // 吸附动画时间 ms
        };

        // --- State Variables ---
        this.currentValue = this.config.initialValue;
        this.scrollOffset = 0; // 作用是让刻度显示在中间
        this.isDragging = false;
        this.startX = 0;
        this.lastX = 0; // To calculate drag distance in move event，计算移动距离
        this.animationFrameId = null; // 动画帧ID
        this.snapTargetOffset = null; // 吸附动画的目标偏移量
        this.snapStartTime = null; // 吸附动画开始时间
        this.snapStartOffset = 0; // 吸附动画的起始偏移量

        this.valueAtCenter = 0; // The value currently aligned with the center indicator

        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();

        // Initial setup
        this.setValue(this.config.initialValue, false); // Set initial value without animation
        this.config.onUnitChange(this.config.unit); // Trigger unit change callback
        this.drawRuler(); // Initial draw
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;

        // Calculate initial offset to place initialValue at the center
        this.centerOffset = this.canvas.width / (2 * (window.devicePixelRatio || 1));
        this.scrollOffset = (this.config.initialValue - this.config.min) * this.config.pixelsPerUnit;
        this.valueAtCenter = this.config.initialValue; // Initially, the center shows the initial value
    }


    bindEvents() {
        // Use passive: false if preventDefault is needed inside the handler
        this.canvas.addEventListener('touchstart', this.handleDragStart.bind(this), { passive: true });
        this.canvas.addEventListener('touchmove', this.handleDragMove.bind(this), { passive: true });
        this.canvas.addEventListener('touchend', this.handleDragEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleDragEnd.bind(this));

        // Optional: Add mouse events for desktop testing
        this.canvas.addEventListener('mousedown', this.handleDragStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleDragMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleDragEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleDragEnd.bind(this)); // End drag if mouse leaves canvas
    }

    // --- Event Handlers ---

    // 开始拖拽时记录起始位置
    handleDragStart(event) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // Stop snapping animation
            this.animationFrameId = null;
        }
        this.isDragging = true;
        this.startX = this.getEventX(event);
        this.lastX = this.startX;
        this.canvas.style.cursor = 'grabbing'; // Indicate dragging
    }

    // 拖拽时根据手指/鼠标移动距离更新标尺位置
    handleDragMove(event) {
        if (!this.isDragging) return;

        const currentX = this.getEventX(event);
        const deltaX = currentX - this.lastX;

        // Calculate new offset, respecting boundaries
        const newScrollOffset = this.scrollOffset - deltaX; // Moving finger right scrolls ruler left (increase value)
        this.setScrollOffset(newScrollOffset);

        this.lastX = currentX;
        this.drawRuler();
    }

    //结束拖拽时触发自动对齐动画
    handleDragEnd(event) {
         // Check if it was a real drag or just a click/tap before resetting
        if (!this.isDragging && this.snapTargetOffset === null) { // Avoid triggering snap if already snapping or not dragging
             return;
        }
        if (this.isDragging || this.snapTargetOffset === null) { // Ensure snap only happens once after drag
             this.isDragging = false;
             this.canvas.style.cursor = 'grab';
             this.snapToNearestTick();
        }

    }

    // --- Core Logic ---

    // 更新滚动偏移量并计算当前值
    setScrollOffset(newOffset) {
         // Calculate boundaries in terms of offset
        const minOffset = 0; // Offset corresponding to config.min
        const maxOffset = (this.config.max - this.config.min) * this.config.pixelsPerUnit;

        // Clamp the offset
        this.scrollOffset = Math.max(minOffset, Math.min(newOffset, maxOffset));

        // Update the value at the center indicator
        this.valueAtCenter = this.config.min + this.scrollOffset / this.config.pixelsPerUnit;
        this.currentValue = this.valueAtCenter; // Update raw current value during drag
        this.config.onChange(this.currentValue); // Call callback during drag
    }

    // 设置特定值并可选是否使用动画
    setValue(value, animate = true) {
        const targetValue = Math.max(this.config.min, Math.min(value, this.config.max));
        const targetOffset = (targetValue - this.config.min) * this.config.pixelsPerUnit;

        if (animate) {
            this.startSnapAnimation(targetOffset);
        } else {
             if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.setScrollOffset(targetOffset);
            this.valueAtCenter = targetValue; // Ensure valueAtCenter is updated
            this.currentValue = targetValue;
            this.config.onChange(this.currentValue);
            this.drawRuler();
        }
    }


    // 自动对齐到最近的刻度
    snapToNearestTick() {
        const nearestValue = Math.round(this.valueAtCenter / this.config.tickInterval) * this.config.tickInterval;
        const clampedNearestValue = Math.max(this.config.min, Math.min(nearestValue, this.config.max));

        const targetOffset = (clampedNearestValue - this.config.min) * this.config.pixelsPerUnit;

        this.startSnapAnimation(targetOffset);
    }

    // 开始吸附动画
    startSnapAnimation(targetOffset) {
         if (Math.abs(this.scrollOffset - targetOffset) < 0.5) { // Already close enough
             this.setScrollOffset(targetOffset); // Ensure exact position
             this.currentValue = this.config.min + this.scrollOffset / this.config.pixelsPerUnit;
             this.config.onChange(this.currentValue); // Final update
             this.drawRuler();
             this.snapTargetOffset = null; // Reset snap target
             return;
         }

        this.snapTargetOffset = targetOffset;
        this.snapStartOffset = this.scrollOffset;
        this.snapStartTime = performance.now();

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // Cancel previous animation if any
        }
        this.animationFrameId = requestAnimationFrame(this.animateSnap.bind(this));
    }


    // 吸附动画的核心逻辑
    animateSnap(timestamp) {
        const elapsedTime = timestamp - this.snapStartTime;
        const duration = this.config.snapAnimationDuration;

        if (elapsedTime >= duration) {
            // Animation finished
            this.setScrollOffset(this.snapTargetOffset);
             this.currentValue = this.config.min + this.scrollOffset / this.config.pixelsPerUnit; // Final precise value
             this.config.onChange(this.currentValue); // Final update
            this.drawRuler();
            this.animationFrameId = null;
            this.snapTargetOffset = null; // Clear target
        } else {
            // Continue animation - simple linear interpolation (ease-out is better)
            const progress = elapsedTime / duration;
             // Ease-out cubic: easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const easeOutQuad = progress * (2 - progress); // Simple ease-out quadratic
            const newOffset = this.snapStartOffset + (this.snapTargetOffset - this.snapStartOffset) * easeOutQuad;

            this.setScrollOffset(newOffset); // Update offset and valueAtCenter
            this.currentValue = this.valueAtCenter; // Keep current value updated during anim
            this.config.onChange(this.currentValue); // Update display during anim
            this.drawRuler();
            this.animationFrameId = requestAnimationFrame(this.animateSnap.bind(this));
        }
    }


    drawRuler() {
        const ctx = this.ctx;
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1); // Use logical width
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1); // Use logical height
        const center = canvasWidth / 2;

        // Clear canvas
        ctx.fillStyle = this.config.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);  

        // --- Draw Ticks and Numbers ---
        const tickStartY = canvasHeight * 0.3; // Top position of ticks
        const minorTickHeight = canvasHeight * 0.15;
        const majorTickHeight = canvasHeight * 0.3;
        const numberY = canvasHeight * 0.8; // Position for numbers

        // Determine the range of values visible on the canvas
        const valueRange = canvasWidth / this.config.pixelsPerUnit;
        const minValueVisible = this.valueAtCenter - valueRange / 2;
        const maxValueVisible = this.valueAtCenter + valueRange / 2;

        // Calculate the first tick value to draw (align to tickInterval)
        let currentTickValue = Math.ceil(minValueVisible / this.config.tickInterval) * this.config.tickInterval;


        ctx.lineWidth = 1;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';


        while (currentTickValue <= maxValueVisible && currentTickValue <= this.config.max) {
             if (currentTickValue >= this.config.min) { // Only draw within min/max bounds
                const tickX = center + (currentTickValue - this.valueAtCenter) * this.config.pixelsPerUnit;

                // Check if it's a major tick (handle potential floating point inaccuracies)
                const isMajorTick = Math.abs(currentTickValue % this.config.majorTickInterval) < (this.config.tickInterval / 2) ||
                                  Math.abs((currentTickValue % this.config.majorTickInterval) - this.config.majorTickInterval) < (this.config.tickInterval / 2);


                ctx.beginPath();
                ctx.strokeStyle = isMajorTick ? this.config.majorTickColor : this.config.tickColor;
                ctx.moveTo(tickX, tickStartY);
                ctx.lineTo(tickX, tickStartY + (isMajorTick ? majorTickHeight : minorTickHeight));
                ctx.stroke();

                // Draw number for major ticks
                if (isMajorTick) {
                    ctx.fillStyle = this.config.numberColor;
                    // Format number (e.g., avoid long decimals if tickInterval is small)
                    let numStr = Number.isInteger(currentTickValue) ? currentTickValue.toString() : currentTickValue.toFixed(1);
                     // More robust check for integer display
                    if (Math.abs(currentTickValue - Math.round(currentTickValue)) < 0.001) {
                       numStr = Math.round(currentTickValue).toString();
                    } else {
                       numStr = currentTickValue.toFixed(1); // Adjust precision as needed
                    }
                    ctx.fillText(numStr, tickX, numberY);
                }
            }

            currentTickValue += this.config.tickInterval;
             // Prevent infinite loops with tiny intervals
             if (this.config.tickInterval <= 0) break;
        }


        // --- Draw Center Indicator ---
        const indicatorYStart = canvasHeight * 0.1; // Make indicator taller
        const indicatorHeight = canvasHeight * 0.4;
        ctx.beginPath();
        ctx.strokeStyle = this.config.indicatorColor;
        ctx.lineWidth = 2; // Make indicator thicker
        ctx.moveTo(center, indicatorYStart);
        ctx.lineTo(center, indicatorYStart + indicatorHeight);
        ctx.stroke();
    }

    // --- Utility ---

    getEventX(event) {
        if (event.touches && event.touches.length > 0) {
            return event.touches[0].clientX;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            return event.changedTouches[0].clientX; // For touchend
        }
        return event.clientX; // For mouse events
    }
}