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
    const { employeeId, fromDate, toDate } = req.body;

    if (!employeeId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, error: "Employee ID, from date, and to date are required" });
    }

    const connection = await db.connectDB();

    // Check if payroll already exists for this employee in this period
    const existingPayroll = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .input('from_date', fromDate)
      .input('to_date', toDate)
      .query(`
        SELECT 1 
        FROM Payroll 
        WHERE emp_ID = @employee_ID 
        AND from_date = @from_date 
        AND to_date = @to_date
      `);

    if (existingPayroll.recordset && existingPayroll.recordset.length > 0) {
      return res.json({
        success: true,
        message: "Payroll for this employee in that period already exists"
      });
    }

    // Call Add_Payroll stored procedure
    await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .input('from', fromDate)
      .input('to', toDate)
      .execute('Add_Payroll');

    // Get the payroll record that was just added
    const payrollResult = await connection.request()
      .input('employee_ID', parseInt(employeeId))
      .query(`
        SELECT TOP 1 
          P.ID,
          P.payment_date,
          P.final_salary_amount,
          P.from_date,
          P.to_date,
          P.comments,
          P.bonus_amount,
          P.deductions_amount,
          P.emp_ID,
          E.first_name,
          E.last_name,
          E.salary as base_salary
        FROM Payroll P
        INNER JOIN Employee E ON P.emp_ID = E.employee_ID
        WHERE P.emp_ID = @employee_ID
        ORDER BY P.payment_date DESC
      `);

    if (!payrollResult.recordset || payrollResult.recordset.length === 0) {
      return res.status(404).json({ success: false, error: "Payroll record not found" });
    }

    const payroll = payrollResult.recordset[0];

    res.json({
      success: true,
      message: "Payroll added successfully",
      payroll: {
        payrollId: payroll.ID,
        employeeId: payroll.emp_ID,
        employeeName: `${payroll.first_name} ${payroll.last_name}`,
        baseSalary: payroll.base_salary,
        bonusAmount: payroll.bonus_amount,
        deductionsAmount: payroll.deductions_amount,
        finalSalary: payroll.final_salary_amount,
        fromDate: payroll.from_date,
        toDate: payroll.to_date,
        paymentDate: payroll.payment_date,
        comments: payroll.comments
      }
    });

  } catch (error) {
    console.error("Error generating payroll:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ADMIN OPERATIONS ENDPOINTS
// ============================================

// 2. Get All Employees
app.get('/api/admin/employees', async (req, res) => {
    try {
        const connection = await db.connectDB();
        const result = await connection.request().query('SELECT * FROM allEmployeeProfiles');
        res.json({ employees: result.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Employees Per Department
app.get('/api/admin/departments', async (req, res) => {
    try {
        const connection = await db.connectDB();
        const result = await connection.request().query('SELECT * FROM NoEmployeeDept');
        res.json({ departments: result.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Rejected Medical Leaves
app.get('/api/admin/rejected-medicals', async (req, res) => {
    try {
        const connection = await db.connectDB();
        const result = await connection.request().query('SELECT * FROM allRejectedMedicals');
        res.json({ rejectedRequests: result.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Remove Resigned Employee Deductions
app.post('/api/admin/remove-resigned-deductions', async (req, res) => {
    try {
        const connection = await db.connectDB();
        await connection.request().query('EXEC Remove_Deductions');
        res.json({ success: true, message: "Deductions for resigned employees removed successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 6. Update Attendance
app.post('/api/admin/update-attendance', async (req, res) => {
    const { employeeId, checkIn, checkOut } = req.body;
    try {
        if (!employeeId || !checkIn || !checkOut) {
            return res.status(400).json({ success: false, error: "Employee ID, check-in and check-out times are required" });
        }

        const connection = await db.connectDB();
        const sql = await import('mssql');
        
        // Format times as HH:MM:SS if they're in HH:MM format
        const formatTime = (time) => {
            if (time.length === 5) { // HH:MM format
                return `${time}:00`; // Convert to HH:MM:SS
            }
            return time;
        };

        await connection.request()
            .input('Employee_id', sql.default.Int, parseInt(employeeId))
            .input('check_in_time', sql.default.VarChar(8), formatTime(checkIn))
            .input('check_out_time', sql.default.VarChar(8), formatTime(checkOut))
            .execute('Update_Attendance');
        res.json({ success: true, message: "Attendance updated successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 7. Add Holiday
app.post('/api/admin/add-holiday', async (req, res) => {
    const { holidayName, fromDate, toDate } = req.body;
    try {
        const connection = await db.connectDB();
        const sql = await import('mssql');
        await connection.request()
            .input('holiday_name', sql.default.VarChar(50), holidayName)
            .input('from_date', sql.default.Date, fromDate)
            .input('to_date', sql.default.Date, toDate)
            .execute('Add_Holiday');
        res.json({ success: true, message: "Holiday added successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 8. Initiate Attendance
app.post('/api/admin/initiate-attendance', async (req, res) => {
    try {
        const connection = await db.connectDB();
        await connection.request().execute('Initiate_Attendance');
        res.json({ success: true, message: "Attendance initiated for all employees" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===================== Admin Part 2 =====================
// 1. Get attendance records for all employees for yesterday
app.get('/api/admin/attendance-yesterday', async (req, res) => {
  try {
      const connection = await db.connectDB();
      const result = await connection.request().query('SELECT * FROM allEmployeeAttendance');
      res.json({
          success: true,
          message: "Fetched yesterday's attendance records successfully",
          count: result.recordset.length,
          data: result.recordset
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});


// 2. Get performance details for all employees in all Winter semesters
app.get('/api/admin/performance-winter', async (req, res) => {
  try {
      const connection = await db.connectDB();
      const result = await connection.request().query('SELECT * FROM allPerformance');
      res.json({
          success: true,
          message: "Fetched Winter performance records successfully",
          count: result.recordset.length,
          data: result.recordset
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});


// 3. Remove attendance records for all employees during official holidays
app.post('/api/admin/remove-holiday-attendance', async (req, res) => {
  try {
      const connection = await db.connectDB();
      await connection.request().query('EXEC Remove_Holiday');
      res.json({
          success: true,
          message: "Attendance records during official holidays removed successfully"
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Remove unattended dayoff for an employee in the current month
app.post('/api/admin/remove-dayoff', async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
      return res.status(400).json({
          success: false,
          error: "Employee ID is required"
      });
  }

  try {
      const connection = await db.connectDB();
      const sql = await import('mssql');

      await connection.request()
          .input('Employee_id', sql.default.Int, parseInt(employeeId))
          .execute('Remove_DayOff');

      res.json({
          success: true,
          message: `Unattended dayoff records removed successfully for employee ${employeeId}`
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Remove approved leaves for a certain employee from attendance records
app.post('/api/admin/remove-approved-leaves', async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
      return res.status(400).json({
          success: false,
          error: "Employee ID is required"
      });
  }

  try {
      const connection = await db.connectDB();
      const sql = await import('mssql');

      await connection.request()
          .input('Employee_id', sql.default.Int, parseInt(employeeId))
          .execute('Remove_Approved_Leaves');

      res.json({
          success: true,
          message: `Approved leaves removed from attendance for employee ${employeeId}`
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Replace another employee
app.post('/api/admin/replace-employee', async (req, res) => {
  const { emp1Id, emp2Id, fromDate, toDate } = req.body;

  if (!emp1Id || !emp2Id || !fromDate || !toDate) {
      return res.status(400).json({
          success: false,
          error: "emp1Id, emp2Id, fromDate and toDate are all required"
      });
  }

  try {
      const connection = await db.connectDB();
      const sql = await import('mssql');

      await connection.request()
          .input('Emp1_ID', sql.default.Int, parseInt(emp1Id))
          .input('Emp2_ID', sql.default.Int, parseInt(emp2Id))
          .input('from_date', sql.default.Date, fromDate)
          .input('to_date', sql.default.Date, toDate)
          .execute('Replace_employee');

      res.json({
          success: true,
          message: `Employee ${emp1Id} successfully replaced by ${emp2Id} from ${fromDate} to ${toDate}`
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Update the employee’s employment_status based on leave/active
app.post('/api/admin/update-employment-status', async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
      return res.status(400).json({
          success: false,
          error: "Employee ID is required"
      });
  }

  try {
      const connection = await db.connectDB();
      const sql = await import('mssql');

      await connection.request()
          .input('Employee_ID', sql.default.Int, parseInt(employeeId))
          .execute('Update_Employment_Status');

      res.json({
          success: true,
          message: `Employment status updated successfully for employee ${employeeId}`
      });
  } catch (err) {
      res.status(500).json({ success: false, error: err.message });
  }
});





// =================== End Admin Part 2 ====================




const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ Backend running on http://${HOST}:${PORT}`);
});
