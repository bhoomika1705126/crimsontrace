# 🔍 CrimsonTrace - Financial Crime Detection Engine

**Graph-Based Money Muling Detection System**

RIFT 2026 Hackathon | Graph Theory / Financial Crime Detection Track

---

## 🌐 Live Demo

**Live Application URL:** [Your Vercel URL Here]

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Algorithm Approach](#algorithm-approach)
- [Suspicion Score Methodology](#suspicion-score-methodology)
- [Installation & Setup](#installation--setup)
- [Usage Instructions](#usage-instructions)
- [API Contract](#api-contract)
- [Known Limitations](#known-limitations)
- [Team Members](#team-members)

---

## 🎯 Overview

CrimsonTrace is a web-based financial forensics engine that detects money muling networks through advanced graph analysis. Money muling is a critical component of financial crime where criminals use networks of individuals to transfer and layer illicit funds through multiple accounts.

### Key Features

- **CSV File Upload**: Drag-and-drop interface for transaction data
- **Interactive Graph Visualization**: Force-directed graph showing all accounts and money flow
- **Real-time Analysis**: Detects fraud rings within 30 seconds
- **Fraud Ring Detection**: Identifies cycles, fan-in/fan-out patterns, and shell networks
- **Downloadable Reports**: JSON output matching exact specification
- **Responsive Design**: Works on desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **react-force-graph** - Interactive graph visualization
- **react-dropzone** - File upload with drag-and-drop

### Deployment
- **Vercel** - Frontend hosting and deployment
- **Render** - Backend hosting

---

## 🏗️ System Architecture
