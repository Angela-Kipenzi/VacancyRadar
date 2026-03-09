import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Building2, DoorOpen, FileText, DollarSign, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { format } from 'date-fns';

export default function DashboardHome() {
  const { properties, units, applications, leases, notifications } = useApp();

  const totalProperties = properties.length;
  const totalUnits = units.length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  
  // Calculate monthly revenue estimate from active leases
  const monthlyRevenue = leases
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.monthlyRent, 0);

  const stats = [
    {
      name: 'Total Properties',
      value: totalProperties,
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Total Units',
      value: totalUnits,
      icon: DoorOpen,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      name: 'Current Vacancies',
      value: vacantUnits,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      name: 'Pending Applications',
      value: pendingApplications,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      name: 'Monthly Revenue',
      value: `$${monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your property overview.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/properties/new">
            <Button>
              <Plus className="size-4 mr-2" />
              Add Property
            </Button>
          </Link>
          <Link to="/dashboard/applications">
            <Button variant="outline">View Applications</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.name}</p>
                    <p className="text-2xl mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${
                      notification.type === 'application' ? 'bg-purple-50' :
                      notification.type === 'qr_scan' ? 'bg-blue-50' :
                      notification.type === 'lease_signed' ? 'bg-green-50' :
                      'bg-gray-50'
                    }`}>
                      {notification.type === 'application' && <FileText className="size-4 text-purple-600" />}
                      {notification.type === 'qr_scan' && <TrendingUp className="size-4 text-blue-600" />}
                      {notification.type === 'lease_signed' && <DollarSign className="size-4 text-green-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="shrink-0">New</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Link to="/dashboard/notifications">
              <Button variant="outline" className="w-full mt-4">
                View All Activity
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Vacant Units */}
        <Card>
          <CardHeader>
            <CardTitle>Vacant Units</CardTitle>
          </CardHeader>
          <CardContent>
            {vacantUnits === 0 ? (
              <p className="text-gray-500 text-center py-8">All units are occupied!</p>
            ) : (
              <div className="space-y-4">
                {units
                  .filter(u => u.status === 'vacant')
                  .slice(0, 5)
                  .map((unit) => {
                    const property = properties.find(p => p.id === unit.propertyId);
                    return (
                      <Link
                        key={unit.id}
                        to={`/dashboard/units/${unit.id}`}
                        className="block pb-4 border-b last:border-0 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm">{property?.name} - Unit {unit.unitNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {unit.bedrooms} bed • {unit.bathrooms} bath • {unit.squareFeet} sqft
                            </p>
                          </div>
                          <p className="text-sm">${unit.monthlyRent}/mo</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Available: {format(new Date(unit.availabilityDate), 'MMM d, yyyy')}
                        </p>
                      </Link>
                    );
                  })}
              </div>
            )}
            <Link to="/dashboard/units?filter=vacant">
              <Button variant="outline" className="w-full mt-4">
                View All Vacant Units
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pending Applications */}
      {pendingApplications > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications
                .filter(a => a.status === 'pending')
                .slice(0, 3)
                .map((application) => {
                  const unit = units.find(u => u.id === application.unitId);
                  const property = properties.find(p => p.id === application.propertyId);
                  return (
                    <Link
                      key={application.id}
                      to={`/dashboard/applications/${application.id}`}
                      className="block pb-4 border-b last:border-0 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied for: {property?.name} - Unit {unit?.unitNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            Income: ${application.employment.income.toLocaleString()}/year
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">Pending</Badge>
                          <p className="text-xs text-gray-500 mt-2">
                            {format(new Date(application.submittedAt), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
            <Link to="/dashboard/applications">
              <Button variant="outline" className="w-full mt-4">
                View All Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
