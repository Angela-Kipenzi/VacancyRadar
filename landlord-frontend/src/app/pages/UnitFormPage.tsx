import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { units, properties, addUnit, updateUnit } = useApp();
  
  const isEdit = !!id;
  const existingUnit = isEdit ? units.find(u => u.id === id) : null;

  const [formData, setFormData] = useState({
    propertyId: existingUnit?.propertyId || '',
    unitNumber: existingUnit?.unitNumber || '',
    bedrooms: existingUnit?.bedrooms || 1,
    bathrooms: existingUnit?.bathrooms || 1,
    squareFeet: existingUnit?.squareFeet || 0,
    monthlyRent: existingUnit?.monthlyRent || 0,
    securityDeposit: existingUnit?.securityDeposit || 0,
    description: existingUnit?.description || '',
    status: existingUnit?.status || 'vacant',
    availabilityDate: existingUnit?.availabilityDate || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const unitData = {
      ...formData,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      squareFeet: Number(formData.squareFeet),
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit),
      photos: existingUnit?.photos || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      amenities: existingUnit?.amenities || [],
    };

    if (isEdit && existingUnit) {
      updateUnit(existingUnit.id, unitData);
      toast.success('Unit updated successfully');
    } else {
      addUnit(unitData as any);
      toast.success('Unit added successfully');
    }

    navigate('/dashboard/units');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/units')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{isEdit ? 'Edit Unit' : 'Add New Unit'}</h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Update unit information' : 'Enter unit details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="propertyId">Property</Label>
              <Select value={formData.propertyId} onValueChange={(value) => setFormData({ ...formData, propertyId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unitNumber">Unit Number</Label>
                <Input
                  id="unitNumber"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="vacating">Vacating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  value={formData.squareFeet}
                  onChange={(e) => setFormData({ ...formData, squareFeet: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="securityDeposit">Security Deposit ($)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="availabilityDate">Availability Date</Label>
              <Input
                id="availabilityDate"
                type="date"
                value={formData.availabilityDate}
                onChange={(e) => setFormData({ ...formData, availabilityDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/units')}>
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Unit' : 'Add Unit'}
          </Button>
        </div>
      </form>
    </div>
  );
}
