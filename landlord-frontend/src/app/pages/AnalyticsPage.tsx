import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { properties, units, leases, applications } = useApp();

  // Occupancy data
  const occupancyData = [
    { month: 'Jan', occupied: 85, vacant: 15 },
    { month: 'Feb', occupied: 88, vacant: 12 },
    { month: 'Mar', occupied: 90, vacant: 10 },
    { month: 'Apr', occupied: 92, vacant: 8 },
    { month: 'May', occupied: 95, vacant: 5 },
    { month: 'Jun', occupied: 93, vacant: 7 },
  ];

  // Revenue data
  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 48000 },
    { month: 'Mar', revenue: 52000 },
    { month: 'Apr', revenue: 55000 },
    { month: 'May', revenue: 58000 },
    { month: 'Jun', revenue: 60000 },
  ];

  // Unit status distribution
  const statusData = [
    { name: 'Vacant', value: units.filter(u => u.status === 'vacant').length },
    { name: 'Occupied', value: units.filter(u => u.status === 'occupied').length },
    { name: 'Vacating', value: units.filter(u => u.status === 'vacating').length },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  // Applications by month
  const applicationData = [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 15 },
    { month: 'Mar', count: 18 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 25 },
    { month: 'Jun', count: 20 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Analytics</h1>
        <p className="text-gray-500 mt-1">View your property performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Occupancy Rate</p>
            <p className="text-3xl mt-2">
              {Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Properties</p>
            <p className="text-3xl mt-2">{properties.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-3xl mt-2">{units.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Active Leases</p>
            <p className="text-3xl mt-2">{leases.filter(l => l.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="occupied" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="vacant" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Unit Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Applications Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Application Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={applicationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Total Units</th>
                  <th className="text-left p-3">Occupied</th>
                  <th className="text-left p-3">Vacant</th>
                  <th className="text-left p-3">Occupancy Rate</th>
                  <th className="text-left p-3">Monthly Revenue</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const propertyUnits = units.filter(u => u.propertyId === property.id);
                  const occupied = propertyUnits.filter(u => u.status === 'occupied').length;
                  const vacant = propertyUnits.filter(u => u.status === 'vacant').length;
                  const occupancyRate = propertyUnits.length > 0 ? (occupied / propertyUnits.length) * 100 : 0;
                  const revenue = leases
                    .filter(l => l.propertyId === property.id && l.status === 'active')
                    .reduce((sum, l) => sum + l.monthlyRent, 0);

                  return (
                    <tr key={property.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{property.name}</td>
                      <td className="p-3">{propertyUnits.length}</td>
                      <td className="p-3">{occupied}</td>
                      <td className="p-3">{vacant}</td>
                      <td className="p-3">{occupancyRate.toFixed(0)}%</td>
                      <td className="p-3">${revenue.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
