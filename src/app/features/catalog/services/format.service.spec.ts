// src/app/features/catalog/services/format.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { FormatService } from './format.service';
import { provideHttpClient } from '@angular/common/http';
import type { PrintFormat } from '../models/print-format.model';

describe('FormatService (Unit Tests)', () => {
  let service: FormatService;
  const STORAGE_KEY = 'artshop.printFormats';

  beforeEach(() => {
    // Clear localStorage avant chaque test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [FormatService, provideHttpClient()],
    });

    service = TestBed.inject(FormatService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initialisation', () => {
    it('devrait être créé', () => {
      expect(service).toBeTruthy();
    });

    it('devrait initialiser 5 formats par défaut (A6, A5, A4, A3, A2)', async () => {
      const formats = await service.getAll();
      expect(formats.length).toBe(5);

      const names = formats.map((f) => f.name);
      expect(names).toContain('A6');
      expect(names).toContain('A5');
      expect(names).toContain('A4');
      expect(names).toContain('A3');
      expect(names).toContain('A2');
    });

    it('devrait charger les formats depuis localStorage si présents', async () => {
      // Nettoyer et réinitialiser le TestBed
      TestBed.resetTestingModule();
      localStorage.clear();

      const customFormat: PrintFormat = {
        id: 99,
        name: 'Custom',
        slug: 'custom',
        width: 50,
        height: 50,
        unit: 'cm',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([customFormat]));

      // Recréer le TestBed et le service pour qu'il charge depuis localStorage
      TestBed.configureTestingModule({
        providers: [FormatService, provideHttpClient()],
      });

      const newService = TestBed.inject(FormatService);
      const formats = await newService.getAll();

      expect(formats.length).toBe(1);
      expect(formats[0].name).toBe('Custom');
    });

    it('devrait exposer un signal formats() réactif', () => {
      const formatsSig = service.formats();
      expect(Array.isArray(formatsSig)).toBe(true);
      expect(formatsSig.length).toBe(5);
    });
  });

  describe('getAll() et getCount()', () => {
    it('getAll() devrait retourner tous les formats', async () => {
      const all = await service.getAll();
      expect(all.length).toBe(5);
    });

    it('getAll(true) devrait retourner uniquement les formats actifs', async () => {
      // Désactiver un format
      const formats = service.formats();
      const a6 = formats.find((f) => f.name === 'A6');
      if (a6) {
        await service.update(a6.id, { isActive: false });
      }

      const active = await service.getAll(true);
      const all = await service.getAll(false);

      expect(active.length).toBe(4);
      expect(all.length).toBe(5);
      expect(active.every((f) => f.isActive)).toBe(true);
    });

    it('getCount() devrait retourner le nombre total de formats', async () => {
      const count = await service.getCount();
      expect(count).toBe(5);
    });

    it('getCount(true) devrait compter uniquement les formats actifs', async () => {
      const formats = service.formats();
      const a5 = formats.find((f) => f.name === 'A5');
      if (a5) {
        await service.update(a5.id, { isActive: false });
      }

      const countActive = await service.getCount(true);
      const countAll = await service.getCount(false);

      expect(countActive).toBe(4);
      expect(countAll).toBe(5);
    });
  });

  describe('getById() et getBySlug()', () => {
    it('getById() devrait retourner le format correspondant', async () => {
      const formats = service.formats();
      const firstId = formats[0].id;

      const found = await service.getById(firstId);
      expect(found).toBeTruthy();
      expect(found!.id).toBe(firstId);
    });

    it('getById() devrait retourner null si introuvable', async () => {
      const found = await service.getById(9999);
      expect(found).toBeNull();
    });

    it('getBySlug() devrait retourner le format correspondant', async () => {
      const found = await service.getBySlug('a4');
      expect(found).toBeTruthy();
      expect(found!.name).toBe('A4');
      expect(found!.slug).toBe('a4');
    });

    it('getBySlug() devrait retourner null si introuvable', async () => {
      const found = await service.getBySlug('inexistant');
      expect(found).toBeNull();
    });
  });

  describe('create()', () => {
    it('devrait créer un nouveau format avec id auto-incrémenté', async () => {
      const newFormat = await service.create({
        name: 'Carré',
        slug: 'carre',
        width: 30,
        height: 30,
        unit: 'cm',
        isActive: true,
        description: 'Format carré personnalisé',
      });

      expect(newFormat.id).toBeTruthy();
      expect(newFormat.name).toBe('Carré');
      expect(newFormat.slug).toBe('carre');
      expect(newFormat.createdAt).toBeTruthy();
      expect(newFormat.updatedAt).toBeTruthy();

      const all = await service.getAll();
      expect(all.length).toBe(6); // 5 defaults + 1 nouveau
    });

    it('devrait générer automatiquement le slug depuis le nom si absent', async () => {
      const newFormat = await service.create({
        name: 'Grand Format',
        slug: '',
        width: 100,
        height: 70,
        unit: 'cm',
        isActive: true,
      });

      expect(newFormat.slug).toBe('grand-format');
    });

    it('devrait rejeter si le slug existe déjà', async () => {
      await expectAsync(
        service.create({
          name: 'Duplicate A4',
          slug: 'a4', // Déjà existant
          width: 21,
          height: 29.7,
          unit: 'cm',
          isActive: true,
        })
      ).toBeRejectedWithError('Slug déjà utilisé.');
    });

    it('devrait rejeter si le nom est trop court', async () => {
      await expectAsync(
        service.create({
          name: 'A',
          slug: 'a',
          width: 10,
          height: 10,
          unit: 'cm',
          isActive: true,
        })
      ).toBeRejectedWithError('Nom invalide.');
    });

    it('devrait rejeter si les dimensions sont invalides', async () => {
      await expectAsync(
        service.create({
          name: 'Invalid',
          slug: 'invalid',
          width: 0,
          height: -10,
          unit: 'cm',
          isActive: true,
        })
      ).toBeRejectedWithError('Dimensions invalides.');
    });
  });

  describe('update()', () => {
    it('devrait mettre à jour un format existant', async () => {
      const formats = service.formats();
      const a6 = formats.find((f) => f.name === 'A6');
      expect(a6).toBeTruthy();

      const originalUpdatedAt = a6!.updatedAt;

      // Attendre 10ms pour garantir que updatedAt change
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await service.update(a6!.id, {
        description: 'Description mise à jour',
        isActive: false,
      });

      expect(updated.description).toBe('Description mise à jour');
      expect(updated.isActive).toBe(false);
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it('devrait rejeter si le format est introuvable', async () => {
      await expectAsync(service.update(9999, { name: 'Test' })).toBeRejectedWithError(
        'Format introuvable.'
      );
    });

    it('devrait rejeter si le nouveau slug existe déjà', async () => {
      const formats = service.formats();
      const a6 = formats.find((f) => f.name === 'A6');

      await expectAsync(
        service.update(a6!.id, { slug: 'a4' }) // a4 existe déjà
      ).toBeRejectedWithError('Slug déjà utilisé.');
    });

    it('devrait accepter un slug identique (même format)', async () => {
      const formats = service.formats();
      const a5 = formats.find((f) => f.name === 'A5');

      const updated = await service.update(a5!.id, { slug: 'a5', name: 'A5 Updated' });
      expect(updated.slug).toBe('a5');
      expect(updated.name).toBe('A5 Updated');
    });
  });

  describe('remove()', () => {
    it('devrait supprimer un format existant', async () => {
      const formats = service.formats();
      const a2 = formats.find((f) => f.name === 'A2');
      expect(a2).toBeTruthy();

      await service.remove(a2!.id);

      const all = await service.getAll();
      expect(all.length).toBe(4);
      expect(all.find((f) => f.name === 'A2')).toBeUndefined();
    });

    it("ne devrait pas lever d'erreur si le format n'existe pas", async () => {
      await expectAsync(service.remove(9999)).toBeResolved();
    });
  });

  describe('slugify()', () => {
    it('devrait normaliser correctement les chaînes', () => {
      expect(service.slugify('Grand Format')).toBe('grand-format');
      expect(service.slugify('  Espace  ')).toBe('espace');
      expect(service.slugify('Accents éàù')).toBe('accents-eau');
      expect(service.slugify('Multi---Dash')).toBe('multi-dash');
      expect(service.slugify('Special@#$%Characters')).toBe('specialcharacters');
    });
  });

  describe('isSlugUnique()', () => {
    it('devrait retourner true si le slug est unique', async () => {
      const isUnique = await service.isSlugUnique('nouveau-slug');
      expect(isUnique).toBe(true);
    });

    it('devrait retourner false si le slug existe déjà', async () => {
      const isUnique = await service.isSlugUnique('a4');
      expect(isUnique).toBe(false);
    });

    it('devrait ignorer le format spécifié (pour update)', async () => {
      const formats = service.formats();
      const a3 = formats.find((f) => f.name === 'A3');

      const isUnique = await service.isSlugUnique('a3', a3!.id);
      expect(isUnique).toBe(true); // Même slug, mais même ID = OK
    });
  });

  describe('Persistance localStorage', () => {
    it('devrait persister automatiquement après création', async () => {
      await service.create({
        name: 'Test Persist',
        slug: 'test-persist',
        width: 25,
        height: 35,
        unit: 'cm',
        isActive: true,
      });

      // Attendre l'effet de persistance
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as PrintFormat[];
      expect(parsed.some((f) => f.slug === 'test-persist')).toBe(true);
    });

    it('devrait persister automatiquement après suppression', async () => {
      const formats = service.formats();
      const toDelete = formats[0];

      await service.remove(toDelete.id);

      // Attendre l'effet de persistance
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!) as PrintFormat[];
      expect(parsed.find((f) => f.id === toDelete.id)).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('devrait gérer des unités différentes (mm, in)', async () => {
      const mmFormat = await service.create({
        name: 'Format MM',
        slug: 'format-mm',
        width: 210,
        height: 297,
        unit: 'mm',
        isActive: true,
      });

      expect(mmFormat.unit).toBe('mm');

      const inFormat = await service.create({
        name: 'Format IN',
        slug: 'format-in',
        width: 8.5,
        height: 11,
        unit: 'in',
        isActive: true,
      });

      expect(inFormat.unit).toBe('in');
    });

    it('devrait trier les formats par date de création (décroissant)', async () => {
      await service.create({
        name: 'First',
        slug: 'first',
        width: 10,
        height: 10,
        unit: 'cm',
        isActive: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.create({
        name: 'Second',
        slug: 'second',
        width: 20,
        height: 20,
        unit: 'cm',
        isActive: true,
      });

      const all = service.formats();
      const firstIdx = all.findIndex((f) => f.slug === 'first');
      const secondIdx = all.findIndex((f) => f.slug === 'second');

      // Le plus récent (second) doit être avant first
      expect(secondIdx).toBeLessThan(firstIdx);
    });
  });
});
