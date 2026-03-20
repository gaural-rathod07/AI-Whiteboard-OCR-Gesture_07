from flask import Flask, render_template, request, jsonify
import cv2
import pytesseract
import numpy as np
import base64
import re

app = Flask(__name__)

# Set tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\Gaural\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ocr", methods=["POST"])
def ocr():
    data = request.json["image"]

    # Decode base64
    image_data = base64.b64decode(data.split(",")[1])
    np_img = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_GRAYSCALE)

    # ---- FORCE WHITE BACKGROUND ----
    img[img < 240] = 0
    img[img >= 240] = 255

    # ---- INVERT (BLACK TEXT ON WHITE) ----
    img = cv2.bitwise_not(img)

    # ---- DILATE (THICKEN STROKES) ----
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    img = cv2.dilate(img, kernel, iterations=1)

    # ---- BLUR ----
    img = cv2.GaussianBlur(img, (3, 3), 0)

    # ---- ADAPTIVE THRESHOLD ----
    img = cv2.adaptiveThreshold(
        img,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        15
    )

    # SAVE DEBUG IMAGE
    cv2.imwrite("debug_processed.png", img)

    # ---- OCR CONFIG (CRITICAL CHANGE) ----
    config = "--oem 3 --psm 6"

    text = pytesseract.image_to_string(img, config=config)

    cleaned = re.sub(r"[^a-zA-Z ]", "", text).lower().strip()

    return jsonify({"text": cleaned})


if __name__ == "__main__":
    app.run(debug=True)
