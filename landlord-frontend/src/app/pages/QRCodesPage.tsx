import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { QrCode, Download } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '../../lib/api';

type ApiQRCode = {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  propertyAddress: string;
  codeUrl: string;
  landingPageUrl: string;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

type ApiQRScan = {
  id: string;
  scannedAt: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
};

type ApiQRCodeDetails = ApiQRCode & {
  recentScans: ApiQRScan[];
};

type QRScanEntry = ApiQRScan & {
  unitId: string;
  unitNumber: string;
  propertyName: string;
};

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<ApiQRCode[]>([]);
  const [scanHistory, setScanHistory] = useState<QRScanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const codes = await apiRequest<ApiQRCode[]>('/api/qrcodes');
        if (!isActive) return;

        setQrCodes(codes);

        if (codes.length === 0) {
          setScanHistory([]);
          return;
        }

        const details = await Promise.all(
          codes.map((code) => apiRequest<ApiQRCodeDetails>(`/api/qrcodes/${code.id}`))
        );

        if (!isActive) return;

        const scans = details.flatMap((detail) =>
          detail.recentScans.map((scan) => ({
            ...scan,
            unitId: detail.unitId,
            unitNumber: detail.unitNumber,
            propertyName: detail.propertyName,
          }))
        );

        scans.sort(
          (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
        );

        setScanHistory(scans);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load QR codes');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, []);

  const handleDownloadQR = (qrCode: ApiQRCode) => {
    if (!qrCode.codeUrl) {
      alert('QR code image is not available yet.');
      return;
    }

    const link = document.createElement('a');
    link.href = qrCode.codeUrl;
    link.download = `qr-${qrCode.unitNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasQrCodes = qrCodes.length > 0;
  const hasScans = scanHistory.length > 0;

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
            {loading && <p className="text-sm text-gray-500">Loading QR codes...</p>}
            {!loading && error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && !hasQrCodes && (
              <p className="text-sm text-gray-500">No QR codes generated yet.</p>
            )}
            {!loading &&
              !error &&
              qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <QrCode className="size-8" />
                    </div>
                    <div>
                      <p className="text-sm">{qrCode.propertyName}</p>
                      <p className="text-xs text-gray-500">Unit {qrCode.unitNumber}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {qrCode.isActive ? 'Active' : 'Inactive'} · {qrCode.scanCount} scans
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadQR(qrCode)}
                    disabled={!qrCode.codeUrl}
                  >
                    <Download className="size-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-sm text-gray-500">Loading scans...</p>}
            {!loading && error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && !hasScans && (
              <p className="text-sm text-gray-500">No QR scans recorded yet.</p>
            )}
            {!loading &&
              !error &&
              scanHistory.map((scan) => (
                <div key={scan.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm">{scan.propertyName}</p>
                      <p className="text-xs text-gray-500">Unit {scan.unitNumber}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(scan.scannedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">Scan ID: {scan.id}</p>
                  {scan.location && (
                    <p className="text-xs text-gray-400 mt-1">
                      Location: {scan.location.latitude.toFixed(4)}, {scan.location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
