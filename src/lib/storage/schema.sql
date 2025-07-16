-- טבלת סירות
CREATE TABLE Boat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_passengers INT NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת פעילויות
CREATE TABLE Activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_age INT,
    ticket_price DECIMAL(10, 2) NOT NULL, -- תוקן: DECIMAL במקום FLOAT
    max_people_total INT,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת קישור בין סירה לפעילות
CREATE TABLE BoatActivity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boat_id INT NOT NULL,
    activity_id INT NOT NULL,
    FOREIGN KEY (boat_id) REFERENCES Boat(id),
    FOREIGN KEY (activity_id) REFERENCES Activity(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת סוגי אוכלוסיה
CREATE TABLE PopulationType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת הפלגות
CREATE TABLE Sail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `date` DATE NOT NULL,
    planned_start_time TIME NOT NULL,
    actual_start_time TIME,
    end_time TIME,
    population_type_id INT NOT NULL,
    is_private_group BOOLEAN NOT NULL DEFAULT FALSE,
    boat_activity_id INT,
    requires_orca_escort BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (population_type_id) REFERENCES PopulationType(id),
    FOREIGN KEY (boat_activity_id) REFERENCES BoatActivity(id) -- תוקן: הפניה ל-id
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת לקוחות
CREATE TABLE Customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    wants_whatsapp BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת סוגי תשלום
CREATE TABLE PaymentType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת הזמנות
CREATE TABLE Booking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sail_id INT NOT NULL,
    customer_id INT NOT NULL,
    num_people_sail INT NOT NULL,
    num_people_activity INT NOT NULL,
    final_price DECIMAL(10, 2) NOT NULL, -- תוקן: DECIMAL במקום FLOAT
    payment_type_id INT NOT NULL,
    is_phone_booking BOOLEAN DEFAULT FALSE,
    customer_arrived BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (sail_id) REFERENCES Sail(id),
    FOREIGN KEY (customer_id) REFERENCES Customer(id),
    FOREIGN KEY (payment_type_id) REFERENCES PaymentType(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת הרשאות
CREATE TABLE Permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    can_assign BOOLEAN NOT NULL,
    can_change_status BOOLEAN NOT NULL,
    notes TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- טבלת משתמשים
CREATE TABLE `User` ( -- שימוש ב-Backticks למניעת התנגשות עם מילה שמורה
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    permission_id INT NOT NULL,
    notes TEXT,
    FOREIGN KEY (permission_id) REFERENCES Permission(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



