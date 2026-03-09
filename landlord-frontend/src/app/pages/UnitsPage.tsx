import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { DoorOpen, Plus, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function UnitsPage() {
  const { units, properties } = useApp();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('filter') || 'all');

  const filteredUnits = units.filter(unit => {
    const property = properties.find(p => p.id === unit.propertyId);
    const matchesSearch = unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Units</h1>
          <p className="text-gray-500 mt-1">Manage all your units</p>
        </div>
        <Link to="/dashboard/units/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Add Unit
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacating">Vacating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredUnits.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DoorOpen className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No units found</h3>
            <p className="text-gray-500 mb-4">Add units to your properties</p>
            <Link to="/dashboard/units/new">
              <Button>
                <Plus className="size-4 mr-2" />
                Add Unit
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit) => {
            const property = properties.find(p => p.id === unit.propertyId);
            return (
              <Link key={unit.id} to={`/dashboard/units/${unit.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={unit.photos[0] || property?.photos[0]}
                      alt={`Unit ${unit.unitNumber}`}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-3 right-3 capitalize ${getStatusColor(unit.status)}`}>
                      {unit.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg mb-1">{property?.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">Unit {unit.unitNumber}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rent:</span>
                        <span>${unit.monthlyRent}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Size:</span>
                        <span>{unit.bedrooms} bed • {unit.bathrooms} bath</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sq Ft:</span>
                        <span>{unit.squareFeet} sqft</span>
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
