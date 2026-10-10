# ⚡ EV ChargeHub – Smart EV Charging Station Finder

EV ChargeHub is a web-based application designed to help electric vehicle owners discover EV charging stations, explore station details, and manage their charging experience through a simple and user-friendly interface.

## 🚀 Features

- 🔍 Search and explore EV charging stations
- 🗺️ Interactive map using Leaflet
- 📍 Nearby charging station discovery
- 🔐 User registration and login
- 🛡️ JWT-based authentication and role-based authorization
- 👤 User profile management
- ⭐ Favorite charging stations
- 📅 Booking management
- 🧑‍💼 Admin dashboard for station and user management
- 🌐 Integration with OpenChargeMap for charging station data

*Note: Features may depend on the current implementation and API configuration.*

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data MongoDB
- MongoDB Atlas
- Maven

### Frontend
- HTML5
- CSS3
- JavaScript
- Tailwind CSS
- Leaflet.js

### APIs and Tools
- OpenChargeMap API
- IntelliJ IDEA
- Visual Studio Code
- Git and GitHub

## 📁 Project Structure

```text
EV-ChargeHub/
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       └── resources/
│   └── pom.xml
├── frontend/
│   ├── index.html
│   ├── pages/
│   ├── css/
│   └── js/
└── README.md
```

*The structure above is illustrative. Adjust it to match the actual repository folders.*

## ⚙️ Getting Started

### Prerequisites

- Java 21 or a compatible configured JDK
- Maven
- MongoDB Atlas account or a configured MongoDB instance
- OpenChargeMap API key for external station data

### 1. Clone the repository

```bash
git clone https://github.com/kaushikyash239/EV-ChargeHub.git
cd EV-ChargeHub
```

### 2. Configure the backend

Open the `backend` folder in IntelliJ IDEA.

Configure your MongoDB connection string, JWT secret, server port, and API keys using environment variables or a local configuration file that is excluded from Git.

Never commit real credentials or API secrets to GitHub.

### 3. Run the Spring Boot application

From the backend directory, run:

```bash
mvn spring-boot:run
```

If Maven Wrapper is included, you can also use:

```powershell
.\mvnw.cmd spring-boot:run
```

### 4. Run the frontend

Open the frontend folder in Visual Studio Code and launch the main HTML page using Live Server or your configured static web server.

Ensure the frontend API base URL matches the backend server configuration.

## 🔒 Security

- Passwords should be stored using secure password hashing.
- Protected endpoints require appropriate authentication and authorization.
- Keep database credentials, JWT secrets, admin credentials, and API keys out of version control.
- Configure CORS and environment-specific settings before deployment.

## 🎯 Project Objective

The objective of EV ChargeHub is to make EV charging station discovery more convenient by combining station search, map-based exploration, user authentication, and charging management features in one application.

## 👨‍💻 Project Information

**Project:** EV ChargeHub – Smart EV Charging Station Finder and Management System

**Project Type:** BCA Minor Project

**Backend Development:** Yash Sharma

**Repository:** [EV-ChargeHub](https://github.com/kaushikyash239/EV-ChargeHub)

## 📌 Future Enhancements

- Live charger availability updates
- Advanced station filtering
- Online booking and payment integration
- Charging cost estimation
- Deployment with production-ready configuration

---

⭐ If you find this project interesting, feel free to explore the repository and share feedback.
