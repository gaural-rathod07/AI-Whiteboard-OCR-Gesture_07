const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const handOverlay = document.getElementById("handOverlay");
const handCtx = handOverlay.getContext("2d");

const cursorWB = document.getElementById("cursorWB");
const cursorCtx = cursorWB.getContext("2d");

const cursorImg = new Image();
cursorImg.src = "/static/icons/Pencil-cursor.png"; // adjust path if needed

const eraserCursorImg = new Image();
eraserCursorImg.src = "/static/icons/Eraser-cursor.png"; // adjust path if needed

let cursorMode = "pen"; // "pen" | "eraser"

// Apply pencil cursor by default
canvas.classList.add("cursor-pen");

// Default settings
let tool = "pen";
let drawing = false;
let startX, startY;
let penSize = 5;
let eraserSize = 25;
let strokeColor = "#000000";

// Undo/Redo stack
let undoStack = [];
let redoStack = [];

// For preview (stored image of last stable state)
let previewImage = null;

// Text dragging
let activeTextBox = null;
let offsetX, offsetY;


// ---------------------------
// SAVE & RESTORE STATE
// ---------------------------
function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack = [];
    previewImage = new Image();
    previewImage.src = undoStack[undoStack.length - 1];
}

function restorePreview() {
    if (!previewImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewImage, 0, 0);
}


