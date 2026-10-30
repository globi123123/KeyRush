import { defineSnippets } from '../types'

export const sqlSnippets = defineSnippets('sql', [
  {
    title: 'Basic select',
    code: `
SELECT name, email
FROM users
WHERE active = 1
ORDER BY name;`,
  },
  {
    title: 'Inner join',
    code: `
SELECT o.id, c.name, o.total
FROM orders AS o
JOIN customers AS c ON c.id = o.customer_id
WHERE o.total > 100;`,
  },
  {
    title: 'Aggregation',
    code: `
SELECT country, COUNT(*) AS customers
FROM customers
GROUP BY country
HAVING COUNT(*) >= 10
ORDER BY customers DESC;`,
  },
  {
    title: 'Create table',
    code: `
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    title: 'Insert rows',
    code: `
INSERT INTO products (name, price)
VALUES
  ('Keyboard', 89.90),
  ('Mouse', 39.50),
  ('Monitor', 249.00);`,
  },
  {
    title: 'Safe update',
    code: `
UPDATE accounts
SET balance = balance - 50
WHERE id = 42 AND balance >= 50;`,
  },
  {
    title: 'Subquery',
    code: `
SELECT name, salary
FROM employees
WHERE salary > (
  SELECT AVG(salary)
  FROM employees
);`,
  },
  {
    title: 'Common table expression',
    code: `
WITH monthly AS (
  SELECT DATE_TRUNC('month', created_at) AS month,
         SUM(total) AS revenue
  FROM orders
  GROUP BY 1
)
SELECT month, revenue
FROM monthly
ORDER BY month;`,
  },
  {
    title: 'Anti join',
    code: `
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
  },
  {
    title: 'Window function',
    code: `
SELECT
  name,
  department,
  salary,
  RANK() OVER (
    PARTITION BY department
    ORDER BY salary DESC
  ) AS position
FROM employees;`,
  },
  {
    title: 'Index and cleanup',
    code: `
CREATE INDEX idx_orders_customer
ON orders (customer_id);

DELETE FROM sessions
WHERE expires_at < CURRENT_TIMESTAMP;`,
  },
])
