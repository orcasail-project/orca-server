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

INSERT INTO Permission (name) VALUES
('מנהל'),
('סקיפר'),
('עובד משרד');

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

-- הכנסת הקישורים בין סירות לפעילויות
INSERT INTO BoatActivity (boat_id, activity_id) VALUES
-- טיל כחול (מבצע הכל)
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'אבובים')),
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'בננות')),
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'טורנדו אקסטרים')),
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'טורנדו רגוע')),
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'שייט משפחות')),
((SELECT id FROM Boat WHERE name = 'טיל כחול'), (SELECT id FROM Activity WHERE name = 'סירה')),
-- טייפון (מבצע הכל)
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'אבובים')),
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'בננות')),
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'טורנדו אקסטרים')),
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'טורנדו רגוע')),
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'שייט משפחות')),
((SELECT id FROM Boat WHERE name = 'טייפון'), (SELECT id FROM Activity WHERE name = 'סירה')),
-- טורפדו (מבצע הכל)
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'אבובים')),
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'בננות')),
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'טורנדו אקסטרים')),
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'טורנדו רגוע')),
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'שייט משפחות')),
((SELECT id FROM Boat WHERE name = 'טורפדו'), (SELECT id FROM Activity WHERE name = 'סירה')),
-- קמיקזה
((SELECT id FROM Boat WHERE name = 'קמיקזה'), (SELECT id FROM Activity WHERE name = 'אבובים')),
((SELECT id FROM Boat WHERE name = 'קמיקזה'), (SELECT id FROM Activity WHERE name = 'טורנדו רגוע')),
-- לוי
((SELECT id FROM Boat WHERE name = 'לוי'), (SELECT id FROM Activity WHERE name = 'שייט משפחות'));

SELECT 'Data seeding completed successfully' AS status;