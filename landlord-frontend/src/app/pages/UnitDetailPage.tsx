import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit, QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { units, properties } = useApp();

  const unit = units.find(u => u.id === id);
  const property = unit ? properties.find(p => p.id === unit.propertyId) : null;

  if (!unit || !property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unit not found</p>
        <Button onClick={() => navigate('/dashboard/units')} className="mt-4">
          Back to Units
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'vacating': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/units')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">Unit {unit.unitNumber}</h1>
          <p className="text-gray-500 mt-1">{property.name}</p>
        </div>
        <Link to={`/dashboard/units/${unit.id}/edit`}>
          <Button variant="outline">
            <Edit className="size-4 mr-2" />
            Edit Unit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={unit.photos[0] || property.photos[0]}
                  alt={`Unit ${unit.unitNumber}`}
                  className="w-full h-full object-cover"
                />
                <Badge className={`absolute top-4 right-4 capitalize ${getStatusColor(unit.status)}`}>
                  {unit.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="text-lg">{unit.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="text-lg">{unit.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Square Feet</p>
                  <p className="text-lg">{unit.squareFeet} sqft</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Rent</p>
                  <p className="text-lg">${unit.monthlyRent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Security Deposit</p>
                  <p className="text-lg">${unit.securityDeposit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Date</p>
                  <p className="text-lg">{format(new Date(unit.availabilityDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              {unit.description && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-2">Description</p>
                  <p className="text-sm">{unit.description}</p>
                </div>
              )}

              {unit.amenities.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {unit.amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-6 bg-gray-100 rounded-lg inline-block">
                <QrCode className="size-24 mx-auto" />
              </div>
              <p className="text-xs text-gray-500 font-mono">{unit.qrCode}</p>
              <Button variant="outline" className="w-full">
                <Download className="size-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>

          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Property Name</p>
                <p className="text-sm">{property.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-sm">
                  {property.address.street}<br />
                  {property.address.city}, {property.address.state} {property.address.zipCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="text-sm">{property.contactInfo.phone}</p>
                <p className="text-sm">{property.contactInfo.email}</p>
              </div>
              <Link to={`/dashboard/properties/${property.id}`}>
                <Button variant="outline" className="w-full mt-2">
                  View Property
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
