const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const newKeys = {
    key1: 'AIzaSyB2uj0AG1Wjfbtn8kLaXh9AW9k3pYRX98o',
    key2: 'AIzaSyDJImlbIQ2SE3b1IJe9YjIsLXeQJqnRRPs',
    key3: 'AIzaSyDp7cA4I_nndpxkWXnLMUnf0gmqDs7DnFk',
    key4: 'AIzaSyCyofL5sR10VjBJ-cXhpZuiURFBfILRUB8'
};

try {
    console.log("--- ACTUALIZANDO BÓVEDA DE LLAVES ---");
    
    // Preparar el statement para insertar o reemplazar
    const stmt = db.prepare(`
        INSERT INTO system_setting (key, value, updated_at) 
        VALUES (?, ?, ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const now = Date.now(); // Timestamp para updated_at (integer mode: timestamp en schema, pero better-sqlite maneja ints/strings. Drizzle usa date objects, aquí usaremos integer ms o unix epoch? Schema dice mode: "timestamp", so it expects date object or unix timestamp in ms usually depending on adapter. Let's use Date.now())
    
    // Drizzle sqlite-core integer mode: "timestamp" stores as Date object usually or number. Let's try passing numeric timestamp.
    
    Object.entries(newKeys).forEach(([key, value]) => {
        stmt.run(key, value, now);
        console.log(`✅ Llave actualizada: ${key}`);
    });

} catch (err) {
    console.error("Error actualizando DB:", err);
} finally {
    db.close();
}
