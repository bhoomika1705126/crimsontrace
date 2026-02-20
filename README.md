# CrimsonTrace - Frontend

Graph-Based Money Muling Detection System - Frontend Application

**RIFT 2026 Hackathon | Graph Theory / Financial Crime Detection Track**

---

🌐 **Live Demo**

- **Frontend URL:** https://crimsontrace.netlify.app
- **Backend API:** https://crimson-trace.onrender.com

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [Installation & Setup](#installation--setup)
6. [Environment Variables](#environment-variables)
7. [Deployment](#deployment)
8. [Screenshots](#screenshots)
9. [Team Members](#team-members)

---

## 🎯 Overview

CrimsonTrace Frontend is a React‑based web application that visualizes financial transaction networks to detect money muling fraud rings. It provides an interactive graph interface showing all accounts and money flow, with suspicious nodes highlighted for easy identification.

### Key Features

- CSV File Upload: Drag-and-drop interface for transaction data
- Interactive Graph Visualization: Force-directed graph showing all accounts and money flow
- Real-time Analysis: Connects to backend API for fraud detection
- Fraud Ring Highlighting: Suspicious nodes are visually distinct (different colors/sizes)
- Pattern Detection: Visualizes cycles, fan-in/fan-out, and shell networks
- Downloadable Reports: JSON export of analysis results
- Ghost Mode: Filter to show only suspicious nodes
- Interactive Tooltips: Hover/click nodes to see account details

---

## 🛠️ Tech Stack

| Technology                | Purpose                              |
|---------------------------|--------------------------------------|
| React 18                  | UI framework                         |
| Vite                      | Build tool and dev server            |
| Tailwind CSS              | Styling                              |
| react-force-graph-2d      | Graph visualization                  |
| react-dropzone            | File upload                          |
| Netlify                   | Hosting and deployment               |

---

## 📁 Project Structure

```
crimsontrace/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── DownloadButton.jsx  # JSON export
│   │   ├── GraphView.jsx       # Interactive graph
│   │   ├── RingsTable.jsx      # Fraud rings table
│   │   ├── SummaryCard.jsx     # Statistics cards
│   │   └── Uploader.jsx        # File upload
│   ├── hooks/
│   │   └── useAnalysis.js      # API integration hook
│   ├── pages/
│   │   └── Home.jsx            # Main page
│   ├── utils/
│   │   └── graphHelpers.js     # Graph data transformation
│   ├── App.jsx                 # Root component
│   ├── main.jsx                # Entry point
│   ├── index.css               # Global styles
│   └── mockResponse.json       # Mock data for testing
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── index.html                 # HTML template
├── package.json               # Dependencies
├── postcss.config.js          # PostCSS config
├── tailwind.config.js         # Tailwind config
├── vercel.json                # Vercel deployment config
├── vite.config.js             # Vite config
├── README.md                  # This file
└── sample_transactions.csv    # Sample data for testing
``` 

---

## 💻 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/bhoomika1705126/crimson_trace.git
cd crimson_trace/crimsontrace

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file
# set VITE_API_URL and VITE_USE_MOCK as needed

# Run development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Build for production

```bash
npm run build
```

---

## 🔧 Environment Variables

| Variable        | Description                                 | Example                                      |
|-----------------|---------------------------------------------|----------------------------------------------|
| VITE_API_URL    | Backend API URL (with `/api` prefix)        | `https://crimson-trace.onrender.com/api`     |
| VITE_USE_MOCK   | Use mock data instead of real API           | `false`                                      |

---

## 🚀 Deployment

### Deploy to Netlify

1. Push code to GitHub
2. Login to Netlify
3. Click "Add new site" → "Import an existing project"
4. Connect to your GitHub repository
5. Configure:
   - Base directory: `crimsontrace`
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables:
   - `VITE_API_URL`: `https://crimson-trace.onrender.com/api`
   - `VITE_USE_MOCK`: `false`
7. Click "Deploy"

### Deploy to Vercel

1. Push code to GitHub
2. Login to Vercel
3. Click "Add New" → "Project"
4. Import your repository
5. Configure:
   - Root Directory: `crimsontrace`
   - Framework Preset: Vite
6. Add same environment variables as Netlify
7. Click "Deploy"

---

## 🎨 Features in Detail

- **Interactive Graph Visualization**
  - All account nodes from CSV
  - Directed edges showing money flow
  - Suspicious nodes in red (different colors per ring)
  - Normal nodes in gray
  - Click nodes to select and center
  - Hover nodes to see account details

- **Pattern Detection Visualization**
  - Cycle 🔴 (Rose)
  - Fan-in 🟠 (Orange)
  - Fan-out 🟡 (Yellow)
  - Shell 🟢 (Lime)

- **Ghost Mode**
  - Toggle to hide all normal nodes and focus only on suspicious accounts

- **Downloadable JSON Export**
  - Analysis results in exact format required by hackathon

---

## 📊 Sample Data

Use `sample_transactions.csv` for testing:

```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TXN_001,ACC_001,ACC_002,100.00,2024-01-15 10:30:00
TXN_002,ACC_002,ACC_003,200.00,2024-01-15 11:45:00
TXN_003,ACC_003,ACC_001,150.00,2024-01-15 12:20:00
```

---

## 🔌 API Contract

The frontend expects the backend to provide:

```json
{
  "suspicious_accounts": [
    {
      "account_id": "ACC_001",
      "suspicion_score": 95.2,
      "detected_patterns": ["cycle_length_3"],
      "ring_id": "RING_001"
    }
  ],
  "fraud_rings": [
    {
      "ring_id": "RING_001",
      "member_accounts": ["ACC_001", "ACC_002", "ACC_003"],
      "pattern_type": "cycle",
      "risk_score": 95.3
    }
  ],
  "summary": {
    "total_accounts_analyzed": 50,
    "suspicious_accounts_flagged": 5,
    "fraud_rings_detected": 2,
    "processing_time_seconds": 1.2
  },
  "all_nodes": ["ACC_001", "ACC_002", "ACC_003"],
  "all_edges": [
    {
      "source": "ACC_001",
      "target": "ACC_002",
      "amount": 100
    }
  ]
}
```


This project was created for the RIFT 2026 Hackathon.
