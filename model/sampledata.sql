INSERT INTO events (id, title, dayOfWeek, eventTime, timeZone, info)
VALUES
('5fV7uQl6', 'Rote Leibchen', 3, '20:30:00', 'Europe/Berlin', 'Clayallee'),
('PLJNuY1j', 'Sonntagsfußball', 0, '11:30:00', 'Europe/Berlin', 'Eichkamp');


INSERT INTO participants (event_id, user_id, there) 
VALUES 
('5fV7uQl6', '52HJssm8', true), 
('5fV7uQl6', 'Marc H.', false), 
('PLJNuY1j', 'Marc H.', true);