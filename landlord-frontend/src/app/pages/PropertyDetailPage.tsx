import React from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit, MapPin, Phone, Mail } from 'lucide-react';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, units } = useApp();

  const property = properties.find(p => p.id === id);
  
  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Property not found</p>
        <Button onClick={() => navigate('/dashboard/properties')} className="mt-4">
          Back to Properties
        </Button>
      </div>
    );
  }

  const propertyUnits = units.filter(u => u.propertyId === property.id);
  const vacantUnits = propertyUnits.filter(u => u.status === 'vacant');
  const occupiedUnits = propertyUnits.filter(u => u.status === 'occupied');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/properties')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">{property.name}</h1>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <MapPin className="size-4" />
            <span>
              {property.address.street}, {property.address.city}, {property.address.state}
            </span>
          </div>
        </div>
        <Link to={`/dashboard/properties/${property.id}/edit`}>
          <Button variant="outline">
            <Edit className="size-4 mr-2" />
            Edit Property
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-2">
                {property.photos.map((photo, index) => (
                  <div key={index} className={`aspect-video relative overflow-hidden ${index === 0 ? 'col-span-2' : ''}`}>
                    <img
                      src={photo}
                      alt={`${property.name} ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{property.description}</p>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">{amenity}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Units */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Units ({propertyUnits.length})</CardTitle>
                <Link to="/dashboard/units/new">
                  <Button size="sm">Add Unit</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {propertyUnits.map((unit) => (
                  <Link key={unit.id} to={`/dashboard/units/${unit.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">Unit {unit.unitNumber}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {unit.bedrooms} bed • {unit.bathrooms} bath • {unit.squareFeet} sqft
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            unit.status === 'vacant' ? 'bg-green-100 text-green-800' :
                            unit.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }>
                            {unit.status}
                          </Badge>
                          <p className="text-sm mt-2">${unit.monthlyRent}/mo</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Property Type</p>
                <p className="text-lg capitalize">{property.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="text-lg">{propertyUnits.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupied</p>
                <p className="text-lg">{occupiedUnits.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vacant</p>
                <p className="text-lg text-orange-600">{vacantUnits.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupancy Rate</p>
                <p className="text-lg">
                  {propertyUnits.length > 0 
                    ? Math.round((occupiedUnits.length / propertyUnits.length) * 100) 
                    : 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-gray-500" />
                <span className="text-sm">{property.contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-gray-500" />
                <span className="text-sm">{property.contactInfo.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
