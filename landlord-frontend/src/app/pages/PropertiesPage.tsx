import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Building2, Plus, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function PropertiesPage() {
  const { properties, units } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;
    return matchesSearch && matchesType;
  });

  const getPropertyStats = (propertyId: string) => {
    const propertyUnits = units.filter(u => u.propertyId === propertyId);
    const vacantCount = propertyUnits.filter(u => u.status === 'vacant').length;
    return {
      total: propertyUnits.length,
      vacant: vacantCount,
      occupied: propertyUnits.length - vacantCount,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Properties</h1>
          <p className="text-gray-500 mt-1">Manage all your properties</p>
        </div>
        <Link to="/dashboard/properties/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No properties found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first property</p>
            <Link to="/dashboard/properties/new">
              <Button>
                <Plus className="size-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            const stats = getPropertyStats(property.id);
            return (
              <Link key={property.id} to={`/dashboard/properties/${property.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={property.photos[0]}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 right-3 capitalize">
                      {property.type}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg mb-2">{property.name}</h3>
                    <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
                      <MapPin className="size-4 mt-0.5 shrink-0" />
                      <span>
                        {property.address.street}, {property.address.city}, {property.address.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="text-gray-500">Total Units:</span>
                        <span className="ml-2">{stats.total}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Vacant:</span>
                        <span className={`ml-2 ${stats.vacant > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {stats.vacant}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
