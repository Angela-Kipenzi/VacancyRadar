import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Upload, X, Image, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, getAuthToken } from '../../lib/api';

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
    photos: existingUnit?.photos || [],
    videoTourUrl: (existingUnit as any)?.videoTourUrl || '',
    floorPlan: (existingUnit as any)?.floorPlan || '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingFloorPlan, setUploadingFloorPlan] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList): Promise<string[]> => {
    const data = new FormData();
    Array.from(files).forEach((file) => data.append('files', file));
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    });
    if (!res.ok) throw new Error('Upload failed');
    const json = await res.json();
    return (json.urls as string[]).map((u) => `${API_BASE_URL}${u}`);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    try {
      const urls = await uploadFiles(e.target.files);
      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }));
      toast.success(`${urls.length} photo(s) uploaded`);
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingVideo(true);
    try {
      const urls = await uploadFiles(e.target.files);
      setFormData((prev) => ({ ...prev, videoTourUrl: urls[0] }));
      toast.success('Video uploaded');
    } catch {
      toast.error('Video upload failed');
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingFloorPlan(true);
    try {
      const urls = await uploadFiles(e.target.files);
      setFormData((prev) => ({ ...prev, floorPlan: urls[0] }));
      toast.success('Floor plan uploaded');
    } catch {
      toast.error('Floor plan upload failed');
    } finally {
      setUploadingFloorPlan(false);
      if (floorPlanInputRef.current) floorPlanInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const unitData = {
      ...formData,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      squareFeet: Number(formData.squareFeet),
      monthlyRent: Number(formData.monthlyRent),
      securityDeposit: Number(formData.securityDeposit),
      photos: formData.photos.length > 0 ? formData.photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      amenities: existingUnit?.amenities || [],
      videoTourUrl: formData.videoTourUrl || undefined,
      floorPlan: formData.floorPlan || undefined,
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

        {/* Photos & Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="size-5" />
              Photos & Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Unit Photos */}
            <div>
              <Label>Unit Photos</Label>
              <p className="text-sm text-gray-500 mb-3">Upload photos of the unit interior, rooms, and features.</p>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {formData.photos.map((url: string, idx: number) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                      <img src={url} alt={`Unit photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-dashed border-2 h-20"
              >
                <Upload className="size-4 mr-2" />
                {uploading ? 'Uploading...' : 'Click to upload photos'}
              </Button>
            </div>

            {/* Video Walkthrough */}
            <div>
              <Label className="flex items-center gap-2">
                <Video className="size-4" />
                Video Walkthrough
              </Label>
              <p className="text-sm text-gray-500 mb-3">Upload a walkthrough video of the unit.</p>

              {formData.videoTourUrl && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Video className="size-4" />
                    Video uploaded
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, videoTourUrl: '' }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploadingVideo}
              >
                <Upload className="size-4 mr-2" />
                {uploadingVideo ? 'Uploading video...' : 'Upload video'}
              </Button>
            </div>

            {/* Floor Plan */}
            <div>
              <Label className="flex items-center gap-2">
                <FileText className="size-4" />
                Floor Plan
              </Label>
              <p className="text-sm text-gray-500 mb-3">Upload a floor plan image for this unit.</p>

              {formData.floorPlan && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <FileText className="size-4" />
                    Floor plan uploaded
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, floorPlan: '' }))}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              <input
                ref={floorPlanInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFloorPlanUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => floorPlanInputRef.current?.click()}
                disabled={uploadingFloorPlan}
              >
                <Upload className="size-4 mr-2" />
                {uploadingFloorPlan ? 'Uploading...' : 'Upload floor plan'}
              </Button>
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
