/* Returns transactions per year grouped by country. Thought for world map */
USE openaid;
SELECT  recipient_country, YEAR(transaction.date) AS year, SUM(transaction.value) FROM activity
INNER JOIN transaction ON activity.iati_id = transaction.iati_id
GROUP BY recipient_country, year;
