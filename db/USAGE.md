

# Grabbing data from IATI
The script iati_scraper.js grabs the data from IATI and puts them into the 
mysql database. It tends to run out of memory, so to increase memory in node use
flag:
  node --max-old-space-size=4096 iati_scraper.js
