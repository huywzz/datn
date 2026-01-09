-- Lấy hashed password và semester_id
SET @hashedPassword = (
    SELECT `password` FROM `users`
    WHERE `email` = 'student1@gmail.com'
    LIMIT 1
);
SET @semesterId = (
    SELECT `semester_id` FROM `semesters`
    WHERE `status` = 'active'
    ORDER BY `semester_id`
    LIMIT 1
);

-- 1) Tạo/ghi đè 1001 users (user_id 101..1101)
-- Tạo dãy số từ 0 đến 1000 (tổng 1001 số)
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `status`)
SELECT
    101 + seq.n AS user_id,
    CONCAT('Student ', 101 + seq.n) AS name,
    CONCAT('student', 101 + seq.n, '@gmail.com') AS email,
    @hashedPassword,
    'student',
    TRUE
FROM (
    SELECT 
        (a.N + b.N*10 + c.N*100 + d.N*1000) AS n
    FROM
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1) d
    WHERE (a.N + b.N*10 + c.N*100 + d.N*1000) BETWEEN 0 AND 1000
) seq
ON DUPLICATE KEY UPDATE
    `name`     = VALUES(`name`),
    `email`    = VALUES(`email`),
    `password` = VALUES(`password`),
    `role`     = VALUES(`role`),
    `status`   = VALUES(`status`);

-- 2) Tạo/ghi đè 1001 students tương ứng (user_id 101..1101)
-- Dùng cùng logic tạo dãy số để đảm bảo user_id khớp chính xác
INSERT INTO `students`
(`student_code`, `user_id`, `full_name`, `class_code`, `major`,
 `year_of_study`, `current_year`, `current_semester`, `cohort_id`)
SELECT
    CONCAT('K22-', LPAD(101 + seq.n, 4, '0')) AS student_code,
    101 + seq.n AS user_id,
    CONCAT('Student ', 101 + seq.n) AS full_name,
    'CNTT1' AS class_code,
    'it' AS major,
    1 AS year_of_study,
    1 AS current_year,
    @semesterId AS current_semester,
    'K22' AS cohort_id
FROM (
    SELECT 
        (a.N + b.N*10 + c.N*100 + d.N*1000) AS n
    FROM
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
    CROSS JOIN
        (SELECT 0 AS N UNION ALL SELECT 1) d
    WHERE (a.N + b.N*10 + c.N*100 + d.N*1000) BETWEEN 0 AND 1000
) seq
ON DUPLICATE KEY UPDATE
    `full_name`       = VALUES(`full_name`),
    `class_code`      = VALUES(`class_code`),
    `major`           = VALUES(`major`),
    `year_of_study`   = VALUES(`year_of_study`),
    `current_year`     = VALUES(`current_year`),
    `current_semester` = VALUES(`current_semester`),
    `cohort_id`       = VALUES(`cohort_id`);
