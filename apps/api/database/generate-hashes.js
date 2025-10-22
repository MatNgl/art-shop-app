// Script pour générer les hash bcrypt des mots de passe
// Usage: node generate-hashes.js

const bcrypt = require('bcrypt');

const passwords = {
  admin123: '',
  user123: '',
  password123: '',
  password456: ''
};

async function generateHashes() {
  console.log('Génération des hash bcrypt...\n');

  for (const [password, _] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    passwords[password] = hash;
    console.log(`${password}: ${hash}`);
  }

  console.log('\n✅ Hash générés avec succès!');
  console.log('\nCopiez ces hash dans seed-users.sql');
}

generateHashes().catch(console.error);
