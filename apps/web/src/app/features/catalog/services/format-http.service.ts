import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PrintFormat } from '../models/print-format.model';

@Injectable({ providedIn: 'root' })
export class FormatHttpService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/formats';

  // Signal pour compatibilité avec l'ancien service
  private _formats = signal<PrintFormat[]>([]);
  public readonly formats = this._formats.asReadonly();

  constructor() {
    // Charger les formats au démarrage
    this.loadFormats();
  }

  private async loadFormats() {
    const formats = await this.getAll();
    this._formats.set(formats);
  }

  /**
   * GET ALL FORMATS - Récupérer tous les formats
   */
  async getAll(): Promise<PrintFormat[]> {
    try {
      return await firstValueFrom(
        this.http.get<PrintFormat[]>(this.API_URL)
      );
    } catch {
      return [];
    }
  }

  /**
   * GET FORMAT BY ID - Récupérer un format par ID
   */
  async getById(id: number): Promise<PrintFormat | null> {
    try {
      return await firstValueFrom(
        this.http.get<PrintFormat>(`${this.API_URL}/${id}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * CREATE FORMAT - Créer un nouveau format (admin)
   */
  async create(format: Partial<PrintFormat>): Promise<PrintFormat | null> {
    try {
      return await firstValueFrom(
        this.http.post<PrintFormat>(this.API_URL, format)
      );
    } catch (error: any) {
      console.error('Error creating format:', error);
      return null;
    }
  }

  /**
   * UPDATE FORMAT - Mettre à jour un format (admin)
   */
  async update(id: number, updates: Partial<PrintFormat>): Promise<PrintFormat | null> {
    try {
      return await firstValueFrom(
        this.http.patch<PrintFormat>(`${this.API_URL}/${id}`, updates)
      );
    } catch (error: any) {
      console.error('Error updating format:', error);
      return null;
    }
  }

  /**
   * DELETE FORMAT - Supprimer un format (admin)
   */
  async delete(id: number): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.API_URL}/${id}`)
      );
      return true;
    } catch (error: any) {
      console.error('Error deleting format:', error);
      return false;
    }
  }

  /**
   * GET FORMATS BY TYPE - Filtrer par type
   */
  async getByType(type: string): Promise<PrintFormat[]> {
    const allFormats = await this.getAll();
    return allFormats.filter(f => f.type === type);
  }

  /**
   * GET AVAILABLE FORMATS - Formats disponibles seulement
   */
  async getAvailable(): Promise<PrintFormat[]> {
    const allFormats = await this.getAll();
    return allFormats.filter(f => f.isActive);
  }

  /**
   * GET COUNT - Nombre de formats
   */
  async getCount(): Promise<number> {
    const formats = await this.getAll();
    return formats.length;
  }

  /**
   * SLUGIFY - Convertir un nom en slug
   */
  slugify(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * REMOVE - Alias pour delete() pour compatibilité
   */
  async remove(id: number): Promise<boolean> {
    return this.delete(id);
  }
}
