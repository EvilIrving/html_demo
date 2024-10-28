$(function () {
    var canvas = this.__canvas = new fabric.Canvas('canvas', {
        backgroundColor: 'lightgrey',
        width: 1000,
        height: 1000,
    });

    // var path = 'M 230 230 A 45 45, 0, 1, 1, 275 275 L 275 230 Z';
    var path = 'M 183.832 168.328 C 189.197 157.596 205.942 150.13 215.393 144.518 C 230.346 135.64 247.365 126.939 264.673 123.477 C 296.071 117.198 329.196 119.048 361.019 119.048 C 376.176 119.048 388.426 120.467 403.101 123.477 C 410.442 124.983 416.547 125.401 422.481 130.676 C 435.454 142.208 439.612 166.988 441.86 182.724 C 444.246 199.424 446.105 217.857 444.075 234.773 C 442.438 248.42 436.161 260.064 430.786 272.425 C 419.2 299.073 406.649 324.409 388.151 347.176 C 362.826 378.345 324.891 399.225 284.607 399.225 C 275.429 399.225 265.368 400.313 256.368 398.117 C 252.17 397.094 248.354 394.825 244.186 393.688 C 225.363 388.554 207.5 384.007 192.691 370.432 C 183.388 361.904 186.819 345.772 184.385 334.994 C 182.766 327.823 179.119 320.635 177.741 313.4 C 174.906 298.517 178.227 304.923 175.526 291.805 C 172.793 278.532 168.085 265.58 165.006 252.492 C 162.644 242.453 157.584 229.351 161.13 218.715 C 164.447 208.762 170.668 200.747 174.972 192.137 C 179.161 183.76 177.241 173.257 184.939 165.559';

    var shell = new fabric.Path(path, {
        selectable: false,
        lockMovementX: true,
        lockMovementY: true,
        fill: '',
        stroke: 'purple',
        strokeWidth: 1,
        scaleX: 2,
        scaleY: 2,
        lockScalingX: true,
        lockScalingY: true,
        lockSkewingX: true,
        lockSkewingY: true,
        originX: 'center',
        originY: 'center',
    });
    var clipPath = new fabric.Path(path, {
        absolutePositioned: true,
        originX: 'center',
        originY: 'center',
        scaleX: 2,
        scaleY: 2
    });
    canvas.add(shell);

    fabric.Image.fromURL('http://fabricjs.com/lib/pug.jpg', function (img) {
        img.clipPath = clipPath;
        canvas.add(img);
        canvas.setActiveObject(img);
    });

    var newText = new fabric.Text('foo', {
        fontFamily: 'Delicious_500',
        left: 600,
        top: 200,
        clipPath
    })

    canvas.add(newText);
    var rectangle = new fabric.Rect({ width: 500, height: 500, fill: 'green', left: 100, top: 100, clipPath });
    canvas.add(rectangle)


})