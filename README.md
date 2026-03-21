# AI Whiteboard with OCR & Gesture Control

An interactive AI-powered whiteboard that allows users to draw, write, use hand gestures, and convert handwritten content into clean digital text using OCR.

---

## 🚀 Features

* ✏️ Freehand drawing (pen tool)
* 🧽 Eraser with adjustable size
* 📐 Shapes (line, rectangle, circle)
* 🎨 Color picker
* 🔤 Text boxes with drag & edit support
* ↩️ Undo / Redo functionality
* 💾 Save whiteboard as image
* 🧹 Clear canvas
* ✋ Hand gesture control (using MediaPipe)
* 📷 Camera integration for gesture tracking
* 🧾 Handwriting recognition using OCR (Tesseract)

---

## 🛠️ Tech Stack

### Frontend

* HTML, CSS, JavaScript
* Canvas API
* MediaPipe (Hand Tracking)

### Backend

* Python (Flask)

### AI / CV

* OpenCV
* Tesseract OCR
* NumPy

---

## 📂 Project Structure

```
project/
│
├── app.py
├── requirements.txt
├── README.md
│
├── templates/
│   └── index.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── icons/
```

---

## 🧠 How It Works

* Users draw on canvas
* Image is captured and sent to Flask backend
* OpenCV preprocesses the image
* Tesseract OCR extracts text
* Cleaned text is returned and displayed

---

## 📸 Future Improvements

* AI-based shape recognition
* Cloud storage for notes
* Multi-user collaboration
* Mobile responsiveness

---

## 👨‍💻 Author

Gaural Rathod

---

## Screenshots

### Draw using cursor
<img width="1918" height="903" alt="1" src="https://github.com/user-attachments/assets/d21a9328-c96d-4e1c-a6cc-52b71d48425c" />

### Convert to Text (OCR)
<img width="1918" height="910" alt="2" src="https://github.com/user-attachments/assets/9755b25e-81b4-4a04-b025-92e0f9ade769" />

### Draw using Hand Gestures
<img width="1918" height="912" alt="3" src="https://github.com/user-attachments/assets/a3ed12b3-86f9-4770-b991-453854cea56a" />