// ---------------------------
// MOUSE DOWN
// ---------------------------
canvas.addEventListener("mousedown", (e) => {
    saveState();
    drawing = true;

    const pos = getMousePos(e);
    startX = pos.x;
    startY = pos.y;


    if (tool === "pen" || tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
});


// ---------------------------
// MOUSE MOVE (LIVE PREVIEW FIXED PERMANENTLY)
// ---------------------------
canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const pos = getMousePos(e);
    const x = pos.x;
    const y = pos.y;


    // Live preview shapes
    if (tool === "rect" || tool === "circle" || tool === "line") {
        restorePreview();   // redraw last saved canvas state
        drawTemporaryShape(startX, startY, x, y); // draw preview
        return;
    }

    // Pen
    if (tool === "pen") {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = penSize;
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // Eraser
    if (tool === "eraser") {
        ctx.strokeStyle = "white";
        ctx.lineWidth = eraserSize;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
});


// ---------------------------
// MOUSE UP
// ---------------------------
canvas.addEventListener("mouseup", (e) => {
    drawing = false;

    const pos = getMousePos(e);
    const x = pos.x;
    const y = pos.y;


    if (tool === "rect" || tool === "circle" || tool === "line") {
        restorePreview();
        drawShape(startX, startY, x, y);
    }
});


// ---------------------------
// TOOL CONTROLS
// ---------------------------
function setTool(t) {
    tool = t;

    // Remove highlight from all buttons
    document.querySelectorAll(".tool-btn")
        .forEach(btn => btn.classList.remove("active-tool"));

    // Add highlight to selected tool
    const btn = document.getElementById(t + "Btn");
    if (btn) btn.classList.add("active-tool");

    // Cursor handling
    canvas.classList.remove("cursor-pen", "cursor-eraser", "cursor-default");

    if (t === "pen") canvas.classList.add("cursor-pen");
    else if (t === "eraser") canvas.classList.add("cursor-eraser");
    else canvas.classList.add("cursor-default");
}

function changeColor(v) { strokeColor = v; }
function changePenSize(v) { penSize = v; }
function changeEraserSize(v) { eraserSize = v; }

function removeTextBoxes() {
    document.querySelectorAll(".text-box").forEach(box => box.remove());
}

function initWhiteboard() {
    // Default tool
    tool = "pen";

    // Cursor
    canvas.classList.add("cursor-pen");

    // Highlight pen button
    document.getElementById("penBtn").classList.add("active-tool");
}

function openColorPicker() {
    document.getElementById("colorPicker").click();
}

// ---------------------------
// FINAL SHAPE DRAW
// ---------------------------
function drawShape(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineWidth = penSize;
    ctx.strokeStyle = strokeColor;

    if (tool === "line") {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    if (tool === "rect") {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    if (tool === "circle") {
        let radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.arc(x1, y1, radius, 0, Math.PI * 2);
    }

    ctx.stroke();
}


// ---------------------------
// TEMP SHAPE PREVIEW (smooth + no flicker)
// ---------------------------
function drawTemporaryShape(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.lineWidth = penSize;
    ctx.strokeStyle = strokeColor;

    if (tool === "rect") {
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    if (tool === "circle") {
        let radius = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.arc(x1, y1, radius, 0, Math.PI * 2);
    }

    if (tool === "line") {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    ctx.stroke();
}


// ---------------------------
// TEXT TOOL (Editable + Draggable)
// ---------------------------
function addText() {
    setTool("text");

    const container = document.getElementById("text-container");

    const div = document.createElement("div");
    div.contentEditable = true;
    div.className = "text-box";
    div.style.left = "200px";
    div.style.top = "150px";

    container.appendChild(div);
    div.focus();

    makeTextBoxDraggable(div);
}

function makeTextBoxDraggable(box) {

    // SELECT text box
    box.addEventListener("mousedown", function (e) {
        e.stopPropagation(); // important
        activeTextBox = box;

        offsetX = e.clientX - box.offsetLeft;
        offsetY = e.clientY - box.offsetTop;

        document.addEventListener("mousemove", dragTextBox);
        document.addEventListener("mouseup", stopDrag);
    });

    // Visual selection (optional but recommended)
    box.addEventListener("click", function (e) {
        e.stopPropagation();
        selectTextBox(box);
    });
}

function dragTextBox(e) {
    if (!activeTextBox) return;
    activeTextBox.style.left = (e.clientX - offsetX) + "px";
    activeTextBox.style.top = (e.clientY - offsetY) + "px";
}

function selectTextBox(box) {
    // Remove selection from others
    document.querySelectorAll(".text-box").forEach(b => {
        b.classList.remove("selected-text");
    });

    box.classList.add("selected-text");
    activeTextBox = box;
}

// Click anywhere else → deselect
document.addEventListener("click", () => {
    document.querySelectorAll(".text-box").forEach(b => {
        b.classList.remove("selected-text");
    });
    activeTextBox = null;
});

document.getElementById("deleteBtn").addEventListener("click", () => {
    if (activeTextBox) {
        activeTextBox.remove();
        activeTextBox = null;
    }
});

function stopDrag() {
    activeTextBox = null;
    document.removeEventListener("mousemove", dragTextBox);
    document.removeEventListener("mouseup", stopDrag);
}

function clearHandwritingOnly() {
    saveState(); // allow undo

    // Clear canvas drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // IMPORTANT: do NOT remove text boxes here
}

// ---------------------------
// SAVE BOARD (render draggable text into canvas)
// ---------------------------
function saveBoard() {
    // First, draw text boxes into the main canvas
    const boxes = document.querySelectorAll(".text-box");

    boxes.forEach(box => {
        const x = parseInt(box.style.left) - canvas.offsetLeft;
        const y = parseInt(box.style.top) - canvas.offsetTop;

        ctx.font = "20px Arial";
        ctx.fillStyle = strokeColor;
        ctx.fillText(box.innerText, x, y + 20);
    });

    // ---- CREATE TEMP CANVAS ----
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tempCtx = tempCanvas.getContext("2d");

    // Fill white background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    // Export image
    const img = tempCanvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = img;
    link.download = "whiteboard.png";
    link.click();
}

// ---------------------------
// UNDO / REDO
// ---------------------------
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(canvas.toDataURL());
        let previous = undoStack.pop();

        let img = new Image();
        img.src = previous;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            previewImage = img;  // keep preview state synced
        };
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(canvas.toDataURL());
        let next = redoStack.pop();

        let img = new Image();
        img.src = next;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            previewImage = img;
        };
    }
}


// ---------------------------
// CLEAR BOARD
// ---------------------------
function clearBoard() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // REMOVE text inputs ONLY here
    document.querySelectorAll(".text-box").forEach(box => box.remove());

    // Reset to pen
    setTool("pen");
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function resizeCanvas() {
    const wrapper = document.getElementById("whiteboard-wrapper");
    const canvas = document.getElementById("board");

    canvas.width = wrapper.clientWidth - 40;   // padding fix
    canvas.height = wrapper.clientHeight - 40;

    cursorWB.width = canvas.width;
    cursorWB.height = canvas.height;
}

window.onload = () => {
    resizeCanvas();
    initWhiteboard();
};

window.onresize = resizeCanvas;

function recognizeHandwriting() {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    const tctx = tempCanvas.getContext("2d");

    // FORCE WHITE BACKGROUND
    tctx.fillStyle = "white";
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tctx.drawImage(canvas, 0, 0);

    const image = tempCanvas.toDataURL("image/png");

    fetch("/ocr", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: image })
    })
        .then(res => res.json())
        .then(data => {
            clearHandwritingOnly();      // 👈 remove handwritten strokes
            addRecognizedText(data.text); // 👈 add clean digital text
        });
}

