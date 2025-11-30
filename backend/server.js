import express from "express";
import cors from "cors";
import * as db from "./db.js";

const app = express();

// Middleware
app.use(cors({
  origin: ["http://localhost:8080", "http://127.0.0.1:8080"],
  credentials: true
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the backend server!" });
});

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    await db.connectDB();
    res.json({ success: true, message: "✅ Database connected successfully!" });
  } catch (error) {
    console.error("DB Connection Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { employeeId, password, userType } = req.body;

    console.log("Login attempt:", { employeeId, password, userType });

    // Validate input
    if (!employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Employee ID and password are required" 
      });
    }

    // Connect to database and call stored procedure
    const connection = await db.connectDB();
    console.log("Database connected");
    
    const result = await connection.request()
      .input('employee_ID', employeeId)
      .input('password', password)
      .execute('HRLoginValidation');

    console.log("Full result object:", JSON.stringify(result, null, 2));
    console.log("Return value:", result.returnValue);
    console.log("Recordset:", result.recordset);

    // HRLoginValidation is a FUNCTION that returns BIT
    // Check both returnValue and recordset to handle different mssql package versions
    let isValid = result.returnValue;
    
    if (isValid === undefined || isValid === null) {
      // Try recordset if returnValue not available
      if (result.recordset && result.recordset.length > 0) {
        isValid = result.recordset[0];
        console.log("Got validation from recordset:", isValid);
      }
    }

    console.log("Final validation result:", isValid);

    if (isValid === 0 || !isValid) {
      console.log("Invalid credentials - isValid is:", isValid);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Validation passed - fetch user details from Employee table
    const userResult = await connection.request()
      .input('employee_ID', employeeId)
      .query(`
        SELECT 
          employee_id, 
          first_name, 
          last_name, 
          email, 
          dept_name,
          employment_status
        FROM Employee 
        WHERE employee_id = @employee_ID
      `);

    console.log("User query result:", userResult);

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const user = userResult.recordset[0];
    console.log("User found:", user);

    res.json({ 
      success: true, 
      message: "Login successful",
      user: {
        id: user.employee_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        department: user.dept_name,
        status: user.employment_status
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend running on http://${HOST}:${PORT}`);
});
