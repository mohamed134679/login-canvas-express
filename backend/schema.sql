create DATABASE University_HR_ManagementSystem;
GO
USE University_HR_ManagementSystem;
GO


CREATE FUNCTION HRSalary_calculation
(@employee_ID int) 
Returns decimal(10,2)
AS
Begin
Declare @salary decimal(10,2)
Declare @base_salary decimal(10,2)
Declare @percentage_YOE decimal(10,2)
Declare @YOE int

SELECT @base_salary = base_salary, @percentage_YOE = percentage_YOE  ,@YOE= E.years_of_experience
FROM Employee_Role ER
INNER JOIN Role R
ON ER.role_name = R.role_name
INNER JOIN Employee E
ON E.employee_ID = ER.emp_ID
WHERE employee_ID = @employee_ID
Order by R.rank ASC
SET @salary = @base_salary + (@percentage_YOE/100) * @YOE * @base_salary
Return @salary
END

GO

CREATE PROC createAllTables
AS

	CREATE TABLE Department(
	name varchar(50) primary key,
	building_location varchar(50)
	);

	CREATE TABLE Employee(
	employee_id int primary key identity,
	first_name varchar(50),
	last_name varchar(50),
	email varchar(50),
	password varchar(50),
	address varchar(50),
	gender CHAR(1),
	official_day_off varchar(50),
	years_of_experience int,
	national_ID char(16),
	employment_status varchar(50) CHECK(employment_status IN ('active', 'onleave', 'notice_period','resigned')),
	type_of_contract varchar(50),CHECK(type_of_contract IN ('full_time','part_time')),
	emergency_contact_name varchar(50),
	emergency_contact_phone char(11),
	annual_balance int,
	accidental_balance int,
	salary AS dbo.HRSalary_calculation(employee_id),
	hire_date date,
	last_working_date date,
	dept_name varchar(50) foreign key references Department
	);

	CREATE TABLE Employee_Phone(
	emp_id int foreign key references Employee,
	phone_num char(11),
	primary key(emp_id, phone_num)
	);

	CREATE TABLE Role(
	role_name varchar (50) PRIMARY KEY,
	title varchar (50),
	description varchar (50),
	rank int, 
	base_salary decimal (10,2),
	percentage_YOE decimal (4,2),
	percentage_overtime decimal (4,2), 
	annual_balance int,
	accidental_balance int
	);

	CREATE TABLE Employee_Role(
	emp_ID int foreign key references Employee,
	role_name varchar(50) foreign key references Role,
	primary key(emp_ID, role_name)
	);




	CREATE TABLE Role_existsIn_Department(
	department_name varchar(50) FOREIGN KEY references Department,
	Role_name varchar(50) FOREIGN KEY references Role,
	PRIMARY KEY(department_name, role_name)
	);
	CREATE TABLE Leave (
	request_ID int PRIMARY KEY IDENTITY,
	date_of_request date,
	start_date date,
	end_date date,
	num_days AS DATEDIFF(day, start_date, end_date)+1,
	final_approval_status varchar(50) CHECK(final_approval_status IN('Approved', 'Pending', 'Rejected'))  DEFAULT('Pending')
	);


	CREATE TABLE Annual_Leave (
	request_ID int PRIMARY KEY FOREIGN KEY REFERENCES LEAVE,
	emp_ID  int FOREIGN KEY REFERENCES Employee,
	replacement_emp  int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Accidental_Leave (
	request_ID int PRIMARY KEY FOREIGN KEY REFERENCES LEAVE,
	emp_ID int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Medical_Leave(
	request_ID  int PRIMARY KEY FOREIGN KEY REFERENCES LEAVE,
	insurance_status BIT,
	disability_details varchar(50),
	type varchar(50) CHECK(type IN ('sick','maternity')),
	Emp_ID  int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Unpaid_Leave(
	request_ID  int PRIMARY KEY FOREIGN KEY REFERENCES LEAVE,
	Emp_ID  int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Compensation_Leave(
	request_ID  int PRIMARY KEY FOREIGN KEY REFERENCES LEAVE,
	reason varchar (50),
	date_of_original_workday date,
	emp_ID int FOREIGN KEY REFERENCES Employee,
	replacement_emp  int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Document (
	document_id int primary key IDENTITY,
	type varchar (50),
	description varchar (50),
	file_name varchar (50),
	creation_date date, 
	expiry_date date, 
	status varchar (50) CHECK(status in ('valid', 'expired')),
	emp_ID int FOREIGN KEY REFERENCES Employee, 
	medical_ID int FOREIGN KEY REFERENCES MEDICAL_LEAVE, 
	unpaid_ID INT FOREIGN KEY REFERENCES UNPAID_LEAVE
	);

	CREATE TABLE Payroll (
	ID int PRIMARY KEY IDENTITY,
	payment_date date,
	final_salary_amount decimal (10,1),
	from_date date,
	to_date date,
	comments varchar(150),
	bonus_amount decimal(10,2),
	deductions_amount decimal(10,2),
	emp_ID int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Attendance (
	attendance_ID int PRIMARY KEY IDENTITY,
	date date,
	check_in_time time, 
	check_out_time time, 
	total_duration as DATEDIFF(Minute, check_in_time,check_out_time),
	status varchar(50) CHECK(status IN ('Absent', 'Attended')) DEFAULT('Absent'),
	emp_ID int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Deduction (
	deduction_ID int IDENTITY,
	emp_ID INT FOREIGN KEY REFERENCES Employee,
	date date,
	amount decimal (10,2),
	type varchar (50) CHECK(type IN ('unpaid', 'missing_hours', 'missing_days')),
	status varchar (50) CHECK(status IN ('pending', 'finalized')) DEFAULT('pending'),
	unpaid_ID int FOREIGN KEY REFERENCES Unpaid_leave,
	attendance_ID int FOREIGN KEY REFERENCES Attendance,
	PRIMARY KEY(deduction_id, emp_ID)
	);

	CREATE TABLE Performance (
	performance_ID int PRIMARY KEY IDENTITY,
	rating int CHECK(rating>=1 AND rating<=5),
	comments varchar (50),
	semester CHAR(3),
	emp_ID int FOREIGN KEY REFERENCES Employee
	);

	CREATE TABLE Employee_Replace_Employee (
	table_id INT IDENTITY,
	Emp1_ID INT FOREIGN KEY REFERENCES EMPLOYEE
	,
	Emp2_ID INT FOREIGN KEY REFERENCES EMPLOYEE
	,
	from_date date,
	to_date date,
	PRIMARY KEY(table_id, Emp1_ID, Emp2_ID)
	 );

	CREATE TABLE Employee_Approve_Leave(
	Emp1_ID INT FOREIGN KEY REFERENCES EMPLOYEE,
	leave_ID INT FOREIGN KEY REFERENCES Leave,
	status varchar(50) CHECK(status IN('Approved', 'Pending', 'Rejected')) DEFAULT('Pending'),

	 PRIMARY KEY(Emp1_ID, leave_ID)
	);
GO

exec createAllTables

go

CREATE FUNCTION HRLoginValidation
(@employee_ID int,
@password varchar(50)) 
Returns BIT
AS
Begin
Declare @success BIT
IF EXISTS (
	SELECT 1 FROM Employee E WHERE employee_id=@employee_ID AND password=@password
    and dept_name = 'HR')
   SET @success =1
ELSE
   SET @success =0;
Return @success
END
go

CREATE FUNCTION EmployeeLoginValidation
(@employee_ID int,
@password varchar(50)) 
Returns BIT
AS
Begin
Declare @success BIT
IF EXISTS (
	SELECT 1 FROM Employee E WHERE employee_id=@employee_ID AND password=@password and dept_name <> 'HR')
   SET @success =1
ELSE
   SET @success =0;
Return @success
END

GO

-- Sample data
insert into Department (name,building_location)
values ('MET','C building')
insert into Department (name,building_location)
values ('BI','B building')
insert into Department (name,building_location)
values ('HR','N building')
insert into Department (name,building_location)
values ('Medical','B building')

insert into Employee (first_name,last_name,email,
password,address,gender,official_day_off,years_of_experience,
national_ID,employment_status, type_of_contract,emergency_contact_name,
emergency_contact_phone,annual_balance,accidental_balance,hire_date,
last_working_date,dept_name)
values  ('Jack','John','jack.john@guc.edu.eg','123','new cairo',
'M','Saturday',0,'1234567890123456','active','full_time',
'Sarah','01234567892',
30,6,'09-01-2025',null,'MET'),

('Ahmed','Zaki','ahmed.zaki@guc.edu.eg','345',
'New Giza',
'M','Saturday',2,'1234567890123457','active','full_time',
'Mona Zaki','01234567893',
27,0,'09-01-2020',NULL,'BI'),

('Sarah','Sabry','sarah.sabry@guc.edu.eg','567',
'Korba',
'F','Thursday',5,'1234567890123458','active','full_time',
'Hanen Turk','01234567894',
0,4,'09-01-2020',NULL,'MET'),

 ('Ahmed','Helmy','ahmed.helmy@guc.edu.eg','908',
'new Cairo',
'M','Thursday',2,'1234567890123459','active','full_time',
'Mona Zaki','01234567895',
8,4,'09-01-2019',NULL,'HR'),

('Menna','Shalaby','menna.shalaby@guc.edu.eg','670',
'Heliopolis',
'F','Saturday',0,'1234567890123451','active','full_time',
'Mayan Samir','01234567896',
6,2,'09-01-2018',NULL,'HR'), 

('Mohamed','Ahmed','mohamed.ahmedy@guc.edu.eg','9087',
'Nasr City',
'M','Saturday',7,'1234567890123452','active','part_time',
'Marwan Samir','01234567897',
NULL,6,'09-01-2025',NULL,'BI'),

('Esraa','Ahmed','esraa.ahmedy@guc.edu.eg','5690',
'New Cairo',
'F','Saturday',2,'1234567890123453','active','full_time',
'Magy Ahmed','01234567898',
36,6,'09-01-2024',NULL,'Medical'),

 ('Magy','Zaki','magy.zaki@guc.edu.eg','3790',
'6th of October city',
'F','Thursday',4,'1234567890123454','onleave','full_time',
'Mariam Ahmed','01234567899',
0,6,'01-01-2023',NULL,'BI'),

('Amr','Diab','amr.diab@guc.edu.eg','8954',
'Heliopolis',
'M','Saturday',4,'1234567890123450','active','full_time',
'Dina','01234567891',
10,10,'09-01-2023',NULL,'MET'),

 ('Marwan','Khaled','marwan.Khaled@guc.edu.eg','9023',
'New Cairo',
'M','Saturday',12,'1234567890123455','active','full_time',
'Omar Ahmed','01234567840',
NULL,NULL,'09-01-2024',NULL,'HR') ,

('Hazem','Ali','hazem.ali@guc.edu.eg','h@123',
'New Giza',
'M','Saturday',30,'1234567890123420','active','full_time',
'Fatma Alaa','01234567871',
55,25,'09-01-2008',NULL,'MET'),

('Hadeel','Adel','hadeel.adel@guc.edu.eg','ha@123',
'Korba',
'F','Saturday',20,'1234567890123220','active','full_time',
'Mariam Alaa','01234567861',
3,12,'09-01-2010',NULL,'MET');