function addRecognizedText(text) {
    const container = document.getElementById("text-container");

    const div = document.createElement("div");
    div.className = "text-box";
    div.contentEditable = true;
    div.innerText = text || "No text detected";

    div.style.left = "250px";
    div.style.top = "200px";

    container.appendChild(div);
    makeTextBoxDraggable(div);
}

let cameraOn = false;
let handCamera = null;
let lastX = null, lastY = null;

function toggleCamera() {
    const video = document.getElementById("handCam");
    const camBox = document.getElementById("cam-container");

    if (cameraOn) {
        handCamera.stop();
        camBox.style.display = "none";   // 🔥 hide box
        cameraOn = false;
        return;
    }

    camBox.style.display = "block";      // 🔥 show box
    startHandTracking();
    cameraOn = true;
}

function startHandTracking() {
    const video = document.getElementById("handCam");

    const hands = new Hands({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
        selfieMode: true   // 🔥 IMPORTANT
    });

    hands.onResults(onHandResults);

    handCamera = new Camera(video, {
        onFrame: async () => {
            await hands.send({ image: video });
        },
        width: 640,
        height: 480
    });

    handCamera.start();

    handOverlay.width = video.videoWidth || 640;
    handOverlay.height = video.videoHeight || 480;

    cursorWB.width = canvas.width;
    cursorWB.height = canvas.height;

}

function isFingerUp(tip, pip) {
    return tip.y < pip.y - 0.02;
}

function onHandResults(results) {
    handCtx.clearRect(0, 0, handOverlay.width, handOverlay.height);

    // ❌ No hand → Stop
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        lastX = lastY = null;
        cursorCtx.clearRect(0, 0, cursorWB.width, cursorWB.height);
        return;
    }

    const lm = results.multiHandLandmarks[0];

    // ===== DRAW HAND SKELETON =====
    handCtx.strokeStyle = "#00ffcc";
    handCtx.lineWidth = 2;

    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20],
        [0, 17]
    ];

    connections.forEach(([a, b]) => {
        const p1 = lm[a];
        const p2 = lm[b];
        handCtx.beginPath();
        handCtx.moveTo(p1.x * handOverlay.width, p1.y * handOverlay.height);
        handCtx.lineTo(p2.x * handOverlay.width, p2.y * handOverlay.height);
        handCtx.stroke();
    });

    handCtx.fillStyle = "#ff0055";
    lm.forEach(p => {
        handCtx.beginPath();
        handCtx.arc(
            p.x * handOverlay.width,
            p.y * handOverlay.height,
            4,
            0,
            Math.PI * 2
        );
        handCtx.fill();
    });

    // ===== FINGER STATES =====
    const indexUp = isFingerUp(lm[8], lm[6]);
    const middleUp = isFingerUp(lm[12], lm[10]);
    const ringUp = isFingerUp(lm[16], lm[14]);
    const pinkyUp = isFingerUp(lm[20], lm[18]);

    // Cursor position
    const x = lm[8].x * canvas.width;
    const y = lm[8].y * canvas.height;

    // ✋ ALL FINGERS OPEN → ERASE
    if (indexUp && middleUp && ringUp && pinkyUp) {
        cursorMode = "eraser";
        setTool("eraser");
        showCursor(x, y);
        drawGesture(x, y, eraserSize);
        return;
    }

    // ☝️ INDEX ONLY → DRAW
    if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        cursorMode = "pen";
        setTool("pen");
        showCursor(x, y);
        drawGesture(x, y, penSize);
        return;
    }

    // ✌️ INDEX + MIDDLE → MOVE ONLY
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
        cursorMode = "pen";     // 🔥 force pencil cursor
        lastX = lastY = null;
        showCursor(x, y);
        return;
    }

    // ❌ Other poses → Stop (cursor stays pencil)
    cursorMode = "pen";
    lastX = lastY = null;
    showCursor(x, y);

}

function drawGesture(x, y, size) {
    ctx.strokeStyle = tool === "eraser" ? "white" : strokeColor;
    ctx.lineWidth = size;
    ctx.lineCap = "round";

    if (lastX === null || lastY === null) {
        lastX = x;
        lastY = y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
}

function showCursor(x, y) {
    cursorCtx.clearRect(0, 0, cursorWB.width, cursorWB.height);

    const isEraser = cursorMode === "eraser";
    const img = isEraser ? eraserCursorImg : cursorImg;
    const size = isEraser ? 36 : 32;

    cursorCtx.save();
    cursorCtx.translate(x, y);
    cursorCtx.rotate(isEraser ? 0 : -0.4);
    cursorCtx.drawImage(img, -size / 2, -size / 2, size, size);
    cursorCtx.restore();
}
