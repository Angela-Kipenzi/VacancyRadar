import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users } from 'lucide-react';
import { format } from 'date-fns';

export default function TenantsPage() {
  const { tenants, units, properties } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Tenants</h1>
        <p className="text-gray-500 mt-1">Manage your tenants</p>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No tenants found</h3>
            <p className="text-gray-500">Tenants will appear here once they sign leases</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant) => {
            const unit = tenant.currentUnitId ? units.find(u => u.id === tenant.currentUnitId) : null;
            const property = unit ? properties.find(p => p.id === unit.propertyId) : null;

            return (
              <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg">
                          {tenant.firstName} {tenant.lastName}
                        </h3>
                        <Badge className={tenant.status === 'current' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {tenant.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Email:</strong> {tenant.email}</p>
                        <p><strong>Phone:</strong> {tenant.phone}</p>
                        {unit && property && (
                          <p><strong>Unit:</strong> {property.name} - Unit {unit.unitNumber}</p>
                        )}
                        {tenant.moveInDate && (
                          <p><strong>Move-in Date:</strong> {format(new Date(tenant.moveInDate), 'MMM d, yyyy')}</p>
                        )}
                        {tenant.moveOutDate && (
                          <p><strong>Move-out Date:</strong> {format(new Date(tenant.moveOutDate), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
