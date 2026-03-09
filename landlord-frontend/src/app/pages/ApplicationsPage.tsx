import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { FileText, Search } from 'lucide-react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function ApplicationsPage() {
  const { applications, units, properties } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      <div>
        <h1 className="text-3xl">Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage rental applications</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search applications..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">No applications found</h3>
            <p className="text-gray-500">Applications will appear here when renters apply</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => {
            const unit = units.find(u => u.id === application.unitId);
            const property = properties.find(p => p.id === application.propertyId);
            
            return (
              <Link key={application.id} to={`/dashboard/applications/${application.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </h3>
                          <Badge className={`capitalize ${getStatusColor(application.status)}`}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Unit:</strong> {property?.name} - Unit {unit?.unitNumber}</p>
                          <p><strong>Email:</strong> {application.applicant.email}</p>
                          <p><strong>Phone:</strong> {application.applicant.phone}</p>
                          <p><strong>Employer:</strong> {application.employment.employer}</p>
                          <p><strong>Income:</strong> ${application.employment.income.toLocaleString()}/year</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>Submitted</p>
                        <p>{format(new Date(application.submittedAt), 'MMM d, yyyy')}</p>
                        <p>{format(new Date(application.submittedAt), 'h:mm a')}</p>
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
