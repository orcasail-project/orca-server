CREATE DATABASE IF NOT EXISTS orca_db;
USE orca_db;

CREATE TABLE Boat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_passengers INT NOT NULL,
    notes TEXT
);

CREATE TABLE Activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_age INT NOT NULL,
    ticket_price FLOAT NOT NULL,
    max_people_total INT,
    notes TEXT
);

CREATE TABLE BoatActivity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    boat_id INT NOT NULL,
    activity_id INT NOT NULL,
    FOREIGN KEY (boat_id) REFERENCES Boat(id),
    FOREIGN KEY (activity_id) REFERENCES Activity(id)
);

CREATE TABLE PopulationType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    notes TEXT
);

CREATE TABLE Sail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    planned_start_time TIME NOT NULL,
    actual_start_time TIME,
    end_time TIME,
    population_type_id INT NOT NULL,
    is_private_group BOOLEAN NOT NULL,
    boat_activity_id INT,
    requires_orca_escort BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (population_type_id) REFERENCES PopulationType(id),
    FOREIGN KEY (boat_activity_id) REFERENCES BoatActivity(boat_id)
);

CREATE TABLE Customer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    wants_whatsapp BOOLEAN DEFAULT FALSE,
    email VARCHAR(255),
    notes TEXT
);

CREATE TABLE PaymentType (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    notes TEXT
);

CREATE TABLE Booking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sail_id INT NOT NULL,
    customer_id INT NOT NULL,
    num_people_sail INT NOT NULL,
    num_people_activity INT NOT NULL,
    final_price FLOAT NOT NULL,
    payment_type_id INT NOT NULL,
    is_phone_booking BOOLEAN DEFAULT FALSE,
    customer_arrived BOOLEAN DEFAULT FALSE,
    notes TEXT,
    FOREIGN KEY (sail_id) REFERENCES Sail(id),
    FOREIGN KEY (customer_id) REFERENCES Customer(id),
    FOREIGN KEY (payment_type_id) REFERENCES PaymentType(id)
);

CREATE TABLE Permission (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    can_assign BOOLEAN NOT NULL,
    can_change_status BOOLEAN NOT NULL,
    notes TEXT
);

CREATE TABLE User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    permission_id INT NOT NULL,
    notes TEXT,
    FOREIGN KEY (permission_id) REFERENCES Permission(id)
);


