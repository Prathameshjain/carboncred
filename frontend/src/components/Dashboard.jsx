import React from 'react';
import { Home, FileText, BarChart3, Settings, User, ChevronRight, Leaf, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function CarbonDashboard() {
  const stats = [
    { title: 'Total Users', value: '1,200', icon: Users, color: 'text-green-600' },
    { title: 'New Users', value: '150', icon: User, color: 'text-emerald-600' },
    { title: 'Total Sales', value: '$4,300', icon: DollarSign, color: 'text-green-700' },
    { title: 'Sales Growth', value: '32%', icon: TrendingUp, color: 'text-emerald-700' }
  ];

  const activities = [
    { user: 'John Doe', action: 'created a new account', time: '2 hours ago' },
    { user: 'Jane Smith', action: 'purchased carbon credits', time: '3 hours ago' },
    { user: 'John Doe', action: 'updated profile', time: '5 hours ago' },
    { user: 'Tim Lee', action: 'created a new account', time: '1 day ago' }
  ];

  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: FileText, label: 'Reports', active: false },
    { icon: BarChart3, label: 'Analytics', active: false },
    { icon: Settings, label: 'Settings', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-90 bg-gradient-to-b from-green-600 to-green-900 shadow-xl rounded-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Leaf className="w-15 h-6 text-white" />
            </div>
            <h1 className="text-white tracking-wide">CarbonCred</h1>
          </div>
          
          <nav className="space-y-2 ">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href="#"
                className={`flex items-center text-white space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  item.active
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back to your carbon trading hub</p>
              </div>
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-semibold text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-green-50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
              <p className="text-gray-600 text-sm mt-1">Latest actions on your platform</p>
            </div>
            <div className="divide-y divide-gray-50">
              {activities.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-900 font-medium">
                          User <span className="font-semibold text-green-700">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}