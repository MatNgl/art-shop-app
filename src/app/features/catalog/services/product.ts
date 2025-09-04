import { Injectable, signal } from '@angular/core';
import { Product, ProductCategory, ProductFilter } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<Product[]>([
    {
      id: 1,
      title: 'Paysage Urbain au Crépuscule',
      description:
        'Une vue impressionnante de la ville au coucher du soleil, capturant les jeux de lumière entre les bâtiments modernes.',
      price: 450,
      originalPrice: 500,
      category: ProductCategory.PAINTING,
      tags: ['urbain', 'crépuscule', 'moderne', 'architecture'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1519681393784-d120c3b4fd18?w=800&h=600&fit=crop',
      ],
      artist: {
        id: 1,
        name: 'Marie Dubois',
        bio: 'Artiste spécialisée dans les paysages urbains et les architectures modernes.',
        profileImage:
          'https://images.unsplash.com/photo-1494790108755-2616b169a1b4?w=150&h=150&fit=crop&crop=face',
        website: 'https://marie-dubois-art.com',
      },
      technique: 'Huile sur toile',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 2,
      title: 'Monochrome',
      description:
        'Un portrait saisissant explorant les émotions humaines à travers des traits expressifs et des couleurs vibrantes.',
      price: 320,
      category: ProductCategory.DRAWING,
      tags: ['portrait', 'expressif', 'émotion', 'visage'],
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'],
      artist: {
        id: 2,
        name: 'Jean-Pierre Moreau',
        bio: 'Portraitiste reconnu pour son style expressionniste contemporain.',
        profileImage:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
      technique: 'Fusain et pastel',
      dimensions: { width: 35, height: 50, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: true,
      editionNumber: 1,
      totalEditions: 5,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 3,
      title: 'Abstraction Colorée',
      description:
        'Une explosion de couleurs et de formes géométriques créant une composition dynamique et moderne.',
      price: 280,
      category: ProductCategory.DIGITAL_ART,
      tags: ['abstrait', 'coloré', 'géométrique', 'moderne'],
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop'],
      artist: {
        id: 3,
        name: 'Sophie Martin',
        bio: 'Artiste digitale spécialisée dans les arts abstraits et les compositions géométriques.',
        profileImage:
          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
      technique: 'Art numérique',
      dimensions: { width: 40, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 10,
      isLimitedEdition: false,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
    },
    {
      id: 4,
      title: 'Nature Morte Classique',
      description:
        'Une composition élégante des objets du quotidien dans un style classique, jouant avec la lumière et les ombres.',
      price: 380,
      category: ProductCategory.PAINTING,
      tags: ['nature morte', 'classique', 'lumière', 'tradition'],
      imageUrl: 'assets/products/IMG_6265.JPG',
      images: ['assets/products/IMG_6265.JPG'],
      artist: {
        id: 4,
        name: 'Antoine Roux',
        bio: 'Peintre traditionnel inspiré par les maîtres classiques.',
        profileImage:
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      technique: 'Huile sur toile',
      dimensions: { width: 45, height: 35, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 5,
      title: 'Paysage Montagnard',
      description:
        'Vue panoramique des Alpes capturant la majesté des sommets enneigés et la sérénité de la nature.',
      price: 520,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['paysage', 'montagne', 'nature', 'panoramique'],
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'],
      artist: {
        id: 5,
        name: 'Claire Beaumont',
        bio: 'Photographe de nature spécialisée dans les paysages de montagne.',
        profileImage:
          'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
      },
      technique: 'Photographie numérique',
      dimensions: { width: 70, height: 50, unit: 'cm' },
      isAvailable: true,
      stock: 3,
      isLimitedEdition: true,
      editionNumber: 2,
      totalEditions: 10,
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05'),
    },
    {
      id: 6,
      title: 'Esquisse Urbaine',
      description:
        'Croquis rapide de la vie urbaine, capturant les énergies et le mouvement de la ville.',
      price: 150,
      category: ProductCategory.DRAWING,
      tags: ['esquisse', 'urbain', 'croquis', 'mouvement'],
      imageUrl: 'assets/products/IMG_6264.JPG',
      images: ['assets/products/IMG_6264.JPG'],
      artist: {
        id: 1,
        name: 'Marie Dubois',
        bio: 'Artiste spécialisée dans les paysages urbains et les architectures modernes.',
        profileImage:
          'https://images.unsplash.com/photo-1494790108755-2616b169a1b4?w=150&h=150&fit=crop&crop=face',
      },
      technique: 'Crayon et encre',
      dimensions: { width: 25, height: 35, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25'),
    },
    {
      id: 7,
      title: 'Crevette',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 220,
      originalPrice: 260,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original', 'collection'],
      imageUrl: 'assets/products/IMG_3900.JPG',
      images: ['assets/products/IMG_3900.JPG'],
      artist: {
        id: 1001,
        name: 'Matthéo',
        bio: 'Créateur et photographe.',
      },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
    {
      id: 8,
      title: 'Fleur dans son vase',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 230,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3927.JPG',
      images: ['assets/products/IMG_3927.JPG'],
      artist: { id: 1002, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-02'),
      updatedAt: new Date('2024-03-02'),
    },
    {
      id: 9,
      title: 'Nénuphar',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 210,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_3930.JPG',
      images: ['assets/products/IMG_3930.JPG'],
      artist: { id: 1003, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-03'),
      updatedAt: new Date('2024-03-03'),
    },
    {
      id: 10,
      title: 'Nature morte aux citrons',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 245,
      originalPrice: 270,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'édition'],
      imageUrl: 'assets/products/IMG_3931.JPG',
      images: ['assets/products/IMG_3931.JPG'],
      artist: { id: 1004, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 2,
      isLimitedEdition: true,
      editionNumber: 1,
      totalEditions: 10,
      createdAt: new Date('2024-03-04'),
      updatedAt: new Date('2024-03-04'),
    },
    {
      id: 11,
      title: 'Crépuscule sur le rivage',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 235,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_3959.JPG',
      images: ['assets/products/IMG_3959.JPG'],
      artist: { id: 1005, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-03-05'),
    },
    {
      id: 12,
      title: 'Ciel sur la cathédrale',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 240,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'original'],
      imageUrl: 'assets/products/IMG_4054.JPG',
      images: ['assets/products/IMG_4054.JPG'],
      artist: { id: 1006, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-06'),
      updatedAt: new Date('2024-03-06'),
    },
    {
      id: 13,
      title: 'Tapisserie solaire',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 255,
      originalPrice: 290,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'promo'],
      imageUrl: 'assets/products/IMG_5378.JPG',
      images: ['assets/products/IMG_5378.JPG'],
      artist: { id: 1007, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 2,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-07'),
      updatedAt: new Date('2024-03-07'),
    },
    {
      id: 14,
      title: 'Anémone ivoire',
      description: 'Photographie originale issue de votre collection personnelle.',
      price: 265,
      category: ProductCategory.PHOTOGRAPHY,
      tags: ['photo', 'collection'],
      imageUrl: 'assets/products/IMG_6034.JPG',
      images: ['assets/products/IMG_6034.JPG'],
      artist: { id: 1008, name: 'Matthéo', bio: 'Créateur et photographe.' },
      technique: 'Photographie numérique',
      dimensions: { width: 60, height: 40, unit: 'cm' },
      isAvailable: true,
      stock: 1,
      isLimitedEdition: false,
      createdAt: new Date('2024-03-08'),
      updatedAt: new Date('2024-03-08'),
    },
  ]);

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getAllProducts(): Promise<Product[]> {
    await this.delay(300);
    return [...this.products()];
  }

  async getProductById(id: number): Promise<Product | null> {
    await this.delay(200);
    return this.products().find((p) => p.id === id) || null;
  }

  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    await this.delay(250);
    return this.products().filter((p) => p.category === category);
  }

  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    await this.delay(200);
    // Retourne les produits les plus récents ou en promotion
    return this.products()
      .filter((p) => p.isAvailable)
      .sort((a, b) => {
        // Priorité aux promotions, puis aux plus récents
        if (a.originalPrice && !b.originalPrice) return -1;
        if (!a.originalPrice && b.originalPrice) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }

  async searchProducts(filters: ProductFilter): Promise<Product[]> {
    await this.delay(300);
    let filtered = this.products().filter((p) => p.isAvailable);

    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.artist) {
      filtered = filtered.filter((p) =>
        p.artist.name.toLowerCase().includes(filters.artist!.toLowerCase())
      );
    }

    if (filters.technique) {
      filtered = filtered.filter((p) =>
        p.technique.toLowerCase().includes(filters.technique!.toLowerCase())
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm) ||
          p.description.toLowerCase().includes(searchTerm) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchTerm)) ||
          p.artist.name.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  getCategories(): ProductCategory[] {
    return Object.values(ProductCategory);
  }

  getCategoryLabel(category: ProductCategory): string {
    const labels: Record<ProductCategory, string> = {
      [ProductCategory.DRAWING]: 'Dessins',
      [ProductCategory.PAINTING]: 'Peintures',
      [ProductCategory.DIGITAL_ART]: 'Art Numérique',
      [ProductCategory.PHOTOGRAPHY]: 'Photographie',
      [ProductCategory.SCULPTURE]: 'Sculptures',
      [ProductCategory.MIXED_MEDIA]: 'Médias Mixtes',
    };
    return labels[category];
  }
}
