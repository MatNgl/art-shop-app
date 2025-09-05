import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AddressSuggestion {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        postcode?: string;
        country?: string;
        country_code?: string;
    };
}

@Injectable({ providedIn: 'root' })
export class AddressService {
    private http = inject(HttpClient);

    search(query: string): Observable<AddressSuggestion[]> {
        const params = new HttpParams()
            .set('q', query)
            .set('format', 'json')
            .set('addressdetails', '1')
            .set('limit', '6')
            .set('accept-language', 'fr');
        return this.http.get<AddressSuggestion[]>('https://nominatim.openstreetmap.org/search', { params });
    }
}
