require("dotenv").config()
const express = require("express")
const cors = require("cors")
const connectDB = require("./config/db")
const authRoutes = require("./routes/auth")
const goalsRoutes = require("./routes/goals")
const usersRoutes = require("./routes/Users")
const expensesRoutes = require("./routes/expenses")
const incomesRoutes = require("./routes/incomes")
const dashboardRoutes = require("./routes/dashboard")

console.log(process.env.MONGO_URI)

// Initialize app FIRST
const app = express()

// Connect DB
connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/goals", goalsRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/expenses", expensesRoutes)
app.use("/api/incomes", incomesRoutes)
app.use("/api/dashboard", dashboardRoutes)

app.get("/", (req, res) => {
  res.send("Finance Tracker API Running")
})

const authMiddleware = require("./middleware/authMiddleware")

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ msg: "Protected data", user: req.user })
})


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

