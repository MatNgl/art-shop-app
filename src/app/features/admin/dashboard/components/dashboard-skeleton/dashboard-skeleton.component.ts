import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6 animate-pulse">
      <!-- KPIs Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (i of [1,2,3,4]; track i) {
          <div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex-1 space-y-3">
                <div class="h-4 bg-gray-200 rounded w-24"></div>
                <div class="h-8 bg-gray-300 rounded w-32"></div>
                <div class="h-3 bg-gray-200 rounded w-28"></div>
              </div>
              <div class="w-12 h-12 rounded-lg bg-gray-200"></div>
            </div>
          </div>
        }
      </div>

      <!-- Main Charts Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Large Chart -->
        <div class="lg:col-span-8">
          <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div class="h-5 bg-gray-300 rounded w-48"></div>
            </div>
            <div class="p-6">
              <div class="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        <!-- Side Chart -->
        <div class="lg:col-span-4">
          <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div class="h-5 bg-gray-300 rounded w-32"></div>
            </div>
            <div class="p-6">
              <div class="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (i of [1,2,3]; track i) {
          <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-6 border border-gray-200">
            <div class="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div class="h-8 bg-gray-300 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        }
      </div>
    </div>
  `,
})
export class DashboardSkeletonComponent {}
