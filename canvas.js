//import Rect from './shapes/rect';

let canvas;
let context;
let shapes = [];
let shapesInFlight = [];
let currentColor;
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
  // Make it visually fill the positioned parent
  // canvas.style.width ='100%';
  // canvas.style.height='100%';
  // // then set the internal size to match
  // canvas.width  = canvas.offsetWidth;
  // canvas.height = canvas.offsetHeight;

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
  const clearButton = document.getElementById("toolbar-clear-button");
  clearButton.addEventListener('click', handleClearButtonClicked);
}

const handleClearButtonClicked = () => {
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
      //drawGhost(startX, startY, event.clientX, event.clientY);
      shapesInFlight = [];
      shapesInFlight.push(new Rect(canvas, context, currentColor, startX, startY, event.clientX, event.clientY))
      draw();
    }
  });

  document.addEventListener('mouseup', (event) => {
    if (!lastMouseDownWasInsideCanvas) return;
    dragging = false;
    endX = event.clientX;
    endY = event.clientY;
    shapesInFlight = [];
    shapes.push(new Rect(canvas, context, currentColor, startX, startY, endX, endY))
    draw();
  });
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
    //const rect = this.canvas.getBoundingClientRect()
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