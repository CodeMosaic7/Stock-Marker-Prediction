
# 📈 Stock Price Predictor (LSTM)

A full-stack web application that predicts stock prices using a trained LSTM model. Built with a React frontend and FastAPI backend, it visualizes both actual and predicted stock prices in real time using interactive charts.

---

## 🚀 Features

- 📊 Predicts stock closing prices using LSTM
- 🧠 Trained with historical time series data
- 📈 Visualizes predicted vs actual prices
- ⚡ Modern frontend with React + Vite
- 🧪 Backend API with FastAPI
- 📦 Cleaned and preprocessed data with outlier removal

---

## 🛠 Tech Stack

| Layer        | Tech              |
|--------------|-------------------|
| Frontend     | React (Vite), Chart.js |
| Backend API  | FastAPI (Python)  |
| ML Model     | LSTM (TensorFlow/Keras) |
| Data Source  | Alpha Vantage API |
| Deployment   | (Optional: Vercel + Railway/Render) |

---

## 📂 Project Structure

```

📁 project-root/
├── backend/             # FastAPI app with LSTM model
│   ├── main.py
│   ├── model.py
│   ├── requirements.txt
├── frontend/            # Vite + React app
│   ├── src/
│   ├── public/
│   ├── package.json
├── README.md
└── .gitignore

````

---

## 📦 Installation & Running Locally

### 🔹 Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
````

### 🔹 Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 API Endpoint

```
GET /predict
→ Returns: { predicted: [...], actual: [...] }
```

#

## 📌 License

This project is licensed under the [MIT License](LICENSE).

---

