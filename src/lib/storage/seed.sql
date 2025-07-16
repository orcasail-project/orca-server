INSERT INTO Activity (name, ticket_price, notes) VALUES
('אבובים', 70.00, NULL),
('בננות', 60.00, NULL),
('טורנדו אקסטרים', 60.00, NULL),
('טורנדו רגוע', 60.00, NULL),
('שייט משפחות', 40.00, NULL),
('סירה', 50.00, 'לקוח שמצטרף לשבת בסירה בשעה שהיא גוררת אבובים או בננות – שייט מהיר');

INSERT INTO PopulationType (name, notes) VALUES
('מעורב', 'ניתן לשבץ באותה הסירה משפחה עם משפחה'),
('נשים', 'ניתן לשבץ נשים בלבד'),
('גברים', 'ניתן לשבץ גברים בלבד'),
('חילוני', 'ניתן לשבץ חילונים בלבד'),
('פרטי', 'לא ניתן לצרף'),
('קבוצה', NULL);

INSERT INTO Permission (name, can_assign, can_change_status) VALUES
('מנהל', TRUE, TRUE),         
('סקיפר', TRUE, FALSE),      
('עובד משרד', TRUE, TRUE);    

INSERT INTO PaymentType (name) VALUES
('אשראי'),
('מזומן'),
('העברה בנקאית');

INSERT INTO Boat (name, max_passengers, notes) VALUES
('טיל כחול', 15, 'מבצע את כל הפעילויות'),
('טייפון', 15, 'מבצע את כל הפעילויות'),
('טורפדו', 15, 'מבצע את כל הפעילויות'),
('קמיקזה', 14, 'אבובים, בננות רגוע, טורנדו בינוני'),
('לוי', 12, 'שייט משפחות בלבד');



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
    OR (b.name = 'קמיקזה' AND a.name IN ('אבובים', 'טורנדו רגוע')) 
    OR (b.name = 'לוי' AND a.name = 'שייט משפחות');
SELECT 'Data seeding completed successfully' AS status;