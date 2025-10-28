#!/usr/bin/env node

/**
 * Script de migration automatique UUID → INTEGER
 *
 * Ce script remplace automatiquement :
 * - @PrimaryGeneratedColumn('uuid') → @PrimaryGeneratedColumn()
 * - id: string → id: number
 * - userId: string → userId: number
 * - categoryId: string → categoryId: number
 * - productId: string → productId: number
 * - formatId: string → formatId: number
 * - orderId: string → orderId: number
 * - ParseUUIDPipe → ParseIntPipe
 * - @Param('id') id: string → @Param('id') id: number
 * - findOne(id: string) → findOne(id: number)
 * - etc.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src', 'modules');

// Patterns de remplacement
const replacements = [
  // Entités
  { from: /@PrimaryGeneratedColumn\('uuid'\)/g, to: '@PrimaryGeneratedColumn()' },
  { from: /@Column\(\{ name: '(\w+)_id', type: 'uuid'/g, to: "@Column({ name: '$1_id', type: 'integer'" },
  { from: /@Column\(\{ type: 'uuid'/g, to: "@Column({ type: 'integer'" },

  // IDs dans les déclarations de propriétés
  { from: /\bid: string;/g, to: 'id: number;' },
  { from: /\buserId: string/g, to: 'userId: number' },
  { from: /\bcategoryId: string/g, to: 'categoryId: number' },
  { from: /\bproductId: string/g, to: 'productId: number' },
  { from: /\bformatId: string/g, to: 'formatId: number' },
  { from: /\borderId: string/g, to: 'orderId: number' },
  { from: /\bparentId: string/g, to: 'parentId: number' },
  { from: /\bvariantId: string/g, to: 'variantId: number' },
  { from: /\bsubCategoryId: string/g, to: 'subCategoryId: number' },
  { from: /\bsuspendedBy: string/g, to: 'suspendedBy: number' },

  // Paramètres de méthodes
  { from: /findOne\(id: string\)/g, to: 'findOne(id: number)' },
  { from: /findByUser\(userId: string\)/g, to: 'findByUser(userId: number)' },
  { from: /update\(id: string,/g, to: 'update(id: number,' },
  { from: /remove\(id: string\)/g, to: 'remove(id: number)' },
  { from: /suspend\(\s*id: string,\s*suspendedBy: string,/g, to: 'suspend(id: number, suspendedBy: number,' },
  { from: /reactivate\(id: string\)/g, to: 'reactivate(id: number)' },
  { from: /recordLoginAttempt\(id: string,/g, to: 'recordLoginAttempt(id: number,' },
  { from: /create\(userId: string,/g, to: 'create(userId: number,' },
  { from: /updateStatus\(id: string,/g, to: 'updateStatus(id: number,' },
  { from: /updateNotes\(id: string,/g, to: 'updateNotes(id: number,' },

  // Controllers - ParseUUIDPipe
  { from: /ParseUUIDPipe/g, to: 'ParseIntPipe' },
  { from: /@Param\('id'\) id: string/g, to: "@Param('id') id: number" },
  { from: /@Param\('parentId'\) parentId: string/g, to: "@Param('parentId') parentId: number" },
  { from: /@Param\('subCategoryId'\) subCategoryId: string/g, to: "@Param('subCategoryId') subCategoryId: number" },

  // JWT Strategy et Auth
  { from: /sub: string;/g, to: 'sub: number;' },
  { from: /"sub": "\$\{user\.id\}"/g, to: '"sub": user.id' },
  { from: /payload\.sub as string/g, to: 'payload.sub as number' },
  { from: /\{ id: payload\.sub \}/g, to: '{ id: payload.sub }' },

  // Responses et DTOs
  { from: /NotFoundExpection\(`Utilisateur avec l'ID \$\{id\} introuvable`\)/g, to: "NotFoundException(`Utilisateur avec l'ID ${id} introuvable`)" },

  // Imports
  { from: /import \{ ParseUUIDPipe/g, to: 'import { ParseIntPipe' },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(rootDir, filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updatedCount += walkDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts')) {
      if (processFile(filePath)) {
        updatedCount++;
      }
    }
  });

  return updatedCount;
}

console.log('🚀 Starting UUID → INTEGER migration...\n');
console.log(`📁 Root directory: ${rootDir}\n`);

const totalUpdated = walkDirectory(rootDir);

console.log(`\n✅ Migration completed!`);
console.log(`📊 Total files updated: ${totalUpdated}`);
console.log('\n⚠️  Please review the changes and run: npm run build');
