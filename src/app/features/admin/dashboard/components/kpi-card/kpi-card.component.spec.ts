import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';
import { KpiData } from '../../models/dashboard.model';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format currency correctly', () => {
    const result = component.formatValue(1234.56, 'currency');
    expect(result).toContain('€');
    expect(result).toContain('1');
  });

  it('should format percentage correctly', () => {
    const result = component.formatValue(42.5, 'percentage');
    expect(result).toBe('42.5 %');
  });

  it('should format number correctly', () => {
    const result = component.formatValue(1000, 'number');
    expect(result).toContain('1');
  });

  it('should return correct trend icon', () => {
    expect(component.getTrendIcon('up')).toBe('↑');
    expect(component.getTrendIcon('down')).toBe('↓');
    expect(component.getTrendIcon('stable')).toBe('→');
  });

  it('should return correct trend color class', () => {
    expect(component.getTrendColorClass('up')).toBe('text-green-600');
    expect(component.getTrendColorClass('down')).toBe('text-red-600');
    expect(component.getTrendColorClass('stable')).toBe('text-gray-600');
  });

  it('should display KPI data correctly', () => {
    const mockData: KpiData = {
      label: 'Revenue',
      value: 5000,
      unit: 'currency',
      variation: 12.5,
      trend: 'up',
      icon: '💰',
    };

    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Revenue');
    expect(compiled.textContent).toContain('💰');
  });
});
