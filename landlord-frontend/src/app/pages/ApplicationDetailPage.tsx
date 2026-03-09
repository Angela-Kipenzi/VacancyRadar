import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, units, properties, updateApplication } = useApp();

  const application = applications.find(a => a.id === id);
  const unit = application ? units.find(u => u.id === application.unitId) : null;
  const property = application ? properties.find(p => p.id === application.propertyId) : null;

  if (!application || !unit || !property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
        <Button onClick={() => navigate('/dashboard/applications')} className="mt-4">
          Back to Applications
        </Button>
      </div>
    );
  }

  const handleApprove = () => {
    updateApplication(application.id, { status: 'approved' });
    toast.success('Application approved');
    navigate('/dashboard/applications');
  };

  const handleReject = () => {
    updateApplication(application.id, { status: 'rejected' });
    toast.success('Application rejected');
    navigate('/dashboard/applications');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/applications')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">
            {application.applicant.firstName} {application.applicant.lastName}
          </h1>
          <p className="text-gray-500 mt-1">
            Application for {property.name} - Unit {unit.unitNumber}
          </p>
        </div>
        <Badge className={`capitalize ${getStatusColor(application.status)}`}>
          {application.status}
        </Badge>
      </div>

      {application.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">This application requires your review</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReject}>
                  <XCircle className="size-4 mr-2" />
                  Reject
                </Button>
                <Button size="sm" onClick={handleApprove}>
                  <CheckCircle className="size-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <Card>
            <CardHeader>
              <CardTitle>Applicant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-sm">
                    {application.applicant.firstName} {application.applicant.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm">{application.applicant.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm">{application.applicant.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Address</p>
                  <p className="text-sm">{application.applicant.currentAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employer</p>
                  <p className="text-sm">{application.employment.employer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-sm">{application.employment.position}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Annual Income</p>
                  <p className="text-sm">${application.employment.income.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Years Employed</p>
                  <p className="text-sm">{application.employment.yearsEmployed} years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental History */}
          <Card>
            <CardHeader>
              <CardTitle>Rental History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.rentalHistory.map((history, index) => (
                <div key={index} className="pb-4 border-b last:border-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Previous Address</p>
                      <p className="text-sm">{history.previousAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Years Rented</p>
                      <p className="text-sm">{history.yearsRented} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Landlord Name</p>
                      <p className="text-sm">{history.landlordName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Landlord Phone</p>
                      <p className="text-sm">{history.landlordPhone}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="size-5 text-gray-500" />
                      <div>
                        <p className="text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.type}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          {application.coverLetter && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.coverLetter}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-sm">
                  {format(new Date(application.submittedAt), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-400">
                  {format(new Date(application.submittedAt), 'h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Unit Information */}
          <Card>
            <CardHeader>
              <CardTitle>Unit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="text-sm">{property.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Number</p>
                <p className="text-sm">{unit.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="text-sm">${unit.monthlyRent}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit Size</p>
                <p className="text-sm">
                  {unit.bedrooms} bed • {unit.bathrooms} bath • {unit.squareFeet} sqft
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.notes.length > 0 ? (
                <div className="space-y-2">
                  {application.notes.map((note, index) => (
                    <p key={index} className="text-sm p-2 bg-gray-50 rounded">
                      {note}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No notes yet</p>
              )}
              <Textarea
                placeholder="Add a note..."
                rows={3}
                className="mt-2"
              />
              <Button size="sm" className="w-full">Add Note</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
