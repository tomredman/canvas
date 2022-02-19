let canvas;
let context;
let shapes = [];
let shapesInFlight = [];
let currentColor;
let currentTool = 'rect';
let dpi;

document.addEventListener('DOMContentLoaded', (event) => {
  loadCanvas();
  updateCanvasSize();
  setupColorPicker();
  setupMouseListener();
  setupToolbar();
});

window.addEventListener('resize', (event) => {
  updateCanvasSize();
});

const loadCanvas = () => {
  dpi = window.devicePixelRatio;
  canvas = document.querySelector('canvas');
  context = canvas.getContext('2d');
}

const updateCanvasSize = () => {
  let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
  let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
  canvas.setAttribute('height', style_height * dpi);
  canvas.setAttribute('width', style_width * dpi);
  draw();
}

const setupColorPicker = () => {
  let colors = document.querySelectorAll(".color-picker > ul > li.color");
  colors.forEach((color) => {
    //Use the first color as default
    if (!currentColor) {
      currentColor = window.getComputedStyle(color).backgroundColor;
    }
    color.addEventListener("click", handleColorClicked);
  });
}

const handleColorClicked = (event) => {
  currentColor = window.getComputedStyle(event.target).backgroundColor;
  let colors = document.querySelectorAll(".color-picker > ul > li.color");
  colors.forEach((color) => {
    color.classList.remove("selected");
  });
  event.target.classList.add("selected");
};

const setupToolbar = () => {
  document.getElementById("toolbar-pointer-button").addEventListener('click', handleToolButtonClicked);
  document.getElementById("toolbar-rect-button").addEventListener('click', handleToolButtonClicked);
  document.getElementById("toolbar-circle-button").addEventListener('click', handleToolButtonClicked);
  document.getElementById("toolbar-line-button").addEventListener('click', handleToolButtonClicked);
  document.getElementById("toolbar-clear-button").addEventListener('click', handleToolButtonClicked);
}

const handleToolButtonClicked = (event) => {
  const toolButton = event.target;
  const tool = toolButton.getAttribute('data-tool');
  switch(tool) {
    case 'clear':
      clearCanvas();
      break;
    default:
      selectTool(tool);
      break;
  }
}

const selectTool = (tool) => {
  let toolButtons = document.querySelectorAll(".toolbar > button");
  toolButtons.forEach((toolButton) => {
    const clickedTool = toolButton.getAttribute('data-tool');
    if (clickedTool === tool) {
      toolButton.classList.add("selected");
      currentTool = clickedTool;
    }
    else {
      toolButton.classList.remove("selected");
    }
  });
}

const clearCanvas = () => {
  shapes = [];
  draw();
}

const setupMouseListener = () => {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  let lastMouseDownWasInsideCanvas = true;

  document.addEventListener('mousedown', (event) => {
    lastMouseDownWasInsideCanvas = canvas.contains(event.target);
    if (!lastMouseDownWasInsideCanvas) return;

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    endX = event.clientX;
    endY = event.clientY;
  });

  document.addEventListener('mousemove', (event) => { 
    if (dragging) {
      shapesInFlight = [];

      switch (currentTool) {
        case 'rect':
          shapesInFlight.push(new Rect(canvas, context, currentColor, startX, startY, event.clientX, event.clientY));
          break;
        case 'circle':
          shapesInFlight.push(new Circle(canvas, context, currentColor, startX, startY, getDistance(startX, startY, event.clientX, event.clientY)));
          break;
        case 'line':
          shapesInFlight.push(new Line(canvas, context, currentColor, startX, startY, event.clientX, event.clientY));
          break;
        default:
          break;
      }
      draw();
    }
  });

  document.addEventListener('mouseup', (event) => {
    if (!lastMouseDownWasInsideCanvas) return;
    dragging = false;
    endX = event.clientX;
    endY = event.clientY;
    shapesInFlight = [];
    switch (currentTool) {
      case 'rect':
        shapes.push(new Rect(canvas, context, currentColor, startX, startY, endX, endY));
        break;
      case 'circle':
        shapes.push(new Circle(canvas, context, currentColor, startX, startY, getDistance(startX, startY, endX, endY)));
        break;
      case 'line':
        shapes.push(new Line(canvas, context, currentColor, startX, startY, endX, endY));
        break;
      default:
        break;
    }

    draw();
  });
}

const getDistance = (x1, y1, x2, y2) => {
  let distance = Math.sqrt(((x2-x1)*(x2-x1)) + ((y2-y1)*(y2-y1)));
  return distance;
}

const draw = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  shapes.forEach(shape => shape.draw());
  shapesInFlight.forEach(shape => {
    shape.stroke = true;
    shape.draw()
  });
}

class Rect {
  constructor(canvas, ctx, fill, x1, y1, x2, y2) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.fill = fill;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.stroke = false;
  }

  draw() {
    //const rect = this.canvas.getBoundingClientRect() //TODO
    let x1 = (this.x1 - this.canvas.offsetLeft) * dpi
    let y1 = (this.y1 - this.canvas.offsetTop) * dpi
    let x2 = (this.x2 - this.canvas.offsetLeft) * dpi
    let y2 = (this.y2 - this.canvas.offsetTop) * dpi

    // Used for shapes in flight
    if (this.stroke) {
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillStyle = this.fill;
      this.ctx.fillRect(x1, y1, x2-x1, y2-y1);
      this.ctx.globalAlpha = 1.0;

      this.ctx.lineWidth = 1 * dpi;
      this.ctx.strokeStyle = this.fill;
      this.ctx.strokeRect(x1, y1, x2-x1, y2-y1);
    }
    // Final shape
    else {
      this.ctx.fillStyle = this.fill;
      this.ctx.fillRect(x1, y1, x2-x1, y2-y1);
    }
  }
}

class Circle {
  constructor(canvas, ctx, fill, centerX, centerY, radius) {
    this.circle = new Path2D();
    this.canvas = canvas;
    this.ctx = ctx;
    this.fill = fill;
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius * dpi; 
  }

  draw() {

    let centerX = (this.centerX - this.canvas.offsetLeft) * dpi
    let centerY = (this.centerY - this.canvas.offsetTop) * dpi

    this.circle.arc(centerX, centerY, this.radius, 0, 2 * Math.PI, false);

    if (this.stroke) {
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillStyle = this.fill;
      this.ctx.fill(this.circle);
      this.ctx.globalAlpha = 1.0;

      this.ctx.lineWidth = 1 * dpi;
      this.ctx.strokeStyle = this.fill;
      this.ctx.stroke(this.circle);
    }
    else {
      this.ctx.fillStyle = this.fill;
      this.ctx.fill(this.circle);
    }
  }
}

class Line {
  constructor(canvas, ctx, fill, x1, y1, x2, y2) {
    this.line = new Path2D();
    this.canvas = canvas;
    this.ctx = ctx;
    this.fill = fill;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  draw() {
    let x1 = (this.x1 - this.canvas.offsetLeft) * dpi
    let y1 = (this.y1 - this.canvas.offsetTop) * dpi
    let x2 = (this.x2 - this.canvas.offsetLeft) * dpi
    let y2 = (this.y2 - this.canvas.offsetTop) * dpi

    this.ctx.lineWidth = 3 * dpi;
    this.ctx.strokeStyle = this.fill;
    this.ctx.lineCap = "butt";

    if (this.stroke) {
      this.ctx.globalAlpha = 0.2;
    }

    this.line.moveTo(x1, y1);
    this.line.lineTo(x2, y2);
    this.ctx.stroke(this.line);

    if (this.stroke) {
      this.ctx.globalAlpha = 1.0;
    }
  }
}