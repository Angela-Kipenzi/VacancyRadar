import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { QrCode, Download } from 'lucide-react';
import { mockQRScans } from '../../data/mockData';
import { format } from 'date-fns';

export default function QRCodesPage() {
  const { units, properties } = useApp();

  const handleDownloadQR = (unitId: string) => {
    // Mock download functionality
    alert('QR Code download feature would trigger here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">QR Codes</h1>
        <p className="text-gray-500 mt-1">Manage QR codes for your units</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Unit QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {units.map((unit) => {
              const property = properties.find(p => p.id === unit.propertyId);
              return (
                <div key={unit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <QrCode className="size-8" />
                    </div>
                    <div>
                      <p className="text-sm">{property?.name}</p>
                      <p className="text-xs text-gray-500">Unit {unit.unitNumber}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{unit.qrCode}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadQR(unit.id)}>
                    <Download className="size-4 mr-2" />
                    Download
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockQRScans.map((scan) => {
              const unit = units.find(u => u.id === scan.unitId);
              const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
              
              return (
                <div key={scan.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm">{scan.scannedBy.name}</p>
                      <p className="text-xs text-gray-500">{scan.scannedBy.email}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(scan.scannedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Scanned: {property?.name} - Unit {unit?.unitNumber}
                  </p>
                  {scan.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      Location: {scan.location.latitude.toFixed(4)}, {scan.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
