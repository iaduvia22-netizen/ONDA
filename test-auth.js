const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const MASTER_EMAIL = "duviduvan22@gmail.com";
const MASTER_PASS = "3525645Dt/";

const test_inputs = [
  { e: "duviduvan22@gmail.com", p: "3525645Dt/" }
];

test_inputs.forEach(input => {
  const email = input.e.toLowerCase().trim();
  const password = input.p;
  
  console.log(`Testing: [${input.e}] / [${input.p}]`);
  
  if (email === MASTER_EMAIL && password === MASTER_PASS) {
    console.log("  MATCH: Master credentials matched!");
    const user = db.prepare("SELECT * FROM user WHERE email = ?").get(MASTER_EMAIL);
    if (user) {
      console.log("  DB: User found in database.");
      console.log("  DB PASSWORD CHECK:", user.password === MASTER_PASS ? "OK" : "FAILED (DB has different pass)");
    } else {
      console.log("  DB: User NOT found in database.");
    }
  } else {
    console.log("  MATCH: No match.");
  }
});

db.close();
