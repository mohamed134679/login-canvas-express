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

// HR Login endpoint
app.post("/api/login/hr", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    console.log("HR Login attempt:", { employeeId });

    if (!employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Employee ID and password are required" 
      });
    }

    const connection = await db.connectDB();
    console.log("Database connected");
    
    // Use HRLoginValidation function
    const result = await connection.request()
      .input('employee_ID', employeeId)
      .input('password', password)
      .query(`SELECT dbo.HRLoginValidation(@employee_ID, @password) as isValid`);

    console.log("HR Validation result:", result.recordset);

    if (!result.recordset || result.recordset[0].isValid === false) {
      console.log("Invalid HR credentials");
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Fetch user details
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
        WHERE employee_id = @employee_ID AND dept_name = 'HR'
      `);

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const user = userResult.recordset[0];
    console.log("HR User found:", user);

    res.json({ 
      success: true, 
      message: "Login successful",
      userType: "hr",
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
    console.error("HR Login Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Academic Employee Login endpoint
app.post("/api/login/academic", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    console.log("Academic Login attempt:", { employeeId });

    if (!employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Employee ID and password are required" 
      });
    }

    const connection = await db.connectDB();
    console.log("Database connected");
    
    // Use EmployeeLoginValidation function (excludes HR)
    const result = await connection.request()
      .input('employee_ID', employeeId)
      .input('password', password)
      .query(`SELECT dbo.EmployeeLoginValidation(@employee_ID, @password) as isValid`);

    console.log("Academic Validation result:", result.recordset);

    if (!result.recordset || result.recordset[0].isValid === false) {
      console.log("Invalid academic credentials");
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Fetch user details
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
        WHERE employee_id = @employee_ID AND dept_name != 'HR'
      `);

    if (!userResult.recordset || userResult.recordset.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const user = userResult.recordset[0];
    console.log("Academic User found:", user);

    res.json({ 
      success: true, 
      message: "Login successful",
      userType: "academic",
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
    console.error("Academic Login Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Admin Login endpoint
app.post("/api/login/admin", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    console.log("Admin Login attempt:", { employeeId });

    if (!employeeId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Employee ID and password are required" 
      });
    }

    const connection = await db.connectDB();
    console.log("Database connected");
    
    // Check if employee exists with correct password
    const userResult = await connection.request()
      .input('employee_ID', employeeId)
      .input('password', password)
      .query(`
        SELECT 
          employee_id, 
          first_name, 
          last_name, 
          email, 
          dept_name,
          employment_status
        FROM Employee 
        WHERE employee_id = @employee_ID AND password = @password
      `);

    if (!userResult.recordset || userResult.recordset.length === 0) {
      console.log("Invalid admin credentials");
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const user = userResult.recordset[0];
    console.log("Admin User found:", user);

    res.json({ 
      success: true, 
      message: "Login successful",
      userType: "admin",
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
    console.error("Admin Login Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// HR OPERATIONS ENDPOINTS
// ============================================

// Approve or reject annual/accidental leave
app.post("/api/hr/leaves/annual-accidental/approve", async (req, res) => {
  try {
    const { requestId, hrId } = req.body;

    if (!requestId || !hrId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const connection = await db.connectDB();

    // Check if request exists in Annual_Leave or Accidental_Leave
    const leaveCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .query(`
        SELECT 1 FROM Annual_Leave WHERE request_ID = @request_ID
        UNION
        SELECT 1 FROM Accidental_Leave WHERE request_ID = @request_ID
      `);

    if (!leaveCheck.recordset || leaveCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Request ID not found in annual or accidental leaves" 
      });
    }

    // Check if this HR is assigned to approve this leave
    const assignmentCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .query(`
        SELECT 1 FROM Employee_Approve_Leave 
        WHERE leave_ID = @request_ID AND Emp1_ID = @HR_ID
      `);

    if (!assignmentCheck.recordset || assignmentCheck.recordset.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: "This leave request is not assigned to you" 
      });
    }

    await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .execute('HR_approval_an_acc');

    res.json({
      success: true,
      message: "Annual/Accidental leave processed successfully"
    });

  } catch (error) {
    console.error("Error processing annual/accidental leave:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve or reject unpaid leave
app.post("/api/hr/leaves/unpaid/approve", async (req, res) => {
  try {
    const { requestId, hrId } = req.body;

    if (!requestId || !hrId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const connection = await db.connectDB();

    // Check if request exists in Unpaid_Leave
    const leaveCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .query(`SELECT 1 FROM Unpaid_Leave WHERE request_ID = @request_ID`);

    if (!leaveCheck.recordset || leaveCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Request ID not found in unpaid leaves" 
      });
    }

    // Check if this HR is assigned to approve this leave
    const assignmentCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .query(`
        SELECT 1 FROM Employee_Approve_Leave 
        WHERE leave_ID = @request_ID AND Emp1_ID = @HR_ID
      `);

    if (!assignmentCheck.recordset || assignmentCheck.recordset.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: "This leave request is not assigned to you" 
      });
    }

    await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .execute('HR_approval_unpaid');

    res.json({
      success: true,
      message: "Unpaid leave processed successfully"
    });

  } catch (error) {
    console.error("Error processing unpaid leave:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve or reject compensation leave
app.post("/api/hr/leaves/compensation/approve", async (req, res) => {
  try {
    const { requestId, hrId } = req.body;

    if (!requestId || !hrId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const connection = await db.connectDB();

    // Check if request exists in Compensation_Leave
    const leaveCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .query(`SELECT 1 FROM Compensation_Leave WHERE request_ID = @request_ID`);

    if (!leaveCheck.recordset || leaveCheck.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Request ID not found in compensation leaves" 
      });
    }

    // Check if this HR is assigned to approve this leave
    const assignmentCheck = await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .query(`
        SELECT 1 FROM Employee_Approve_Leave 
        WHERE leave_ID = @request_ID AND Emp1_ID = @HR_ID
      `);

    if (!assignmentCheck.recordset || assignmentCheck.recordset.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: "This leave request is not assigned to you" 
      });
    }

    await connection.request()
      .input('request_ID', parseInt(requestId))
      .input('HR_ID', parseInt(hrId))
      .execute('HR_approval_comp');

    res.json({
      success: true,
      message: "Compensation leave processed successfully"
    });

  } catch (error) {
    console.error("Error processing compensation leave:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add missing hours deduction
app.post("/api/hr/deductions/missing-hours", async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, error: "Employee ID is required" });
    }

    const connection = await db.connectDB();

    // Check if deduction already exists for today
    const existingDeduction = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT 1 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND type = 'missing_hours'
        AND CAST(date AS DATE) = CAST(GETDATE() AS DATE)
      `);

    if (existingDeduction.recordset && existingDeduction.recordset.length > 0) {
      return res.json({
        success: true,
        message: "Deduction for missing hours already exists for today"
      });
    }

    // Get current deduction count for this employee in current month
    const beforeCount = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT COUNT(*) as count 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND MONTH(date) = MONTH(GETDATE())
        AND YEAR(date) = YEAR(GETDATE())
      `);

    console.log('Before count:', beforeCount.recordset[0].count);

    // Call stored procedure
    await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .execute('Deduction_hours');

    // Check if deduction was added
    const afterCount = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT COUNT(*) as count 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND MONTH(date) = MONTH(GETDATE())
        AND YEAR(date) = YEAR(GETDATE())
      `);

    console.log('After count:', afterCount.recordset[0].count);

    // Also check all deductions for this employee
    const allDeductions = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT deduction_ID, emp_ID, date, amount, type, status
        FROM Deduction 
        WHERE emp_ID = @employee_ID
        ORDER BY date DESC
      `);

    console.log('All deductions for employee', employeeId, ':', allDeductions.recordset);

    const deductionApplied = afterCount.recordset[0].count > beforeCount.recordset[0].count;

    res.json({
      success: true,
      message: deductionApplied 
        ? "Deduction applied successfully" 
        : "No missing hours found for this employee"
    });

  } catch (error) {
    console.error("Error processing missing hours deduction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add missing days deduction
app.post("/api/hr/deductions/missing-days", async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, error: "Employee ID is required" });
    }

    const connection = await db.connectDB();

    // Check if deduction already exists for today
    const existingDeduction = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT 1 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND type = 'missing_days'
        AND CAST(date AS DATE) = CAST(GETDATE() AS DATE)
      `);

    if (existingDeduction.recordset && existingDeduction.recordset.length > 0) {
      return res.json({
        success: true,
        message: "Deduction for missing days already exists for today"
      });
    }

    // Get current deduction count for this employee in current month
    const beforeCount = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT COUNT(*) as count 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND MONTH(date) = MONTH(GETDATE())
        AND YEAR(date) = YEAR(GETDATE())
      `);

    console.log('Before count (missing days):', beforeCount.recordset[0].count);

    // Call stored procedure
    await connection.request()
      .input('employee_id', parseInt(employeeId))
      .execute('Deduction_days');

    // Check if deduction was added
    const afterCount = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT COUNT(*) as count 
        FROM Deduction 
        WHERE emp_ID = @employee_ID 
        AND MONTH(date) = MONTH(GETDATE())
        AND YEAR(date) = YEAR(GETDATE())
      `);

    console.log('After count (missing days):', afterCount.recordset[0].count);

    // Also check all deductions for this employee
    const allDeductions = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT deduction_ID, emp_ID, date, amount, type, status
        FROM Deduction 
        WHERE emp_ID = @employee_ID
        ORDER BY date DESC
      `);

    console.log('All deductions for employee', employeeId, ':', allDeductions.recordset);

    const deductionApplied = afterCount.recordset[0].count > beforeCount.recordset[0].count;

    res.json({
      success: true,
      message: deductionApplied 
        ? "Deduction applied successfully" 
        : "No missing days found for this employee"
    });

  } catch (error) {
    console.error("Error processing missing days deduction:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate monthly payroll
app.post("/api/hr/payroll/generate", async (req, res) => {
  try {
    const { month, hrId } = req.body;

    if (!month) {
      return res.status(400).json({ success: false, error: "Month required" });
    }

    const connection = await db.connectDB();

    // Parse month YYYY-MM format
    const [year, monthNum] = month.split('-');

    // Get all employees and their salary data
    const result = await connection.request()
      .query(`
        SELECT 
          E.employee_id,
          E.first_name,
          E.last_name,
          E.salary as base_salary,
          ISNULL(dbo.Bonus_amount(E.employee_id), 0) as bonus,
          (SELECT ISNULL(SUM(amount), 0) FROM Deduction 
           WHERE emp_ID = E.employee_id 
           AND MONTH(date) = ${monthNum} 
           AND YEAR(date) = ${year}) as deductions
        FROM Employee E
        WHERE E.employment_status != 'resigned'
      `);

    const payrollRecords = result.recordset.map(row => ({
      employeeId: row.employee_id,
      employeeName: `${row.first_name} ${row.last_name}`,
      baseSalary: row.base_salary || 0,
      bonus: row.bonus || 0,
      deductions: row.deductions || 0,
      finalSalary: (row.base_salary || 0) + (row.bonus || 0) - (row.deductions || 0),
      status: 'generated'
    }));

    res.json({
      success: true,
      records: payrollRecords
    });

  } catch (error) {
    console.error("Error generating payroll:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend running on http://${HOST}:${PORT}`);
});
