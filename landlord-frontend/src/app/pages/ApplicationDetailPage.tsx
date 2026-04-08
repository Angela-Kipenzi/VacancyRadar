import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, units, properties, updateApplication } = useApp();
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleApprove = async () => {
    setIsUpdatingStatus(true);
    const result = await updateApplication(application.id, { status: 'approved' });
    if (result.ok) {
      toast.success('Application approved');
    } else {
      toast.error(result.message || 'Unable to approve application. Please try again.');
    }
    setIsUpdatingStatus(false);
  };

  const handleReject = async () => {
    setIsUpdatingStatus(true);
    const result = await updateApplication(application.id, { status: 'rejected' });
    if (result.ok) {
      toast.success('Application rejected');
    } else {
      toast.error(result.message || 'Unable to reject application. Please try again.');
    }
    setIsUpdatingStatus(false);
  };

  const handleAddNote = () => {
    if (note.trim()) {
      setNotes([...notes, note]);
      setNote('');
      toast.success('Note added');
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/applications')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {application.applicant.firstName} {application.applicant.lastName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Applied for {property.name} - Unit {unit.unitNumber}
          </p>
        </div>
        <Badge className={`capitalize ${getStatusColor(application.status)}`}>
          {application.status}
        </Badge>
      </div>

      {/* Quick actions */}
      {application.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800">New application waiting for review</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReject} disabled={isUpdatingStatus}>
                  <XCircle className="size-4 mr-2" />
                  Reject
                </Button>
                <Button size="sm" onClick={handleApprove} disabled={isUpdatingStatus}>
                  <CheckCircle className="size-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information - Just the basics */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p>{application.applicant.firstName} {application.applicant.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{application.applicant.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p>{application.applicant.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Address</p>
              <p>{application.applicant.currentAddress}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message from applicant (if any) */}
      {application.coverLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4" />
              Message from Applicant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
          </CardContent>
        </Card>
      )}

      {/* Private Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Private Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                  {note}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a private note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="flex-1"
            />
            <Button onClick={handleAddNote} className="self-end">
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
