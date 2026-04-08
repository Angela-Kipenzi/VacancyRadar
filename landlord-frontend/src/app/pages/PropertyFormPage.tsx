import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { ArrowLeft, Upload, X, Image, Video, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, getAuthToken } from '../../lib/api';

const amenitiesList = [
  'Parking',
  'Laundry',
  'Gym',
  'Pool',
  'Security',
  'Elevator',
  'Rooftop Deck',
  'Storage',
  'Pet Friendly',
  'Concierge',
];

export default function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, addProperty, updateProperty } = useApp();
  
  const isEdit = !!id;
  const existingProperty = isEdit ? properties.find(p => p.id === id) : null;

  const [formData, setFormData] = useState({
    name: existingProperty?.name || '',
    street: existingProperty?.address.street || '',
    city: existingProperty?.address.city || '',
    state: existingProperty?.address.state || '',
    zipCode: existingProperty?.address.zipCode || '',
    type: existingProperty?.type || 'apartment',
    totalUnits: existingProperty?.totalUnits || 0,
    description: existingProperty?.description || '',
    photos: existingProperty?.photos || [],
    amenities: existingProperty?.amenities || [],
    phone: existingProperty?.contactInfo.phone || '',
    email: existingProperty?.contactInfo.email || '',
    virtualTourUrl: (existingProperty as any)?.virtualTourUrl || '',
    videoTourUrl: (existingProperty as any)?.videoTourUrl || '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const propertyData = {
      name: formData.name,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      },
      type: formData.type as 'apartment' | 'house' | 'condo',
      totalUnits: Number(formData.totalUnits),
      description: formData.description,
      photos: formData.photos.length > 0 ? formData.photos : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
      amenities: formData.amenities,
      contactInfo: {
        phone: formData.phone,
        email: formData.email,
      },
      virtualTourUrl: formData.virtualTourUrl || undefined,
      videoTourUrl: formData.videoTourUrl || undefined,
    };

    if (isEdit && existingProperty) {
      updateProperty(existingProperty.id, propertyData);
      toast.success('Property updated successfully');
    } else {
      addProperty(propertyData);
      toast.success('Property added successfully');
    }

    navigate('/dashboard/properties');
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/properties')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl">{isEdit ? 'Edit Property' : 'Add New Property'}</h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Update property information' : 'Enter property details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Sunset Apartments"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Property Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="totalUnits">Total Units</Label>
                <Input
                  id="totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => handleChange('totalUnits', e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe your property..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="San Francisco"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="CA"
                  required
                />
              </div>

              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  placeholder="94102"
                  required
                />
              </div>
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
            {/* Photo Upload */}
            <div>
              <Label>Property Photos</Label>
              <p className="text-sm text-gray-500 mb-3">Upload high-quality photos of the property exterior, common areas, and amenities.</p>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {formData.photos.map((url: string, idx: number) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                      <img src={url} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
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

            {/* Video Tour */}
            <div>
              <Label className="flex items-center gap-2">
                <Video className="size-4" />
                Video Walkthrough
              </Label>
              <p className="text-sm text-gray-500 mb-3">Upload a walkthrough video of the property.</p>

              {formData.videoTourUrl && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Video className="size-4" />
                    Video uploaded
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange('videoTourUrl', '')}
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

            {/* Virtual 360 Tour URL */}
            <div>
              <Label htmlFor="virtualTourUrl" className="flex items-center gap-2">
                <Globe className="size-4" />
                360° Virtual Tour URL
              </Label>
              <p className="text-sm text-gray-500 mb-2">Paste a link from Matterport, Kuula, Google Street View, etc.</p>
              <Input
                id="virtualTourUrl"
                value={formData.virtualTourUrl}
                onChange={(e) => handleChange('virtualTourUrl', e.target.value)}
                placeholder="https://my.matterport.com/show/?m=..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {amenitiesList.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={amenity} className="cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@property.com"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/properties')}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEdit ? 'Update Property' : 'Add Property'}
          </Button>
        </div>
      </form>
    </div>
  );
}
