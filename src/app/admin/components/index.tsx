// Advanced Admin Components

export function SystemAnalytics() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">System Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">User Growth</h3>
            <div className="text-2xl font-bold text-blue-600">+15.3%</div>
            <p className="text-sm text-gray-500">vs last month</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Revenue</h3>
            <div className="text-2xl font-bold text-green-600">$12,450</div>
            <p className="text-sm text-gray-500">MRR</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailTemplates() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h2>
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium">Welcome Email</h3>
            <p className="text-sm text-gray-600 mt-1">Sent when users first sign up</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium">Pro Upgrade</h3>
            <p className="text-sm text-gray-600 mt-1">Sent when users upgrade to Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
