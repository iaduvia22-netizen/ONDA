const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const MASTER_EMAIL = "duviduvan22@gmail.com";
const MASTER_PASS = "3525645Dt/";

try {
  console.log("1. Eliminando usuario maestro existente...");
  const info = db.prepare("DELETE FROM user WHERE email = ?").run(MASTER_EMAIL);
  console.log(`   Eliminados: ${info.changes}`);

  console.log("2. Creando usuario maestro limpio...");
  const id = crypto.randomUUID();
  const stmt = db.prepare("INSERT INTO user (id, name, email, role, password, image) VALUES (?, ?, ?, ?, ?, ?)");
  stmt.run(id, "Duvi duvan", MASTER_EMAIL, "admin", MASTER_PASS, "https://api.dicebear.com/7.x/avataaars/svg?seed=Duvi");
  
  console.log("3. Verificando inserción...");
  const user = db.prepare("SELECT * FROM user WHERE email = ?").get(MASTER_EMAIL);
  console.log("   Usuario Maestro:", user);
  
  if (user && user.password === MASTER_PASS) {
      console.log("\n✅ EXITOSO: La cuenta maestra ha sido reiniciada correctamente.");
  } else {
      console.log("\n❌ FALLO: Algo salió mal en la creación.");
  }

} catch(err) {
  console.error("Error crítico:", err);
}

db.close();
