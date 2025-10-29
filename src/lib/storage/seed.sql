-- הוספת נתונים לפעילויות
INSERT INTO Activity (name, min_age, ticket_price, max_people_total, notes) VALUES
('אבובים', 0, 70.00, 10, 'עד 2 אבובים לסירה, בכל אבוב עד 5 אנשים'),
('בננות', 0, 60.00, 12, 'עד 12 נוסעים על הבננה'),
('טורנדו אקסטרים', 0, 60.00, NULL, NULL),
('טורנדו רגוע', 0, 60.00, NULL, NULL),
('שייט משפחות', 0, 40.00, NULL, NULL),
('סירה', 0, 50.00, NULL, 'לקוח שמצטרף לשבת בסירה בשעה שהיא גוררת אבובים או בננות – שייט מהיר');

-- הוספת סוגי אוכלוסיה 
INSERT INTO PopulationType (name, notes) VALUES
('מעורב', 'ניתן לשבץ באותה הסירה משפחה עם משפחה'),
('נשים', 'ניתן לשבץ נשים בלבד'),
('גברים', 'ניתן לשבץ גברים בלבד'),
('חילוני', 'ניתן לשבץ חילונים בלבד'),
('פרטי', 'לא ניתן לצרף'),
('קבוצה', NULL);


INSERT INTO role (role_id, name) VALUES
  (1, 'מנהל'),
  (2, 'סקיפר'),
  (3, 'אדמין');


-- הוספת הרשאות
-- INSERT INTO Permission (name, can_assign, can_change_status, notes) VALUES
-- ('מנהל', TRUE, TRUE, NULL),         
-- ('סקיפר', TRUE, FALSE, NULL),      
-- ('עובד משרד', TRUE, TRUE, NULL);    

INSERT INTO Permission (role_id, name, can_assign, can_change_status, notes) VALUES
(1, 'מנהל', TRUE, TRUE, NULL),         -- מקשרים למנהל
(2, 'סקיפר', TRUE, FALSE, NULL),      -- מקשרים לסקיפר
(3, 'עובד משרד', TRUE, TRUE, NULL);    


-- הוספת סוגי תשלום
INSERT INTO PaymentType (name, notes) VALUES
('אשראי', NULL),
('מזומן', NULL),
('העברה בנקאית', NULL);

-- הוספת סירות 
INSERT INTO Boat (name, max_passengers, notes) VALUES
('טיל כחול', 15, 'מבצע את כל הפעילויות'),
('טייפון', 15, 'מבצע את כל הפעילויות'),
('טורפדו', 15, 'מבצע את כל הפעילויות'),
('קמיקזה', 14, 'אבובים, בננות, טורנדו רגוע'),
('לוי', 12, 'שייט משפחות בלבד');

-- הוספת קישורים בין סירות לפעילויות 
INSERT INTO BoatActivity (boat_id, activity_id)
SELECT 
    b.id, 
    a.id
FROM 
    Boat b
CROSS JOIN 
    Activity a
WHERE
    (b.name IN ('טיל כחול', 'טייפון', 'טורפדו'))
    OR (b.name = 'קמיקזה' AND a.name IN ('אבובים', 'בננות', 'טורנדו רגוע')) 
    OR (b.name = 'לוי' AND a.name = 'שייט משפחות');

SELECT 'Data seeding completed successfully' AS status;