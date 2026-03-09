import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FileSignature } from 'lucide-react';
import { Link } from 'react-router';
import { format } from 'date-fns';

export default function LeasesPage() {
  const { leases, units, properties, tenants } = useApp();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Leases</h1>
        <p className="text-gray-500 mt-1">Manage rental agreements</p>
      </div>

      {leases.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileSignature className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No leases found</h3>
            <p className="text-gray-500">Leases will appear here when created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {leases.map((lease) => {
            const unit = units.find(u => u.id === lease.unitId);
            const property = properties.find(p => p.id === lease.propertyId);
            const tenant = tenants.find(t => t.id === lease.tenantId);

            return (
              <Card key={lease.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg">
                          {tenant?.firstName} {tenant?.lastName}
                        </h3>
                        <Badge className={`capitalize ${getStatusColor(lease.status)}`}>
                          {lease.status}
                        </Badge>
                        {lease.signatureStatus === 'pending' && (
                          <Badge variant="outline">Awaiting Signature</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Property:</strong> {property?.name} - Unit {unit?.unitNumber}</p>
                        <p><strong>Rent:</strong> ${lease.monthlyRent}/month</p>
                        <p><strong>Start Date:</strong> {format(new Date(lease.startDate), 'MMM d, yyyy')}</p>
                        <p><strong>End Date:</strong> {format(new Date(lease.endDate), 'MMM d, yyyy')}</p>
                        {lease.signedAt && (
                          <p><strong>Signed:</strong> {format(new Date(lease.signedAt), 'MMM d, yyyy')}</p>
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
